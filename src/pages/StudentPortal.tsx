import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookOpen, Download, LogOut, Search, ThumbsUp, ThumbsDown } from "lucide-react";

interface StudyGuide {
  id: string;
  title: string;
  subject: string;
  education_level: string;
  description: string;
  file_url: string;
}

const StudentPortal = () => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<StudyGuide[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedbackGuideId, setFeedbackGuideId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchGuides();
  }, []);

  useEffect(() => {
    const filtered = guides.filter(
      (guide) =>
        guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.education_level.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGuides(filtered);
  }, [searchTerm, guides]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }
  };

  const fetchGuides = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has a referral code
      const { data: referralData } = await supabase
        .from("user_referral_codes")
        .select("referral_code_id, referral_codes(created_by)")
        .eq("user_id", user.id)
        .single();

      let query = supabase
        .from("study_guides")
        .select("*")
        .order("created_at", { ascending: false });

      // If user has a referral code, show only guides from that teacher
      // Otherwise, show guides without a created_by (public guides)
      if (referralData) {
        const teacherId = (referralData.referral_codes as any)?.created_by;
        query = query.eq("created_by", teacherId);
      } else {
        query = query.is("created_by", null);
      }

      const { data, error } = await query;

      if (error) throw error;

      setGuides(data || []);
      setFilteredGuides(data || []);
    } catch (error: any) {
      toast.error("Failed to load study guides");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (guideId: string, isHelpful: boolean, comment?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("feedback")
        .insert({
          user_id: user.id,
          study_guide_id: guideId,
          is_helpful: isHelpful,
          comment: comment || null,
        });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      setFeedbackGuideId(null);
    } catch (error: any) {
      toast.error("Failed to submit feedback");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Student Portal</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Study Guides Library</h2>
            <p className="text-muted-foreground">
              Access educational resources for Secondary 1 Mathematics
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title, subject, or level..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-32 bg-muted" />
                  <CardContent className="h-24 bg-muted/50" />
                </Card>
              ))}
            </div>
          ) : filteredGuides.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  {searchTerm ? "No guides found matching your search." : "No study guides available yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGuides.map((guide) => (
                <Card key={guide.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {guide.subject} • {guide.education_level}
                        </CardDescription>
                      </div>
                      <div className="bg-secondary/10 p-2 rounded-lg">
                        <BookOpen className="h-5 w-5 text-secondary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button className="w-full" variant="default">
                      <Download className="mr-2 h-4 w-4" />
                      View Guide
                    </Button>
                    
                    {feedbackGuideId === guide.id ? (
                      <div className="w-full space-y-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Was this guide helpful?</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFeedback(guide.id, true)}
                            className="flex-1"
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFeedback(guide.id, false)}
                            className="flex-1"
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            No
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`comment-${guide.id}`} className="text-xs">
                            Additional comments (optional)
                          </Label>
                          <Textarea
                            id={`comment-${guide.id}`}
                            placeholder="Help us improve..."
                            className="resize-none h-20 text-sm"
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                handleFeedback(guide.id, true, e.target.value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeedbackGuideId(guide.id)}
                        className="w-full text-xs"
                      >
                        Provide Feedback
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentPortal;
