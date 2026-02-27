import { Sparkles } from "lucide-react";

interface Props {
  patientId: string;
  patientName: string;
}

const PatientSummary = ({ patientId, patientName }: Props) => {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border healthcare-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Medical Summary</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        AI summary will appear here.
      </p>
    </div>
  );
};

export default PatientSummary;
