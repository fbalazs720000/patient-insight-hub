import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY");
    const AZURE_OPENAI_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT");

    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
      throw new Error("Azure OpenAI credentials not configured");
    }

    const body = await req.json();
    const { type, patientName, records, messages, deployment, apiVersion } = body;

    const deploymentName = deployment || "gpt-4o";
    const version = apiVersion || "2024-12-01-preview";

    const client = new OpenAI({
      apiKey: AZURE_OPENAI_API_KEY,
      baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${deploymentName}`,
      defaultQuery: { "api-version": version },
      defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
    });

    let aiMessages: OpenAI.ChatCompletionMessageParam[];

    if (type === "summary") {
      aiMessages = [
        {
          role: "system",
          content: `You are a medical AI assistant. Summarize the following medical records for a doctor reviewing patient "${patientName}".
Focus ONLY on medical conditions, diagnoses, treatments, and clinical notes found in the provided records.
DO NOT include any personal data like date of birth, place of birth, address, phone number, or email.
DO NOT make up or infer any information that is not explicitly in the records.
Present the summary in a clear, organized format using markdown with headers and bullet points.
Be concise but thorough about medical history. If there are no records, say so.`,
        },
        {
          role: "user",
          content: `Here are the medical records:\n${records}\n\nPlease provide a comprehensive medical summary based ONLY on these records.`,
        },
      ];
    } else if (type === "chat") {
      aiMessages = [
        {
          role: "system",
          content: `You are a medical AI assistant helping a doctor with questions about patient "${patientName}".
Here are the patient's medical records:
${records}

Answer the doctor's questions based ONLY on these records.
DO NOT reveal personal data like date of birth, place of birth, address, phone, or email.
DO NOT make up or infer any information that is not explicitly in the records.
If the answer cannot be found in the records, say so clearly.
Focus only on medical information. Be helpful, accurate, and concise.`,
        },
        ...(messages || []).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'summary' or 'chat'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stream = await client.chat.completions.create({
      model: deploymentName,
      messages: aiMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
