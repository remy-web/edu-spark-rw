import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, BookOpen, LogOut, BarChart3 } from "lucide-react";

interface Statistics {
  education_level: string;
  enrolled_count: number;
  school_name: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    checkAuth();
    fetchStatistics();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from("student_statistics")
        .select("*")
        .order("education_level");

      if (error) throw error;

      setStatistics(data || []);
      const total = data?.reduce((sum, stat) => sum + stat.enrolled_count, 0) || 0;
      setTotalStudents(total);
    } catch (error: any) {
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
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
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
            <h2 className="text-3xl font-bold mb-2">Student Enrollment Overview</h2>
            <p className="text-muted-foreground">
              Real-time statistics from participating schools
            </p>
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
          ) : (
            <>
              <Card className="bg-gradient-primary border-none text-primary-foreground shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium opacity-90">
                        Total Enrolled Students
                      </CardTitle>
                      <CardDescription className="text-primary-foreground/80">
                        Across all levels
                      </CardDescription>
                    </div>
                    <Users className="h-8 w-8 opacity-75" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{totalStudents.toLocaleString()}</div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {statistics.map((stat) => (
                  <Card key={stat.education_level} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{stat.education_level}</CardTitle>
                          <CardDescription>{stat.school_name}</CardDescription>
                        </div>
                        <BookOpen className="h-6 w-6 text-secondary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary">
                            {stat.enrolled_count}
                          </span>
                          <span className="text-sm text-muted-foreground">students</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-secondary rounded-full transition-all"
                            style={{ 
                              width: `${(stat.enrolled_count / totalStudents) * 100}%` 
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {((stat.enrolled_count / totalStudents) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
