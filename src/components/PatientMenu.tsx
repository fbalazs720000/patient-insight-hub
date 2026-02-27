import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, User, FileText, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  patientId: string;
}

const PatientMenu = ({ patientId }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: "Personal Data", icon: User, path: `/patient/${patientId}/personal` },
    { label: "All PDFs", icon: FileText, path: `/patient/${patientId}/pdfs` },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Menu</h2>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav items */}
              <div className="flex-1 px-4 pt-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setOpen(false); navigate(item.path); }}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-secondary transition-colors text-left"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Back to Main */}
              <div className="px-4 pb-6 border-t border-border pt-4">
                <button
                  onClick={() => { setOpen(false); navigate("/"); }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-secondary transition-colors text-left"
                >
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Back to Main Page</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PatientMenu;
