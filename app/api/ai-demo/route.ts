import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the Valura GIFT City AI advisor embedded in a product demo for wealth managers.

Be precise, use exact numbers from the data provided, be direct and actionable.
Format your response with 3 clearly numbered actions.
No disclaimers or hedging. No "consult a CA" at the end.
The audience is a professional wealth manager who needs to act today.

Use Indian number formatting (₹14,00,000 style not ₹1400000).
Keep total response under 280 words.
Each numbered action must include: what to do, exact tax saving, and timing.`;

export async function POST(req: NextRequest) {
  const { message } = (await req.json()) as { message: string };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          stream: true,
          temperature: 0.2,
          max_tokens: 500,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) send({ content });
        }

        send({ done: true });
        controller.close();
      } catch (err) {
        send({
          error: err instanceof Error ? err.message : "Unknown error",
          done: true,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
