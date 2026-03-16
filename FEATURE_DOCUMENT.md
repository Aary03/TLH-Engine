# Valura GIFT City — Full Feature Document
> **Purpose of this document:** Complete technical and product specification of the Valura TLH platform. Use this to add AI features, build new pages, or extend existing functionality. All tax rules, formulas, file paths, and API shapes are described exactly as implemented.

---

## 1. Project Overview

**Name:** Valura — GIFT City Tax Optimizer  
**Purpose:** Free, precision tax calculators for Indian HNI investors who invest globally via GIFT City IFSC. The platform models TCS, capital gains, US estate tax, DTAA/FTC, NRI residency, and full after-tax net returns — plus an agentic AI advisor and algorithmic tax-loss harvesting engine.  
**Primary users:** Indian HNIs (₹50L+ portfolio), NRIs investing via GIFT City, returning NRIs in RNOR window, Resident Indians with foreign income.  
**Tax year:** FY 2025-26, Finance Act 2025. All hardcoded tax rates are as of April 1, 2025.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + custom CSS variables |
| UI components | shadcn/ui + Radix UI |
| Charts | Recharts 3 (ComposedChart, BarChart, AreaChart, LineChart) |
| Forms | React Hook Form + Zod (chat page) |
| AI/LLM | OpenAI GPT-4o (chat completions + function calling + streaming) |
| RAG | OpenAI Vector Stores (file_search tool) |
| Streaming | Server-Sent Events (SSE) via Next.js Route Handler |
| Fonts | Google Fonts: Bricolage Grotesque (800), Manrope (600-700), Inter (400-500) |
| Icons | lucide-react |
| Package manager | npm |

### Brand Colors
```
Background:     #FFFFFC  (off-white)
Primary dark:   #00111B
Primary green:  #05A049
Mint accent:    #B4E3C8
Gold accent:    #B8913A
Danger red:     #DC2626
Estate danger:  #7A2020
Deep blue:      #2B4A8A
```

### CSS Font Variables
```css
--font-bricolage   /* Bricolage Grotesque — page titles */
--font-manrope     /* Manrope — section headings */
--font-inter       /* Inter — body text (default) */
```

---

## 3. Repository Structure

```
/
├── app/
│   ├── layout.tsx                    # Root layout: Sidebar + main (md:ml-[240px], pt-14 md:pt-0)
│   ├── page.tsx                      # Landing page (calculator hub)
│   ├── globals.css                   # CSS variables, Tailwind base
│   ├── api/
│   │   └── chat/
│   │       └── route.ts              # SSE streaming API — GPT-4o + 6 tools + RAG
│   ├── blog/
│   │   ├── page.tsx                  # Blog index
│   │   └── [slug]/page.tsx           # Blog article (static, generateStaticParams)
│   ├── calculator/
│   │   └── page.tsx                  # Legacy capital gains (internal tool, not in nav)
│   ├── calculators/
│   │   ├── lrs-tcs/page.tsx          # LRS & TCS calculator
│   │   ├── capital-gains/page.tsx    # Capital Gains calculator
│   │   ├── dtaa/page.tsx             # DTAA / FTC calculator
│   │   ├── estate-tax/page.tsx       # US Estate Tax calculator
│   │   ├── nri-status/page.tsx       # NRI Status (Section 6) checker
│   │   ├── net-returns/page.tsx      # Net Returns flagship (Direct vs Valura)
│   │   └── docs/page.tsx             # Calculator guide with worked examples
│   ├── chat/page.tsx                 # Agentic AI Advisor
│   ├── lrs/page.tsx                  # LRS Tracker (family remittance)
│   ├── portfolio/page.tsx            # Portfolio manager (hidden from nav)
│   └── tlh/page.tsx                  # TLH Engine
├── components/
│   ├── layout/
│   │   └── sidebar.tsx               # Sidebar with mobile drawer
│   ├── chat/
│   │   └── widgets.tsx               # WidgetRenderer + ToolPill (chat UI)
│   └── ui/                           # shadcn/ui components
├── lib/
│   ├── tax-calculations.ts           # Core tax engine (TCS, STCG, LTCG, surcharge, cess)
│   ├── tlh-engine.ts                 # TLH scan + priority scoring
│   ├── mock-data.ts                  # Demo portfolio holdings + family data
│   ├── portfolio-store.ts            # Portfolio CRUD (localStorage-backed)
│   ├── blog-data.ts                  # Blog posts (static data)
│   └── utils.ts                      # cn() utility
└── .env.local                        # OPENAI_API_KEY, OPENAI_VECTOR_STORE_ID
```

---

## 4. Navigation Structure (Sidebar)

```
HOME
  Overview        /                   (landing page)
  Blog            /blog               (GIFT City knowledge base)

CALCULATORS
  Net Returns     /calculators/net-returns    (flagship)
  LRS & TCS       /calculators/lrs-tcs
  Capital Gains   /calculators/capital-gains
  DTAA / FTC      /calculators/dtaa
  Estate Tax      /calculators/estate-tax
  NRI Status      /calculators/nri-status
  Calc Guide      /calculators/docs

TOOLS
  LRS Tracker     /lrs
  TLH Engine      /tlh
  AI Advisor      /chat
```

**Mobile behavior:** Sidebar is hidden on mobile behind a hamburger button. Tap hamburger → slide-in drawer with backdrop. Route change auto-closes drawer. Fixed 56px topbar on mobile (dark, shows logo + FY badge).

---

## 5. Core Tax Engine (`lib/tax-calculations.ts`)

### 5.1 Slab Rates (FY 2025-26)

**New Regime:**
```
≤ ₹3L    → 0%
₹3-7L    → 5%
₹7-10L   → 10%
₹10-12L  → 15%
₹12-15L  → 20%
> ₹15L   → 30%
```

**Old Regime:**
```
≤ ₹2.5L  → 0%
₹2.5-5L  → 5%
₹5-10L   → 20%
> ₹10L   → 30%
```

### 5.2 Surcharge Rates

| Total Income | Rate |
|---|---|
| ≤ ₹50L | 0% |
| ₹50L–₹1Cr | 10% |
| ₹1Cr–₹2Cr | 15% |
| ₹2Cr–₹5Cr | 25% |
| > ₹5Cr (New) | 25% |
| > ₹5Cr (Old) | 37% |

**Critical rule:** Surcharge on LTCG is **capped at 15%** regardless of income (Section 112). No cap on STCG.

### 5.3 Capital Gains Formulas

**LTCG (holding > 730 days):**
```
Effective rate = 12.5% × (1 + min(surcharge, 15%)) × 1.04
Maximum = 12.5% × 1.15 × 1.04 = 14.95%
```

**STCG (holding ≤ 730 days):**
```
Effective rate = slabRate × (1 + surcharge) × 1.04
Maximum (old regime, >5Cr) = 30% × 1.37 × 1.04 = 42.744%
```

### 5.4 TCS (Tax Collected at Source)

| Purpose | Threshold | Rate above threshold |
|---|---|---|
| Investment | ₹10L/PAN/FY | 20% |
| Education (self-funded) | ₹10L/PAN/FY | 5% |
| Education via Sec 80E loan | — | 0% |
| Medical | ₹10L/PAN/FY | 5% |

**Formula:**
```
taxablePortion = max(0, remittance + fyAlreadyRemitted - threshold)
TCS amount = taxablePortion × rate
Effective TCS rate = TCS / remittance
```

**Family optimization:** Each adult PAN has its own ₹10L threshold. Algorithm fills each member's remaining threshold bucket in order to minimize total TCS.

**IRR opportunity cost:**
```
opportunityCost = TCS × annualReturn × (lockupMonths / 12)
```

**Advance tax lock-up (next installment dates):**
```
Jan → Mar 15 ≈ 1.5mo | Feb → Mar 15 ≈ 0.5mo | Mar → Mar 15 ≈ 0.5mo
Apr → Jun 15 ≈ 2.5mo | May → Jun 15 ≈ 1.5mo | Jun → Sep 15 ≈ 3mo
Jul → Sep 15 ≈ 2mo   | Aug → Sep 15 ≈ 1.5mo | Sep → Dec 15 ≈ 2.5mo
Oct → Dec 15 ≈ 1.5mo | Nov → Dec 15 ≈ 1mo   | Dec → Mar 15 ≈ 2.5mo
```

### 5.5 Loss Carry-Forward Rules
- STCL offsets: STCG and LTCG
- LTCL offsets: LTCG only
- Carry-forward: 8 assessment years
- Condition: ITR must be filed by July 31

---

## 6. Calculator Pages — Detailed Specification

### 6.1 LRS & TCS Calculator (`/calculators/lrs-tcs`)

**What it does:** Real-time TCS calculation with advance tax optimization and family distribution.

**Inputs (left panel, sticky on lg+):**
- Investment amount (₹1L–₹5Cr slider + text input)
- Already remitted this FY (₹ input, default 0)
- Purpose dropdown (Investment / Education self-funded / 80E / Medical)
- Current month (Jan–Dec, determines lock-up period)
- "Do you pay advance tax?" toggle (Yes/No) — shows Before/After comparison when Yes
- Family members section (collapsible): stepper 0-5 adults, per-member name + already remitted

**Output Cards:**
1. **TCS Liability:** TCS-free portion (green), TCS-liable portion (red), TCS amount, effective rate, net to GIFT City
2. **Hidden IRR Cost:** TCS locked × return rate × months. If advance tax = Yes: side-by-side Before/After comparison with savings badge + "How to do this" tip box
3. **Family Optimization:** Table of members with remaining threshold, routing suggestion, ₹ saved callout
4. **Recharts stacked bar:** TCS-free / TCS-liable / TCS cost per family member

**Key state variables:** `investmentINR`, `fyAlreadyRemitted`, `purpose`, `month`, `payAdvanceTax`, `assumedReturn`, `familyMembers[]`

---

### 6.2 Capital Gains Calculator (`/calculators/capital-gains`)

**What it does:** Exact STCG/LTCG tax with the 730-day threshold, surcharge cap, and carry-forward.

**Inputs (left panel, sticky on lg+):**
- Currency toggle INR/USD (USD shows editable exchange rate, default ₹84.50)
- Purchase price, sale price (per unit)
- Number of units
- Holding period (years + months dual input + 0-10yr slider)
- Annual income excluding gain (₹0–₹5Cr+ slider)
- Tax regime toggle (New / Old)
- Carry-forward losses toggle → STCL amount + LTCL amount

**Live badge:** "LONG TERM (730+ days)" green or "SHORT TERM (X days)" amber, updates in real-time.

**Output Cards:**
1. **Your Gain:** Purchase/sale value, raw gain (green/red), taxable gain after loss offset, holding days, classification badge
2. **Tax Liability:** Base rate, surcharge (with cap note for LTCG), cess, effective rate, tax payable, net proceeds. "Show Math" toggle reveals 8-step step-by-step derivation showing every formula.
3. **The Waiting Game** (STCG only): Days to 730-day threshold, tax now vs tax if wait, savings by waiting, Recharts bar comparison
4. **Rate Table:** Income bracket × (STCG effective, LTCG effective, TLH value per ₹1L), active row highlighted

**Holding period timeline:** Horizontal bar 0→max years, STCG zone red, LTCG zone green after 730 days, dot at user's current position.

---

### 6.3 DTAA / FTC Calculator (`/calculators/dtaa`)

**What it does:** Two completely different flows depending on investor type. Selected via a 2-card path selector shown before any inputs.

#### Path A — Resident Indian (primary, dark card)
**Step 1 inputs:** Source country (USA/UK/Singapore/Germany/Netherlands/Mauritius/Japan/Other), income type (Dividends/Capital Gains/Interest/Other), income amount (INR or USD)

**Step 2 inputs:** Indian slab rate dropdown (New Regime FY 2025-26 slabs), Indian TDS/WHT already deducted

**Source country WHT rates (hard-coded):**
```
USA: 25% | UK: 20% | Singapore: 0% | Germany: 26.375%
Netherlands: 15% | Mauritius: 0% | Japan: 15% | Other: user-entered
```

**FTC calculation:**
```
FTC = min(sourceCountryWHT, IndianSlabTax)
TotalPaid = max(sourceCountryWHT, IndianSlabTax)  ← never both stacked
```

**Output cards:** "Without FTC" (red, shows double taxation), "With FTC via Form 67" (green, shows actual total). Savings banner. GIFT City callout (interest is NOT exempt for residents). WHT reference table for all source countries.

#### Path B — NRI via GIFT City (secondary, dimmed card)
**Does NOT show a calculator.** Shows a static explainer with 4 rows:
1. GIFT City Cat III AIF gains → 0% (Section 10(23FBC))
2. US stocks via Valura → 0% (not India-sourced)
3. GIFT City interest → 0% (Section 10(15)(ix))
4. Indian securities via GIFT City → 12.5% LTCG (edge case, DTAA applies)

Dark summary box: Ireland UCITS (15% vs 25% WHT), US estate tax ($0), zero Indian tax on gains. CTA to Estate Tax calculator.

**Unified reference table (shown for both paths):** Tax Treatment by Investor Type across Capital Gains / Dividends / Interest / US Estate Tax.

---

### 6.4 US Estate Tax Calculator (`/calculators/estate-tax`)

**What it does:** Calculates IRS estate tax for Non-Resident Aliens (NRAs) on US stock holdings. Compares direct holding vs Valura GIFT City (always $0).

**NRA Exemption:** USD 60,000 (vs $13.61M for US citizens)

**Tax brackets (hard-coded, cumulative):**
```
$0–10K above exemption:   18% | $10–20K: 20% | $20–40K: 22%
$40–60K: 24% | $60–80K: 26% | $80–100K: 28%
$100–150K: 30% | $150–250K: 32% | $250–500K: 34%
$500–750K: 37% | $750K–1M: 39% | > $1M: 40%
```

**Inputs:** USD slider $0–$5M + text input + preset buttons ($100K/$250K/$500K/$1M/$2M) + editable exchange rate (default ₹84.50)

**Output cards:**
- **Direct Investment** (red border): IRS bill, effective rate, what family receives, INR equivalent, bracket breakdown table
- **Via Valura GIFT City** (green border): $0, 0% rate, 100% inheritance, legal reason (IFSC units = Indian assets under IRS Rev. Rul. 55-143)

**Between cards:** Large savings callout `$X (₹Y)`

**20-year Recharts ComposedChart:** Red line = direct estate tax exposure at 10% CAGR. Green flat line = Valura ($0). Shaded area between lines. Annotations at Year 10 and Year 20.

**3-step explainer:** Direct path (1→2→3) vs Valura path (1→2→3)

---

### 6.5 NRI Status Calculator (`/calculators/nri-status`)

**What it does:** Determines NRI / RNOR / ROR status under Section 6 of the Income Tax Act. Runs the full decision tree.

**3-step wizard inputs:**

**Step 1 — Days in India:**
- Days in current FY (with FY progress display: "FY 2025-26 is X days old")
- Days in each of last 4 FYs (4 compact inputs, FY21-22 through FY24-25)

**Step 2 — History:**
- NRI years in last 10 FYs (stepper 0-10)
- Total days in India across last 7 FYs combined

**Step 3 — Profile:**
- Indian citizen? (Yes/No toggle)
- Reason for being outside India (Employment / Business / Studying / Just visiting / Not applicable)

**Section 6 logic (hard-coded):**
```
isResident = (daysCurrentFY >= 182) OR 
             (daysCurrentFY >= 60 AND totalPrev4FYs >= 365)

Exception: Indian citizen leaving for employment → 60-day threshold becomes 182

if !isResident → NRI
if isResident AND (nriYearsIn10 >= 9 OR totalDays7FYs <= 729) → RNOR
else → ROR
```

**Live results panel (right side, updates on every input):**
- Large status badge (NRI green / RNOR amber / ROR blue)
- Tax implications card (foreign income taxability, LRS, Schedule FA, FTC)
- RNOR-specific: golden window note, days remaining in 7yr count
- ROR-specific: GIFT City benefits, Schedule FA mandatory warning
- Two horizontal progress bars (182-day threshold, 729-day RNOR test)
- Suggested ITR form (ITR-1/2/3 with conditions)
- Section 6 logic breakdown showing which conditions were met/missed
- Dynamic CTA per status

---

### 6.6 Net Returns Calculator (`/calculators/net-returns`)  ← FLAGSHIP

**What it does:** Full year-by-year after-tax wealth projection. Route A (Direct: IBKR/Vested/INDmoney) vs Route B (Valura GIFT City). The closing argument.

**Core differences modeled:**

| Drag | Route A | Route B |
|---|---|---|
| TCS | 20% above (1 PAN × ₹10L) | 20% above (N PANs × ₹10L) |
| Dividend WHT | 25% (NRA, US stocks) | 15% (Ireland UCITS) |
| Capital gains | LTCG 14.95% or STCG slab | Identical |
| US estate tax | calcEstateTax() × probability% | $0 always |
| Platform fee | $0 | 0.5%/yr (editable) |

**Inputs (left panel, sticky on lg+):**
- Currency toggle INR/USD + slider (₹1L–₹10Cr)
- Annual additional investment
- Horizon (1–30yr)
- Return rate (6–20%)
- Dividend yield (0–5%)
- Holding strategy: LTCG (no annual CGT, lump on exit) / STCG (annual CGT on cap gains) / Mixed (50/50)
- Investor type: Resident / NRI / Foreign
- Income bracket (6 options, determines STCG slab)
- Income above ₹5Cr toggle
- Family members stepper (1–5) — determines Route B TCS threshold
- Collapsible advanced: platform fee (default 0.5%), exchange rate (default ₹84.50), estate tax probability 0–100% (default 100%)

**Projection engine (`runProjection()`):**
```typescript
// Year-by-year loop:
divTaxA = corpus_A * dividendYield * 0.25   // Route A: 25% WHT
divTaxB = corpus_B * dividendYield * 0.15   // Route B: 15% WHT
stcgTaxA = capitalGain_A * stcgRate * frac  // if STCG or Mixed
platformFee = corpus_B * platformFeeRate    // Route B only

corpus_A += capitalGrowth + (dividend - divTaxA) - stcgTax + annualAdd
corpus_B += capitalGrowth + (dividend - divTaxB) - platformFee - stcgTax + annualAdd

// At exit: LTCG on (finalCorpus - initialCorpus - totalAdded)
// Estate tax on Route A: calcEstateTaxUSD(corpus_A / exchangeRate) × statePct
// finalA = corpus_A - exitTaxA - estateTaxINR
// finalB = corpus_B - exitTaxB

// Break-even: year when (corpus_B - corpus_A) > cumulativePlatformFees
```

**Persistent header summary bar (always visible):**
- Route A final value (red) + Route B final value (green) + Advantage (dark card)
- 4 stat boxes: TCS saved / Estate tax protected / Dividend WHT saved / Extra wealth at year N

**Charts and tables:**
1. **IRR ComposedChart:** Route B area (green shaded), Route A dashed red line, ReferenceLine at year 10 with gap annotation
2. **Tax Waterfall BarChart:** Two bars (A vs B), stacked: Net Return / CG Tax / Dividend WHT / TCS Drag / Estate Tax / Platform Fee
3. **Year-by-year table:** Year / Route A corpus / cumulative tax A / Route B corpus / cumulative tax B / advantage. 10 rows default, expand all.
4. **Per-item comparison table:** Each drag with Route A vs B value and "winner" badge
5. **Break-even card:** "Platform fee offset by savings in Year X"

**PDF export:** `window.print()` with `print:hidden` CSS on interactive elements

---

### 6.7 Calculator Guide (`/calculators/docs`)

**What it does:** Tabbed documentation with worked examples, rate tables, and pro tips for all 6 calculators.

**Tabs:** LRS & TCS · Capital Gains · DTAA / FTC · Net Returns · Estate Tax · NRI Status

Each tab contains: key numbers panel, how-to-use step list, 2-3 worked examples with exact calculations, rate reference tables, collapse accordions for common mistakes/edge cases.

---

## 7. AI Advisor (`/chat`) — Agentic System

### 7.1 Architecture
- **Frontend:** `app/chat/page.tsx` — streaming SSE consumer, renders widgets + markdown
- **Backend:** `app/api/chat/route.ts` — Next.js Route Handler, streams SSE events
- **Model:** GPT-4o
- **RAG:** OpenAI Vector Store (`OPENAI_VECTOR_STORE_ID`) with `file_search` tool — 5 regulatory documents (RBI LRS FAQ, IT Act sections, GIFT City compliance rules)
- **Streaming format:** Server-Sent Events (SSE)

### 7.2 SSE Event Protocol
```typescript
{ type: "status";      message: string }             // "Searching knowledge base..."
{ type: "tool_start";  tool: string }                 // Tool pill appears (loading)
{ type: "tool_done";   tool: string }                 // Tool pill turns green
{ type: "widget";      widget: Record<string, unknown> } // Renders a card
{ type: "text_start" }                                // Begin streaming text
{ type: "text_chunk";  content: string }              // Streamed token
{ type: "done";        sources: string[]; widgetCount: number }
{ type: "error";       message: string }
```

### 7.3 Function Tools (6 total)

```typescript
// 1. calculate_tcs
{
  remittance_inr: number,
  purpose: "investment" | "education_loan" | "education_self" | "medical" | ...,
  fy_cumulative_inr?: number  // default 0
}
// Returns: TCS amount, effective rate, net amount, IRR drag

// 2. calculate_capital_gains
{
  buy_price_usd: number,
  sell_price_usd: number,
  quantity: number,
  holding_months: number,
  income_bracket: "up_to_50L" | "50L_to_1Cr" | "1Cr_to_2Cr" | "2Cr_to_5Cr" | "above_5Cr",
  regime?: "old" | "new"
}
// Returns: gain INR, type (STCG/LTCG), effective rate, tax, net proceeds

// 3. optimize_family_tcs
{
  total_remittance_inr: number,
  purpose: string,
  members?: [{ name: string, fy_remitted_inr: number }]  // defaults to FAMILY_MEMBERS mock
}
// Returns: per-member allocation table, total TCS saved

// 4. get_tax_rates
{
  income_inr: number,
  regime?: "old" | "new"
}
// Returns: slab rate, surcharge, STCG effective, LTCG effective, TLH value/₹1L

// 5. run_tlh_scan
{
  income_bracket?: string,
  min_loss_threshold_inr?: number  // default 50000
}
// Returns: TLH opportunities array sorted by priority score

// 6. get_portfolio_summary
{}
// Returns: holdings count, total value, unrealized P&L, TLH count
```

### 7.4 Widget Types (rendered by `WidgetRenderer`)
Widgets are JSON objects emitted as SSE events. The frontend `WidgetRenderer` switches on `widget.type`:
- `tcs_result` — TCS calculation card
- `capital_gains_result` — CG tax breakdown card
- `family_optimization` — allocation table
- `tax_rates` — rate comparison table
- `tlh_opportunities` — list of TLH opportunities with priority scores
- `portfolio_summary` — portfolio overview card

### 7.5 Suggested Prompts (hard-coded in frontend)
```
TCS:      "What TCS will I pay on a ₹50 lakh GIFT City remittance? I've already sent ₹8L this FY."
TLH:      "Show me all TLH opportunities in the portfolio and how much I can save."
Rates:    "What are the STCG and LTCG effective rates for income above ₹5 crore?"
CG:       "I bought 500 units at $210 and want to sell at $245. I've held for 18 months."
Family:   "How should I split a ₹1.2 crore investment remittance across 3 family members?"
Harvest:  "Can I sell Mirae IFSC fund at a loss today and rebuy it tomorrow?"
LRS:      "Is PAN mandatory for LRS remittances?"
Strategy: "I have a position with 22-month holding and it's at a loss. STCL now or wait for LTCL?"
```

### 7.6 System Prompt Context
The AI knows: current FY (2025-26), Finance Act 2025 rates, GIFT City IFSC structure, all calculator formulas, no Indian wash sale rule, advance tax dates, LRS limits and TCS rules, family optimization strategy.

---

## 8. TLH Engine (`/tlh`, `lib/tlh-engine.ts`)

**What it does:** Scans the demo portfolio for tax-loss harvesting opportunities. Scores, prioritizes, and recommends.

### 8.1 TLH Logic
```typescript
// For each holding with unrealizedLoss >= minThreshold:
savingsVsSTCG = loss × stcgEffectiveRate
savingsVsLTCG = loss × ltcgEffectiveRate
bestCaseSavings = max(savingsVsSTCG if STCL, savingsVsLTCG)
transactionCost = absLossINR × 0.0015  // 0.15% brokerage + spread
netBenefit = bestCaseSavings - transactionCost
```

**Priority scoring (0-100):**
- Net benefit magnitude (40 pts max)
- Days until LTCG threshold — urgency if close to crossing (25 pts)
- Loss % depth (20 pts)
- STCL vs LTCL type (15 pts — STCL scores higher, more flexible offset)

**Urgency levels:**
```
critical: < 30 days to LTCG threshold AND net benefit > 0
high:     net benefit > ₹1L
medium:   net benefit > ₹25K
low:      net benefit > 0
```

**Replacement suggestions:** Each holding has a pre-mapped substitute that maintains market exposure:
```
TATA-SP500   → iShares Core S&P 500 UCITS ETF (IFSC)
MIRAE-GLOBAL → HSBC Global Equity IFSC Fund
AXIS-NASDAQ  → Franklin NASDAQ Composite IFSC ETF
DSP-GOLD     → Nippon India Gold Fund IFSC
```

**India has NO wash sale rule** — immediate rebuy of the same security is legal and optimal.

---

## 9. Portfolio System (`lib/mock-data.ts`, `lib/portfolio-store.ts`)

### 9.1 Holding Data Shape
```typescript
interface Holding {
  id: string;
  name: string;
  ticker: string;
  category: "Equity" | "Fixed Income" | "Commodity" | "Multi-Asset";
  buyPrice: number;       // USD
  currentPrice: number;   // USD
  quantity: number;
  buyDate: string;        // YYYY-MM-DD
  currency: "USD";
}
```

### 9.2 Demo Holdings (4 positions)
```
TATA-SP500    | Buy $98.50  | Current $95.20  | 500 units | LOSS (used for TLH demo)
MIRAE-GLOBAL  | Buy $245.00 | Current $238.50 | 200 units | LOSS
AXIS-NASDAQ   | Buy $156.00 | Current $148.75 | 300 units | LOSS
DSP-GOLD      | Buy $72.00  | Current $68.50  | 400 units | LOSS
```
All 4 holdings are in a loss position to demonstrate TLH opportunities.

### 9.3 Family Members (for TCS optimization)
```typescript
interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  fyRemittedINR: number;  // Already remitted this FY
  lrsLimitUSD: number;    // Always $250,000
}
```
Demo family: Rajesh (₹1L remitted), Priya (₹0), Arjun (₹0), Meera (₹0)

### 9.4 Portfolio Store (localStorage-backed)
- `getHoldings()` — returns holdings array
- `addHolding(h)` — adds to localStorage
- `removeHolding(id)` — deletes
- `updateHolding(id, updates)` — patches
- `resetToMockData()` — restores demo state
- Structure designed so `getHoldings()` can be replaced with an API call in production

---

## 10. Blog System (`lib/blog-data.ts`)

### 10.1 Data Shape
```typescript
interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  category: "Fundamentals" | "Estate Planning" | "TCS Strategy" | "NRI Planning";
  date: string;
  readTime: number;
  author: string;
  accentColor: string;       // Hex — used for header strip, tags, section headings
  excerpt: string;
  relatedCalc?: { label: string; href: string };
  sections: BlogSection[];
}

interface BlogSection {
  heading?: string;
  body: string;
  type?: "text" | "tip" | "warning" | "callout";
  calloutTitle?: string;
}
```

### 10.2 Existing Articles (4)
1. `what-is-gift-city-ifsc` — Fundamentals, 7min, #05A049
2. `us-estate-tax-trap` — Estate Planning, 8min, #DC2626
3. `family-lrs-optimization` — TCS Strategy, 6min, #05A049
4. `rnor-golden-window` — NRI Planning, 7min, #B8913A

### 10.3 Routes
- `/blog` — index, featured article full-width, grid of rest, related calculators strip
- `/blog/[slug]` — article page, generated statically via `generateStaticParams`

---

## 11. Key Hard-Coded Constants (used across the app)

```typescript
// LRS / TCS
LRS_LIMIT_USD = 250_000          // Per person per FY
TCS_THRESHOLD_INR = 1_000_000    // ₹10L per PAN per FY
TCS_INVESTMENT_RATE = 0.20       // 20% above threshold

// Capital gains thresholds
LTCG_THRESHOLD_DAYS = 730        // 730 days = 24 months
LTCG_BASE_RATE = 0.125           // 12.5% flat
LTCG_SURCHARGE_CAP = 0.15        // Capped at 15%
CESS = 0.04                      // Health & Education cess

// US Estate Tax (NRA)
NRA_EXEMPTION_USD = 60_000
ESTATE_MAX_RATE = 0.40

// Exchange rates
DEFAULT_INR_PER_USD = 84.50

// DTAA Dividend WHT rates (source country → Indian resident)
USA: 25%, UK: 20%, Singapore: 0%, Germany: 26.375%
Netherlands: 15%, Mauritius: 0%, Japan: 15%

// NRA Dividend WHT (NRI receiving Indian dividends)
Mauritius: 5%, Germany: 10%, Netherlands: 10%, UAE: 10%
Japan: 10%, UK: 15%, Singapore: 15%, Australia: 15%
USA: 25%, Canada: 25%

// Advance tax installment dates
Jun 15: 15%, Sep 15: 45%, Dec 15: 75%, Mar 15: 100%

// NRI Status thresholds (Section 6)
RESIDENT_BASIC_1 = 182            // days in current FY
RESIDENT_BASIC_2_CURRENT = 60    // days current FY (60+365 rule)
RESIDENT_BASIC_2_PREV = 365      // days in preceding 4 FYs
RNOR_NRI_YEARS = 9               // NRI in 9/10 preceding FYs
RNOR_DAYS_7YR = 729              // ≤ 729 days in 7 preceding FYs
EMPLOYMENT_EXCEPTION = 182       // Indian citizen going abroad for work

// Ireland UCITS WHT advantage
DIRECT_US_WHT = 0.25             // NRA rate
UCITS_WHT = 0.15                 // Via India-Ireland DTAA

// Net Returns defaults
DEFAULT_RETURN_RATE = 0.12       // 12% pre-tax CAGR
DEFAULT_DIV_YIELD = 0.02         // 2% dividend yield
DEFAULT_PLATFORM_FEE = 0.005     // 0.5% per year (Route B)
DEFAULT_ESTATE_PROB = 100        // 100% conservative
```

---

## 12. Environment Variables

```bash
OPENAI_API_KEY=sk-...            # GPT-4o access
OPENAI_VECTOR_STORE_ID=vs_...    # Vector store with 5 regulatory PDFs
```

---

## 13. Existing AI Capabilities (what's already built)

| Capability | Where | Status |
|---|---|---|
| GPT-4o chat with streaming | `/chat` + `/api/chat` | ✅ Live |
| Function calling (6 tools) | `/api/chat` | ✅ Live |
| RAG on 5 regulatory docs | Vector Store + file_search | ✅ Live |
| SSE streaming events | `/api/chat` route | ✅ Live |
| Widget rendering in chat | `components/chat/widgets.tsx` | ✅ Live |
| Tool execution pills (UI) | `chat/page.tsx` | ✅ Live |
| Markdown rendering | ReactMarkdown + remarkGfm | ✅ Live |

---

## 14. Suggested AI Enhancements (not yet built)

### 14.1 Calculator-Level AI
- **Natural language calculator inputs** — "I want to remit 50 lakhs for investment" → auto-fills LRS calculator
- **AI explanation layer** — "Explain this result in plain English" button on every calculator output
- **Personalized recommendations** — after running a calculator, AI suggests next steps
- **"What if" scenario comparison** — side-by-side comparison of 2-3 scenarios via natural language

### 14.2 Portfolio-Level AI
- **Portfolio intake via chat** — user describes holdings in natural language, AI parses to JSON and populates portfolio store
- **AI tax planner** — given full portfolio, generates ranked action list for current FY
- **Rebalancing advisor** — models tax cost of rebalancing vs holding
- **Post-tax XIRR explainer** — AI explains why XIRR is X% and what drives it

### 14.3 Document Intelligence
- **ITR helper** — AI answers questions about specific ITR form schedules (FA, FSI, TR, Form 67) using RAG
- **Form 67 generator** — collects data from calculators and auto-drafts Form 67 entries
- **Schedule FA builder** — from GIFT City holdings, generates Schedule FA disclosure data

### 14.4 Personalization
- **User profile** — remember income bracket, family members, investor type across sessions
- **Session memory** — AI remembers portfolio context across messages
- **Notification triggers** — "You should review your advance tax before Sep 15" based on TCS paid

### 14.5 Blog / Content AI
- **AI-powered Q&A on articles** — chat widget on blog posts, questions answered using article content + regulatory docs
- **Related content suggestions** — after running a calculator, link to the relevant blog article
- **Content generation** — AI-assisted blog post drafting from structured data

---

## 15. API Shape for AI Integration

### Adding a new calculator-level AI endpoint
```typescript
// app/api/explain/route.ts — example pattern
POST /api/explain
Body: { calculatorType: string, inputs: Record<string, unknown>, outputs: Record<string, unknown> }
Response: SSE stream with { type: "text_chunk", content: string }
```

### Adding a new tool to the existing chat
1. Add tool definition to `TOOLS` array in `/api/chat/route.ts`
2. Add handler in the tool execution switch
3. Emit `widget` SSE event with typed widget data
4. Add widget renderer case in `components/chat/widgets.tsx`

### Accessing calculator state from AI
All calculators are client-side only (`"use client"`). To feed calculator state to AI:
- Pass state via a controlled form submission to a new API route
- Or: read from localStorage (portfolio store pattern)
- Or: URL params for shareable calculator states

---

## 16. Styling Patterns

All pages follow the same design pattern. Copy this for any new page:

```tsx
<div className="min-h-screen" style={{ background: "#FFFFFC" }}>
  {/* Header */}
  <div className="border-b px-4 sm:px-6 md:px-8 py-6" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}>
      Calculator · Category
    </span>
    <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
      Page Title
    </h1>
  </div>
  
  {/* Two-column layout (common for calculators) */}
  <div className="flex flex-col lg:flex-row">
    <div className="lg:w-[380px] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto p-6 border-r">
      {/* Inputs */}
    </div>
    <div className="flex-1 p-6">
      {/* Outputs */}
    </div>
  </div>
</div>
```

**Card pattern:**
```tsx
<div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
  <div className="px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
    <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>Card Title</p>
  </div>
  <div className="p-6">{/* content */}</div>
</div>
```

**CTA banner pattern (dark):**
```tsx
<div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #05A049" }}>
  <div className="px-4 sm:px-6 md:px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-6"
    style={{ background: "#00111B" }}>
    <div>...</div>
    <a href="/signup" className="rounded-2xl px-5 sm:px-8 py-4 font-extrabold"
      style={{ background: "#05A049", color: "#fff" }}>
      Open Account <ArrowRight />
    </a>
  </div>
</div>
```

---

## 17. What to Build Next (recommended priorities)

1. **User profile + session persistence** — income bracket, investor type, family members saved to localStorage or Supabase. Feed this context to every calculator automatically.
2. **Calculator → AI handoff** — "Ask AI about this result" button on every calculator. Pre-fills the chat with the calculation context.
3. **Portfolio API integration** — replace `lib/mock-data.ts` holdings with real user data from an API. The `getHoldings()` function in `portfolio-store.ts` is already structured for this swap.
4. **Form 67 assistant** — guided form builder using DTAA calculator outputs + user's FTC amounts.
5. **AI on blog** — floating chat widget on blog articles, RAG-augmented answers to article-specific questions.
6. **Notification engine** — FY-sensitive nudges: advance tax dates, TCS refund status, RNOR window countdown, ITR deadline.

---

*Document version: FY 2025-26. All tax rules per Finance Act 2025. Codebase reflects state as of March 2025.*
