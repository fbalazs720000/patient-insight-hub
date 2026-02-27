import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Patient {
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  place_of_birth: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taj_number: string;
}

const PersonalData = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase.from("patients").select("*").eq("id", id!).maybeSingle();
      setPatient(data);
      setLoading(false);
    };
    fetch();
  }, [id, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const fields = [
    { label: "Full Name", value: patient?.full_name },
    { label: "TAJ Number", value: patient?.taj_number },
    { label: "Date of Birth", value: patient?.date_of_birth },
    { label: "Gender", value: patient?.gender },
    { label: "Place of Birth", value: patient?.place_of_birth },
    { label: "Address", value: patient?.address },
    { label: "Phone", value: patient?.phone },
    { label: "Email", value: patient?.email },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/patient/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-foreground">Personal Data</h1>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <div className="bg-card rounded-2xl p-6 border border-border healthcare-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full healthcare-gradient flex items-center justify-center">
              <User className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{patient?.full_name}</h2>
              <p className="text-sm text-muted-foreground">Patient Information</p>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map(f => (
              <div key={f.label} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{f.label}</span>
                <span className="text-sm font-medium text-foreground">{f.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PersonalData;
