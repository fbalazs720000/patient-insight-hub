import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";

interface Props {
  patientId: string;
  patientName: string;
  records: string;
}

const PatientChat = ({ patientId, patientName, records }: Props) => {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Ask AI about {patientName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-muted-foreground text-sm text-center mt-8">
          Ask questions about the patient's medical history...
        </p>
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about the patient..."
            className="flex-1"
          />
          <Button disabled size="icon" className="healthcare-gradient text-primary-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientChat;
