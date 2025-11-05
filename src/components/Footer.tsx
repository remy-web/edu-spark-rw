import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Footer = () => {
  const [dialogType, setDialogType] = useState<"faq" | "privacy" | "terms" | null>(null);

  const openDialog = (type: "faq" | "privacy" | "terms") => {
    setDialogType(type);
  };

  const closeDialog = () => {
    setDialogType(null);
  };

  return (
    <>
      <footer className="border-t bg-card/30 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-muted-foreground">
            Rwanda Education Platform © 2025 • Developed by Vincent De Paul N. • Project: Edu-Spark RW • Contact: +250786640904
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <button
              onClick={() => openDialog("faq")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              FAQ
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button
              onClick={() => openDialog("privacy")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button
              onClick={() => openDialog("terms")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      <Dialog open={dialogType === "faq"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Frequently Asked Questions</DialogTitle>
            <DialogDescription>Common questions about the Rwanda Education Platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-1">Q: What is Rwanda Education Platform?</h4>
              <p className="text-sm text-muted-foreground">A: A learning portal that provides study materials and personalized learning tools based on student level.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Q: Is this platform officially part of REB?</h4>
              <p className="text-sm text-muted-foreground">A: It uses publicly available REB resources but is not an official REB website.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Q: Are the study materials free?</h4>
              <p className="text-sm text-muted-foreground">A: Yes.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Q: Why do some files fail to open?</h4>
              <p className="text-sm text-muted-foreground">A: Some hosting locations may change on REB servers. Users can report broken links via Contact.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Q: Do I need an account?</h4>
              <p className="text-sm text-muted-foreground">A: Only for personalized or progress-based features. Study materials can still be browsed without login.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "privacy"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <DialogDescription>How we protect your data</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              We collect only minimal data required to personalize learning. Data is never sold or shared. 
              Users can request data deletion by contacting +250786640904.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "terms"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogDescription>Platform usage guidelines</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Study materials are for education only. Do not redistribute or sell. 
            </p>
            <p className="text-sm text-muted-foreground">
              Accounts may be limited for misuse. 
            </p>
            <p className="text-sm text-muted-foreground">
              Platform may update features or UI at any time.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Footer;
