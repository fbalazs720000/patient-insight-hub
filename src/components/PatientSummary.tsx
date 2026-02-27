import { useEffect, useState, useRef } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

interface Props {
  patientId: string;
  patientName: string;
}

const AZURE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/azure-analyzer`;

const PatientSummary = ({ patientId, patientName }: Props) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary("");

    try {
      // Fetch medical records
      const { data: records } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId);

      const recordsText = records && records.length > 0
        ? records.map(r =>
            `Date: ${r.record_date || "N/A"}\nDoctor: ${r.doctor_name || "N/A"}\nDiagnosis: ${r.diagnosis}\nTreatment: ${r.treatment || "N/A"}\nNotes: ${r.notes || "N/A"}`
          ).join("\n\n---\n\n")
        : "No medical records found.";

      const resp = await fetch(AZURE_URL, {
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
        throw new Error("Failed to get AI summary");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setSummary(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Summary error:", e);
      setError(e instanceof Error ? e.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      fetchSummary();
    }
  }, [patientId]);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border healthcare-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">AI Medical Summary</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { hasRun.current = false; fetchSummary(); }}
          disabled={loading}
          title="Regenerate summary"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && !summary && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating summary...
        </div>
      )}

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {summary && (
        <div className="prose prose-sm max-w-none text-foreground">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}

      {!loading && !summary && !error && (
        <p className="text-muted-foreground text-sm">No summary available.</p>
      )}
    </div>
  );
};

export default PatientSummary;
