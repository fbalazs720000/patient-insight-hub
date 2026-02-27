import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, patientName, records, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt: string;

    if (type === "summary") {
      systemPrompt = `You are a medical AI assistant. Summarize the following medical records for a doctor reviewing patient "${patientName}". 
Focus ONLY on medical conditions, diagnoses, treatments, and clinical notes. 
DO NOT include any personal data like date of birth, place of birth, address, phone number, or email. 
Present the summary in a clear, organized format using markdown with headers and bullet points.
Be concise but thorough about medical history.`;
    } else {
      systemPrompt = `You are a medical AI assistant helping a doctor with questions about patient "${patientName}". 
Here are the patient's medical records:
${records}

Answer the doctor's questions based on these records. 
DO NOT reveal personal data like date of birth, place of birth, address, phone, or email.
Focus only on medical information. Be helpful, accurate, and concise.`;
    }

    const aiMessages = type === "summary"
      ? [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here are the medical records:\n${records}\n\nPlease provide a comprehensive medical summary.` },
        ]
      : [
          { role: "system", content: systemPrompt },
          ...(messages || []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
