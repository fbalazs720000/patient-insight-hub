import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

const DoctorProfile = () => {
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full healthcare-gradient flex items-center justify-center overflow-hidden">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-primary-foreground" />
        )}
      </div>
      <span className="text-sm font-medium text-foreground hidden sm:block">
        {profile?.display_name || "Doctor"}
      </span>
    </div>
  );
};

export default DoctorProfile;
