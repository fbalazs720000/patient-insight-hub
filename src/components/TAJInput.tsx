import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

const TAJInput = () => {
  const [taj, setTaj] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!taj.trim()) return;
    setLoading(true);
    setError("");

    const { data, error: dbError } = await supabase
      .from("patients")
      .select("id")
      .eq("taj_number", taj.trim())
      .maybeSingle();

    if (dbError || !data) {
      setError("TAJ number not found");
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    } else {
      navigate(`/patient/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className={`bg-card rounded-2xl p-8 healthcare-shadow border border-border ${shaking ? "animate-shake" : ""}`}>
        <h2 className="text-lg font-semibold text-foreground mb-2">Patient Lookup</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter the patient's TAJ number to view their records</p>

        <div className="flex gap-3">
          <Input
            value={taj}
            onChange={(e) => { setTaj(e.target.value); setError(""); }}
            placeholder="e.g. 123-456-789"
            className={`flex-1 text-lg h-12 ${error ? "border-destructive text-destructive" : ""}`}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="h-12 px-6 healthcare-gradient text-primary-foreground"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-destructive text-sm mt-3 font-medium"
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default TAJInput;
