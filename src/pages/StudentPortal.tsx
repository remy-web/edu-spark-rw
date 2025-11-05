import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen, Download, LogOut, Search, ThumbsUp, ThumbsDown, FileText, Filter, ExternalLink } from "lucide-react";
import rebMaterialsData from "@/data/reb-materials.csv?raw";
import { feedbackSchema } from "@/lib/validations";
import AIChat from "@/components/AIChat";

interface StudyGuide {
  id: string;
  title: string;
  subject: string;
  education_level: string;
  description: string;
  file_url: string;
}

interface REBMaterial {
  level: string;
  subject: string;
  link: string;
}

const StudentPortal = () => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<StudyGuide[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedbackGuideId, setFeedbackGuideId] = useState<string | null>(null);
  
  // REB Materials state
  const [rebMaterials, setRebMaterials] = useState<REBMaterial[]>([]);
  const [filteredREBMaterials, setFilteredREBMaterials] = useState<REBMaterial[]>([]);
  const [rebSearchTerm, setRebSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [userLevel, setUserLevel] = useState<string>("");

  useEffect(() => {
    checkAuth();
    fetchGuides();
    parseREBMaterials();
  }, []);

  useEffect(() => {
    filterREBMaterials();
  }, [rebSearchTerm, selectedLevel, selectedSubject, rebMaterials, userLevel]);

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

      // Get user's education level from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("education_level")
        .eq("id", user.id)
        .single();

      const userEducationLevel = profileData?.education_level;
      if (userEducationLevel) {
        setUserLevel(userEducationLevel);
        setSelectedLevel(userEducationLevel);
      }

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

      // Filter by education level and referral code
      if (userEducationLevel) {
        query = query.eq("education_level", userEducationLevel);
      }

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

  const parseREBMaterials = () => {
    const lines = rebMaterialsData.trim().split('\n');
    const headers = lines[0].split(',');
    
    const materials: REBMaterial[] = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        level: values[0],
        subject: values[1],
        link: values[2]
      };
    });
    
    setRebMaterials(materials);
    setFilteredREBMaterials(materials);
  };

  const filterREBMaterials = () => {
    let filtered = rebMaterials;

    // Auto-filter by user's level if available and no manual level selected
    if (userLevel && selectedLevel !== "all") {
      filtered = filtered.filter(m => m.level === selectedLevel);
    } else if (selectedLevel !== "all") {
      filtered = filtered.filter(m => m.level === selectedLevel);
    }

    // Filter by subject
    if (selectedSubject !== "all") {
      filtered = filtered.filter(m => m.subject === selectedSubject);
    }

    // Filter by search term
    if (rebSearchTerm) {
      filtered = filtered.filter(m =>
        m.level.toLowerCase().includes(rebSearchTerm.toLowerCase()) ||
        m.subject.toLowerCase().includes(rebSearchTerm.toLowerCase())
      );
    }

    setFilteredREBMaterials(filtered);
  };

  const getLevels = () => {
    const levels = Array.from(new Set(rebMaterials.map(m => m.level)));
    return levels.sort();
  };

  const getSubjects = () => {
    const subjects = Array.from(new Set(rebMaterials.map(m => m.subject)));
    return subjects.sort();
  };

  const handleFeedback = async (guideId: string, isHelpful: boolean, comment?: string) => {
    try {
      // Validate input data
      const validated = feedbackSchema.safeParse({ 
        comment: comment || undefined, 
        isHelpful 
      });
      
      if (!validated.success) {
        const firstError = validated.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("feedback")
        .insert({
          user_id: user.id,
          study_guide_id: guideId,
          is_helpful: validated.data.isHelpful,
          comment: validated.data.comment || null,
        });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      setFeedbackGuideId(null);
    } catch (error: any) {
      toast.error("Failed to submit feedback");
    }
  };

  const trackDownload = async (materialName: string, level: string, subject: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('material_downloads').insert({
        user_id: user.id,
        material_name: materialName,
        level: level,
        subject: subject,
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }
  };

  const handleDownloadGuide = async (guide: StudyGuide) => {
    await trackDownload(guide.title, guide.education_level, guide.subject);
    window.open(guide.file_url, '_blank');
    setFeedbackGuideId(guide.id);
  };

  const handleDownloadREBMaterial = async (material: REBMaterial) => {
    await trackDownload(material.subject, material.level, material.subject);
    window.open(material.link, '_blank');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
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
        <Tabs defaultValue="guides" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="guides">Study Guides</TabsTrigger>
            <TabsTrigger value="reb-materials">REB Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Additional Materials from Administrators</h3>
              <p className="text-sm text-muted-foreground">
                Study guides uploaded by your educators
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
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => handleDownloadGuide(guide)}
                    >
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
          </TabsContent>

          <TabsContent value="reb-materials" className="space-y-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">REB Official Materials</h2>
                <p className="text-muted-foreground">
                  Official Rwanda Education Board study materials for all levels
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://reb.rw/en/web/reb/p/learning-materials", "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Explore More on REB Website
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search materials..."
                    value={rebSearchTerm}
                    onChange={(e) => setRebSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2 items-center flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {getLevels().map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {getSubjects().map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {userLevel && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-primary font-medium">
                    📚 Showing materials for your level: <span className="font-bold">{userLevel}</span>
                  </p>
                </div>
              )}
            </div>

            {filteredREBMaterials.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {rebSearchTerm || selectedLevel !== "all" || selectedSubject !== "all"
                      ? "No materials found matching your filters."
                      : "No study materials available."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredREBMaterials.map((material, index) => (
                  <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{material.subject}</CardTitle>
                          <CardDescription className="mt-1">
                            {material.level}
                          </CardDescription>
                        </div>
                        <div className="bg-secondary/10 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-secondary" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant="default"
                        onClick={() => handleDownloadREBMaterial(material)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <AIChat />
      <Footer />
    </div>
  );
};

export default StudentPortal;
