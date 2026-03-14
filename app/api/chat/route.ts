import OpenAI from "openai";
import { NextRequest } from "next/server";
import {
  calculateTCS,
  optimizeFamilyTCS,
  getLTCGEffectiveRate,
  getSTCGEffectiveRate,
  getSurchargeRate,
  getSlabRate,
  bracketToIncome,
  type LRSPurpose,
  type IncomeBracket,
  type TaxRegime,
} from "@/lib/tax-calculations";
import { runTLHScan, getTLHSummary } from "@/lib/tlh-engine";
import { FAMILY_MEMBERS } from "@/lib/mock-data";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID;
const USD_INR = 83.5;

// ─── Tool Definitions ─────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "calculate_tcs",
      description: "Calculate TCS (Tax Collected at Source) on an LRS remittance. Use whenever the user asks about TCS on a specific amount, how much TCS will be deducted, or whether a remittance is above the threshold.",
      parameters: {
        type: "object",
        properties: {
          remittance_inr: { type: "number", description: "Planned remittance amount in INR (e.g., 5000000 for ₹50L)" },
          purpose: {
            type: "string",
            enum: ["investment", "education_loan", "education_self", "medical", "tour_package", "gift"],
            description: "Purpose of remittance. Default to 'investment' for GIFT City IFSC funds.",
          },
          fy_cumulative_inr: {
            type: "number",
            description: "Amount already remitted this FY in INR. Defaults to 0 if not specified.",
          },
        },
        required: ["remittance_inr", "purpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_capital_gains",
      description: "Calculate STCG or LTCG tax on an IFSC/overseas fund redemption. Use when user provides buy price, sell price, quantity, or asks about tax on a specific trade.",
      parameters: {
        type: "object",
        properties: {
          buy_price_usd: { type: "number", description: "Purchase price per unit in USD" },
          sell_price_usd: { type: "number", description: "Redemption price per unit in USD" },
          quantity: { type: "number", description: "Number of units" },
          holding_months: { type: "number", description: "Holding period in months (>24 = LTCG, ≤24 = STCG)" },
          income_bracket: {
            type: "string",
            enum: ["up_to_50L", "50L_to_1Cr", "1Cr_to_2Cr", "2Cr_to_5Cr", "above_5Cr"],
            description: "Investor's total annual income bracket. Default to 'above_5Cr' for HNI.",
          },
          regime: {
            type: "string",
            enum: ["old", "new"],
            description: "Tax regime. Default to 'old'.",
          },
        },
        required: ["buy_price_usd", "sell_price_usd", "quantity", "holding_months", "income_bracket"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "optimize_family_tcs",
      description: "Optimize TCS by splitting a planned LRS remittance across family members. Use when user asks how to reduce TCS, family splitting, or optimal distribution.",
      parameters: {
        type: "object",
        properties: {
          total_remittance_inr: { type: "number", description: "Total planned remittance in INR" },
          purpose: { type: "string", enum: ["investment", "education_loan", "education_self", "medical", "tour_package", "gift"] },
          members: {
            type: "array",
            description: "Family members with their existing FY remittances. If not provided, uses Rajesh family defaults.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                fy_remitted_inr: { type: "number", description: "Amount already remitted this FY by this member" },
              },
              required: ["name", "fy_remitted_inr"],
            },
          },
        },
        required: ["total_remittance_inr", "purpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tlh_opportunities",
      description: "Fetch the current tax loss harvesting opportunities from the portfolio. Use when user asks about TLH, what losses to harvest, or how much tax they can save.",
      parameters: {
        type: "object",
        properties: {
          income_bracket: {
            type: "string",
            enum: ["up_to_50L", "50L_to_1Cr", "1Cr_to_2Cr", "2Cr_to_5Cr", "above_5Cr"],
            description: "Income bracket to compute savings. Defaults to above_5Cr.",
          },
          existing_stcg_inr: {
            type: "number",
            description: "Existing STCG in current FY in INR. Defaults to 2200000 (₹22L).",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tax_rates",
      description: "Show effective STCG and LTCG rates for a given income bracket. Use when user asks about tax rates, what percentage tax, or rate comparison.",
      parameters: {
        type: "object",
        properties: {
          income_bracket: {
            type: "string",
            enum: ["up_to_50L", "50L_to_1Cr", "1Cr_to_2Cr", "2Cr_to_5Cr", "above_5Cr"],
          },
          regime: { type: "string", enum: ["old", "new"] },
        },
        required: ["income_bracket"],
      },
    },
  },
];

// ─── Tool Executors ───────────────────────────────────────────────────────

function execCalculateTCS(args: {
  remittance_inr: number;
  purpose: LRSPurpose;
  fy_cumulative_inr?: number;
}) {
  const cumulative = args.fy_cumulative_inr ?? 0;
  const result = calculateTCS(args.remittance_inr, args.purpose, cumulative);
  const THRESHOLD = 1_000_000;
  const totalAfter = cumulative + args.remittance_inr;
  const taxableAbove = Math.max(0, totalAfter - THRESHOLD) - Math.max(0, cumulative - THRESHOLD);

  return {
    type: "tcs_result" as const,
    remittanceINR: args.remittance_inr,
    purpose: args.purpose,
    fyCumulativeINR: cumulative,
    thresholdINR: THRESHOLD,
    totalAfterINR: totalAfter,
    taxableAmountINR: taxableAbove,
    tcsAmount: result.tcsAmount,
    tcsRate: result.tcsRate,
    effectiveRate: result.effectiveRate,
    breakdown: result.breakdown,
    isAboveThreshold: totalAfter > THRESHOLD,
    remainingFree: Math.max(0, THRESHOLD - cumulative),
  };
}

function execCalculateCapitalGains(args: {
  buy_price_usd: number;
  sell_price_usd: number;
  quantity: number;
  holding_months: number;
  income_bracket: IncomeBracket;
  regime?: TaxRegime;
}) {
  const regime = args.regime ?? "old";
  const income = bracketToIncome(args.income_bracket);
  const holdingDays = Math.round(args.holding_months * 30.4);
  const isLTCG = holdingDays > 730;
  const gainUSD = (args.sell_price_usd - args.buy_price_usd) * args.quantity;
  const gainINR = gainUSD * USD_INR;
  const isLoss = gainINR < 0;

  const stcgRate = getSTCGEffectiveRate(income, regime);
  const ltcgRate = getLTCGEffectiveRate(income, regime);
  const effectiveRate = isLTCG ? ltcgRate : stcgRate;
  const taxAmount = isLoss ? 0 : Math.abs(gainINR) * effectiveRate;
  const netProceeds = args.sell_price_usd * args.quantity * USD_INR - taxAmount;

  const surcharge = getSurchargeRate(income, regime);
  const appliedSurcharge = isLTCG ? Math.min(surcharge, 0.15) : surcharge;
  const baseRate = isLTCG ? 0.125 : getSlabRate(income, regime);

  return {
    type: "cg_result" as const,
    gainType: isLTCG ? "LTCG" : (isLoss ? (holdingDays <= 730 ? "STCL" : "LTCL") : "STCG"),
    holdingDays,
    holdingMonths: args.holding_months,
    gainINR,
    gainUSD,
    isLoss,
    isLTCG,
    effectiveRate,
    taxAmount,
    netProceeds,
    baseRate,
    appliedSurcharge,
    formula: isLTCG
      ? `12.5% × (1 + ${(appliedSurcharge * 100).toFixed(0)}% cap) × 1.04 = ${(effectiveRate * 100).toFixed(2)}%`
      : `${(baseRate * 100).toFixed(0)}% × (1 + ${(appliedSurcharge * 100).toFixed(0)}%) × 1.04 = ${(effectiveRate * 100).toFixed(2)}%`,
    daysToLTCG: Math.max(0, 730 - holdingDays),
    savingByWaiting: isLTCG ? 0 : (isLoss ? 0 : Math.abs(gainINR) * (stcgRate - ltcgRate)),
    incomeBracket: args.income_bracket,
    regime,
  };
}

function execOptimizeFamilyTCS(args: {
  total_remittance_inr: number;
  purpose: LRSPurpose;
  members?: { name: string; fy_remitted_inr: number }[];
}) {
  const members = args.members ?? FAMILY_MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    fyRemittedINR: m.fyRemittedINR,
  }));

  const membersForCalc = members.map((m, i) => ({
    id: (m as { id?: string }).id ?? `m${i}`,
    name: m.name,
    fyRemittedINR: (m as { fyRemittedINR?: number }).fyRemittedINR ?? (m as { fy_remitted_inr?: number }).fy_remitted_inr ?? 0,
  }));

  const result = optimizeFamilyTCS(membersForCalc, args.total_remittance_inr, args.purpose);

  const singleMember = membersForCalc.sort((a, b) => b.fyRemittedINR - a.fyRemittedINR)[0];
  const singlePANTCS = calculateTCS(args.total_remittance_inr, args.purpose, singleMember.fyRemittedINR).tcsAmount;

  return {
    type: "family_split" as const,
    totalRemittanceINR: args.total_remittance_inr,
    purpose: args.purpose,
    memberCount: membersForCalc.length,
    singlePANTCS,
    optimizedTCS: result.totalTCS,
    tcsSavings: Math.max(0, result.tcsSavings),
    allocations: result.allocations,
    recommendation: result.recommendation,
    zeroTCSCapacity: membersForCalc.reduce(
      (s, m) => s + Math.max(0, 1_000_000 - m.fyRemittedINR), 0
    ),
  };
}

function execGetTLHOpportunities(args: {
  income_bracket?: IncomeBracket;
  existing_stcg_inr?: number;
}) {
  const income = bracketToIncome(args.income_bracket ?? "above_5Cr");
  const existingSTCG = args.existing_stcg_inr ?? 2_200_000;
  const opps = runTLHScan(income, "old", existingSTCG, 50_000);
  const summary = getTLHSummary(opps);

  return {
    type: "tlh_opportunities" as const,
    incomeBracket: args.income_bracket ?? "above_5Cr",
    summary,
    topOpportunities: opps.slice(0, 4).map((o) => ({
      name: o.holding.name,
      symbol: o.holding.symbol,
      isSTCL: o.isSTCL,
      unrealizedLossINR: o.unrealizedLossINR,
      unrealizedLossPercent: o.unrealizedLossPercent,
      bestCaseSavings: o.bestCaseSavings,
      netBenefit: o.netBenefit,
      holdingDays: o.holdingDays,
      priorityScore: o.priorityScore,
      urgency: o.urgency,
      recommendation: o.recommendation,
    })),
  };
}

function execGetTaxRates(args: {
  income_bracket: IncomeBracket;
  regime?: TaxRegime;
}) {
  const regime = args.regime ?? "old";
  const income = bracketToIncome(args.income_bracket);
  const stcgRate = getSTCGEffectiveRate(income, regime);
  const ltcgRate = getLTCGEffectiveRate(income, regime);
  const surcharge = getSurchargeRate(income, regime);
  const slabRate = getSlabRate(income, regime);

  return {
    type: "tax_rates" as const,
    incomeBracket: args.income_bracket,
    regime,
    stcgRate,
    ltcgRate,
    spread: stcgRate - ltcgRate,
    baseSTCG: slabRate,
    baseLTCG: 0.125,
    surcharge,
    ltcgSurcharge: Math.min(surcharge, 0.15),
    cess: 0.04,
    stcgFormula: `${(slabRate * 100).toFixed(0)}% × (1 + ${(surcharge * 100).toFixed(0)}%) × 1.04`,
    ltcgFormula: `12.5% × (1 + ${(Math.min(surcharge, 0.15) * 100).toFixed(0)}% cap) × 1.04`,
    savingPerLakh: Math.round((stcgRate - ltcgRate) * 100_000),
    isMaxBracket: args.income_bracket === "above_5Cr",
    capBenefit: surcharge > 0.15 ? `Surcharge cap saves ${((surcharge - 0.15) * 0.125 * 1.04 * 100).toFixed(2)}pp on LTCG` : null,
  };
}

// ─── Tool dispatch ────────────────────────────────────────────────────────

function executeTool(name: string, args: Record<string, unknown>): Record<string, unknown> {
  switch (name) {
    case "calculate_tcs":
      return execCalculateTCS(args as Parameters<typeof execCalculateTCS>[0]);
    case "calculate_capital_gains":
      return execCalculateCapitalGains(args as Parameters<typeof execCalculateCapitalGains>[0]);
    case "optimize_family_tcs":
      return execOptimizeFamilyTCS(args as Parameters<typeof execOptimizeFamilyTCS>[0]);
    case "get_tlh_opportunities":
      return execGetTLHOpportunities(args as Parameters<typeof execGetTLHOpportunities>[0]);
    case "get_tax_rates":
      return execGetTaxRates(args as Parameters<typeof execGetTaxRates>[0]);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert Indian tax advisor and agentic financial assistant embedded in a GIFT City IFSC Tax Loss Harvesting platform. You help Indian HNI investors and MFDs understand and optimize their tax situation.

YOU HAVE ACCESS TO LIVE CALCULATION TOOLS — use them proactively whenever a calculation would be helpful.

TOOLS AVAILABLE:
- calculate_tcs: Compute exact TCS on any LRS remittance
- calculate_capital_gains: Compute STCG/LTCG tax on any IFSC fund trade
- optimize_family_tcs: Find optimal split across family members to minimize TCS
- get_tlh_opportunities: Pull live TLH opportunities from the portfolio
- get_tax_rates: Show effective rates for any income bracket

WHEN TO CALL TOOLS:
- Any mention of a specific rupee amount with TCS → call calculate_tcs
- Any mention of buy/sell price or holding period → call calculate_capital_gains  
- Any question about family splitting → call optimize_family_tcs
- Any question about TLH, losses, harvesting → call get_tlh_opportunities
- Any question about "what rate" or "how much tax" → call get_tax_rates
- ALWAYS call at least one tool if calculations are relevant

KEY FACTS:
- LTCG: 12.5% × (1 + min(surcharge,15%)) × 1.04 = MAX 14.95% (Section 112)
- STCG: slab × (1 + surcharge, no cap) × 1.04 = MAX 42.74% old regime
- Holding period: 730 days for LTCG
- TCS: 0% ≤₹10L per PAN per FY, 20% above for investment
- India: NO wash sale rules — rebuy same fund same day after harvesting loss
- STCL offsets STCG (42.74%) AND LTCG (14.95%); LTCL offsets LTCG ONLY
- Carry-forward: 8 years, but file ITR by July 31 or lose it forever

RESPONSE STYLE:
- After calling a tool, explain the result conversationally but precisely
- Point out the key number (TCS amount, tax saving, effective rate)
- Mention what action the user should take
- Keep responses concise — the widget shows the full calculation
- Always end with: *For specific advice, consult a qualified CA.*`;

// ─── SSE helpers ─────────────────────────────────────────────────────────

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ─── Route Handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages, query } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
    query: string;
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(sseEvent(data)));

      try {
        // ── Step 1: RAG Search ──────────────────────────────────────────
        send({ type: "status", message: "Searching regulations…" });
        let ragContext = "";
        const sources: string[] = [];

        if (VECTOR_STORE_ID) {
          try {
            const results = await openai.vectorStores.search(VECTOR_STORE_ID, {
              query,
              max_num_results: 5,
              rewrite_query: true,
            });
            if (results.data.length > 0) {
              ragContext = results.data
                .map((r) => `<source file="${r.filename}" score="${r.score.toFixed(2)}">\n${r.content.map((c) => c.text).join("\n")}\n</source>`)
                .join("\n\n");
              results.data.forEach((r) => {
                if (!sources.includes(r.filename)) sources.push(r.filename);
              });
            }
          } catch { /* continue without RAG */ }
        }

        // ── Step 2: First call — detect tool needs ──────────────────────
        send({ type: "status", message: "Thinking…" });

        const systemWithRAG = SYSTEM_PROMPT + (ragContext
          ? `\n\nRELEVANT REGULATORY CONTEXT (from knowledge base):\n${ragContext}`
          : "");

        const firstResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemWithRAG },
            ...messages,
          ],
          tools: TOOLS,
          tool_choice: "auto",
          temperature: 0.15,
        });

        const assistantMsg = firstResponse.choices[0].message;
        const toolCalls = assistantMsg.tool_calls ?? [];
        const widgets: Record<string, unknown>[] = [];

        // ── Step 3: Execute tool calls ──────────────────────────────────
        const toolResults: { role: "tool"; tool_call_id: string; content: string }[] = [];

        for (const toolCall of toolCalls) {
          send({ type: "tool_start", tool: toolCall.function.name });

          const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
          const result = executeTool(toolCall.function.name, args);

          widgets.push(result);
          send({ type: "widget", widget: result });

          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });

          send({ type: "tool_done", tool: toolCall.function.name });
        }

        // ── Step 4: Final synthesis (streaming) ─────────────────────────
        send({ type: "text_start" });

        const conversationWithTools = [
          { role: "system" as const, content: systemWithRAG },
          ...messages,
          ...(toolCalls.length > 0 ? [
            { role: "assistant" as const, content: null, tool_calls: toolCalls } as OpenAI.Chat.Completions.ChatCompletionMessageParam,
            ...toolResults as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
          ] : []),
        ];

        // If no tool calls at all, still produce text from the first response
        if (toolCalls.length === 0 && assistantMsg.content) {
          send({ type: "text_chunk", content: assistantMsg.content });
          send({ type: "done", sources, widgetCount: 0 });
          controller.close();
          return;
        }

        const finalStream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: conversationWithTools,
          stream: true,
          temperature: 0.15,
          max_tokens: 800,
        });

        for await (const chunk of finalStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) send({ type: "text_chunk", content: delta });
        }

        send({ type: "done", sources, widgetCount: widgets.length });
        controller.close();
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
