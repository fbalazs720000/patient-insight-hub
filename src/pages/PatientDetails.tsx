import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PatientSummary from "@/components/PatientSummary";
import PatientChat from "@/components/PatientChat";
import PatientMenu from "@/components/PatientMenu";
import DoctorProfile from "@/components/DoctorProfile";
import { Loader2, GripVertical } from "lucide-react";
import { motion } from "framer-motion";

const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 800;
const DEFAULT_CHAT_WIDTH = 380;

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<{ full_name: string } | null>(null);
  const [records, setRecords] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: p } = await supabase.from("patients").select("full_name").eq("id", id!).maybeSingle();
      if (!p) { navigate("/"); return; }
      setPatient(p);

      const { data: recs } = await supabase
        .from("medical_records")
        .select("diagnosis, treatment, notes, doctor_name, record_date")
        .eq("patient_id", id!)
        .order("record_date", { ascending: false });

      const text = (recs || []).map(r =>
        `Date: ${r.record_date}, Diagnosis: ${r.diagnosis}, Treatment: ${r.treatment}, Notes: ${r.notes}, Doctor: ${r.doctor_name}`
      ).join("\n");
      setRecords(text);
      setLoading(false);
    };
    fetch();
  }, [id, navigate]);

  const handleMouseDown = () => setDragging(true);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, newWidth)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <PatientMenu patientId={id!} />
          <DoctorProfile />
        </div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-bold text-foreground absolute left-1/2 -translate-x-1/2"
        >
          {patient?.full_name}
        </motion.h1>
        <div />
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Summary area */}
        <div className="flex-1 overflow-y-auto p-6">
          <PatientSummary patientId={id!} patientName={patient?.full_name || ""} />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-2 cursor-col-resize flex items-center justify-center hover:bg-primary/10 transition-colors"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Chat panel */}
        <div style={{ width: chatWidth }} className="flex-shrink-0 p-4 pl-0">
          <PatientChat patientId={id!} patientName={patient?.full_name || ""} records={records} />
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
