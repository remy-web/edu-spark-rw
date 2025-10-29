import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Key, Copy, Users } from "lucide-react";

interface ReferralCode {
  id: string;
  code: string;
  created_at: string;
  _count?: { user_referral_codes: number };
}

const ReferralCodeSection = () => {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error: any) {
      console.error("Error fetching codes:", error);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const code = `EDU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase.from("referral_codes").insert({
        code,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Referral code generated!");
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Referral Codes
        </CardTitle>
        <CardDescription>
          Generate premium access codes for your students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generateCode} disabled={generating} className="w-full">
          {generating ? "Generating..." : "Generate New Code"}
        </Button>

        {codes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Your Codes</h4>
            {codes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono font-semibold">{code.code}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCode(code.code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralCodeSection;
