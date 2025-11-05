import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import classroomBg from "@/assets/classroom-bg.jpg";
import { signUpSchema, signInSchema } from "@/lib/validations";
import Footer from "@/components/Footer";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      fullName: formData.get("fullName") as string,
      role: formData.get("role") as "admin" | "student",
    };

    const educationLevel = formData.get("educationLevel") as string;

    try {
      // Validate input data
      const validated = signUpSchema.safeParse(rawData);
      if (!validated.success) {
        const firstError = validated.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: validated.data.email,
        password: validated.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validated.data.fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Add user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: authData.user.id, role: validated.data.role });

        if (roleError) throw roleError;

        // Update profile with education level
        if (educationLevel) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ education_level: educationLevel })
            .eq("id", authData.user.id);

          if (profileError) console.error("Failed to update education level:", profileError);
        }

        toast.success("Account created successfully!");
        navigate(validated.data.role === "admin" ? "/admin" : "/student");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      referralCode: (formData.get("referralCode") as string) || undefined,
    };

    try {
      // Validate input data
      const validated = signInSchema.safeParse(rawData);
      if (!validated.success) {
        const firstError = validated.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.data.email,
        password: validated.data.password,
      });

      if (error) throw error;

      // Handle referral code if provided
      if (validated.data.referralCode && validated.data.referralCode.trim() !== "") {
        const { data: codeData, error: codeError } = await supabase
          .from("referral_codes")
          .select("id")
          .eq("code", validated.data.referralCode)
          .eq("is_active", true)
          .single();

        if (codeError || !codeData) {
          toast.error("Invalid referral code");
          setLoading(false);
          return;
        }

        // Check if user already has this referral code
        const { data: existingCode } = await supabase
          .from("user_referral_codes")
          .select("id")
          .eq("user_id", data.user.id)
          .eq("referral_code_id", codeData.id)
          .single();

        if (!existingCode) {
          const { error: userCodeError } = await supabase
            .from("user_referral_codes")
            .insert({ 
              user_id: data.user.id, 
              referral_code_id: codeData.id 
            });

          if (userCodeError) throw userCodeError;
          toast.success("Referral code linked successfully!");
        } else {
          toast.info("You already have this referral code linked");
        }
      }

      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      toast.success("Signed in successfully!");
      navigate(roleData?.role === "admin" ? "/admin" : "/student");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${classroomBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <Card className="w-full max-w-md shadow-2xl relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-xl">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Rwanda Education Platform</CardTitle>
            <CardDescription>Access your educational dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-referral">Referral Code (Optional)</Label>
                  <Input
                    id="signin-referral"
                    name="referralCode"
                    type="text"
                    placeholder="Enter referral code from your teacher"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link a teacher's code to access their premium content
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">I am a:</Label>
                  <select
                    id="signup-role"
                    name="role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-2" id="education-level-field">
                  <Label htmlFor="signup-level">Education Level</Label>
                  <select
                    id="signup-level"
                    name="educationLevel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select your level</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary 1">Secondary 1</option>
                    <option value="Secondary 2">Secondary 2</option>
                    <option value="Secondary 3">Secondary 3</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </CardFooter>
      </Card>
      <div className="relative z-10 w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Auth;
