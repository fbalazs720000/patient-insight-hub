import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDF {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

const PatientPDFs = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase.from("patient_pdfs").select("*").eq("patient_id", id!).order("uploaded_at", { ascending: false });
      setPdfs(data || []);
      setLoading(false);
    };
    fetch();
  }, [id, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/patient/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-foreground">Patient Documents</h1>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        {pdfs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents found for this patient.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pdfs.map(pdf => (
              <a
                key={pdf.id}
                href={pdf.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border hover:healthcare-shadow transition-shadow"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{pdf.file_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(pdf.uploaded_at).toLocaleDateString()}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientPDFs;
