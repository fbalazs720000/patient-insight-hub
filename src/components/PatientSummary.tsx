import { useEffect, useState, useCallback } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Props {
  patientId: string;
  patientName: string;
}

const SUMMARY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/patient-ai`;

const PatientSummary = ({ patientId, patientName }: Props) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchSummary = useCallback(async () => {
    setSummary("");
    setLoading(true);
    setError(false);

    try {
      // Fetch records first
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: recs } = await supabase
        .from("medical_records")
        .select("diagnosis, treatment, notes, doctor_name, record_date")
        .eq("patient_id", patientId)
        .order("record_date", { ascending: false });

      const records = (recs || [])
        .map(
          (r) =>
            `Date: ${r.record_date}\nDoctor: ${r.doctor_name}\nDiagnosis: ${r.diagnosis}\nTreatment: ${r.treatment}\nNotes: ${r.notes}`
        )
        .join("\n\n---\n\n");

      if (!records) {
        setSummary("No medical records found for this patient.");
        setLoading(false);
        return;
      }

      const resp = await fetch(SUMMARY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: "summary", patientName, records }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        if (resp.status === 429) toast.error("Rate limited. Please try again later.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error(body.error || "Failed to get AI summary");
        setError(true);
        setLoading(false);
        return;
      }

      // Stream SSE
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              setSummary(full);
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Summary error:", e);
      setError(true);
      toast.error("Failed to generate AI summary");
    } finally {
      setLoading(false);
    }
  }, [patientId, patientName]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border healthcare-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">AI Medical Summary</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchSummary} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && !summary ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating summary...</span>
        </div>
      ) : error && !summary ? (
        <p className="text-destructive text-sm">Failed to load summary. Click refresh to try again.</p>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default PatientSummary;
