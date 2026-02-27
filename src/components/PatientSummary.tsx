import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  patientId: string;
  patientName: string;
}

const PatientSummary = ({ patientId, patientName }: Props) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setSummary("");

      const { data: records } = await supabase
        .from("medical_records")
        .select("diagnosis, treatment, notes, doctor_name, record_date")
        .eq("patient_id", patientId)
        .order("record_date", { ascending: false });

      if (!records || records.length === 0) {
        setSummary("No medical records found for this patient.");
        setLoading(false);
        return;
      }

      const recordsText = records.map(r =>
        `Date: ${r.record_date}, Diagnosis: ${r.diagnosis}, Treatment: ${r.treatment}, Notes: ${r.notes}, Doctor: ${r.doctor_name}`
      ).join("\n");

      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/patient-ai`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: "summary",
            patientName,
            records: recordsText,
          }),
        });

        if (!resp.ok || !resp.body) {
          setSummary("Unable to generate summary at this time.");
          setLoading(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setSummary(fullText);
              }
            } catch {}
          }
        }
        setLoading(false);
      } catch {
        setSummary("Unable to generate summary at this time.");
        setLoading(false);
      }
    };

    fetchSummary();
  }, [patientId, patientName]);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border healthcare-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Medical Summary</h3>
      </div>
      {loading && !summary ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating summary...</span>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none text-foreground">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default PatientSummary;
