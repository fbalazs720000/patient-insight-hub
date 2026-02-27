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

  const items = [
    { label: "Personal Data", icon: User, path: `/patient/${patientId}/personal` },
    { label: "All PDFs", icon: FileText, path: `/patient/${patientId}/pdfs` },
    { label: "Back to Main Page", icon: ArrowLeft, path: "/" },
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
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-semibold text-foreground">Menu</h2>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 flex-1">
                {items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setOpen(false); navigate(item.path); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-secondary transition-colors text-left"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PatientMenu;
