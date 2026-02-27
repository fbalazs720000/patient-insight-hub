import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DoctorProfile from "@/components/DoctorProfile";
import TAJInput from "@/components/TAJInput";
import { Stethoscope, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
      setLoading(false);
    };

    supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
    });

    check();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <DoctorProfile />
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground">MedPortal</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </Button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex p-4 rounded-2xl healthcare-gradient-soft mb-4">
            <Stethoscope className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Patient Records</h1>
          <p className="text-muted-foreground">Search for a patient using their TAJ number</p>
        </motion.div>

        <TAJInput />
      </main>
    </div>
  );
};

export default Index;
