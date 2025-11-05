import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, MessageSquare, BarChart3, MessageCircle, QrCode } from "lucide-react";
import supportQR from "@/assets/support-qr.png";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        checkUserRole(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsAuthenticated(true);
      checkUserRole(session.user.id);
    }
  };

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(userRole === "admin" ? "/admin" : "/student");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Rwanda Education Platform</span>
          </div>
          {!isAuthenticated && (
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          )}
          {isAuthenticated && (
            <Button onClick={handleGetStarted}>
              Go to Dashboard
            </Button>
          )}
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Empowering Education in{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Rwanda
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A centralized platform for tracking student enrollment and providing quality educational resources across Rwanda's education system.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" onClick={handleGetStarted} className="shadow-lg">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-16 border-t">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built to validate core assumptions about user needs and gather critical feedback
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-3">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Student Analytics</CardTitle>
                  <CardDescription>
                    Real-time enrollment statistics and data visualization for administrators
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="bg-secondary/10 p-3 rounded-lg w-fit mb-3">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <CardDescription>
                    Secure authentication for both administrators and students
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="bg-accent/20 p-3 rounded-lg w-fit mb-3">
                    <BookOpen className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-lg">Study Resources</CardTitle>
                  <CardDescription>
                    Access to Mathematics study guides for Secondary 1 students
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="bg-success/10 p-3 rounded-lg w-fit mb-3">
                    <MessageSquare className="h-6 w-6 text-success" />
                  </div>
                  <CardTitle className="text-lg">Feedback System</CardTitle>
                  <CardDescription>
                    Built-in feedback mechanism to continuously improve the platform
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 border-t">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-primary border-none text-primary-foreground shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl md:text-3xl">Ready to Get Started?</CardTitle>
                <CardDescription className="text-primary-foreground/90 text-lg">
                  Join Rwanda's centralized education platform today
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={handleGetStarted}
                  className="shadow-lg"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Create Account"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 border-t">
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl md:text-3xl">Contact Support</CardTitle>
                <CardDescription className="text-lg">
                  Need help? Get in touch with us directly on WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 pb-8">
                <Button 
                  size="lg" 
                  onClick={() => window.open('https://wa.link/e12pas', '_blank')}
                  className="shadow-lg"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat with Support on WhatsApp
                </Button>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <QrCode className="h-5 w-5" />
                    <span className="text-sm font-medium">Or scan this QR code</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img 
                      src={supportQR} 
                      alt="WhatsApp Support QR Code" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
