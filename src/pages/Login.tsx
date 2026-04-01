import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username max 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores");
const passwordSchema = z.string().min(4, "Min 4 characters").max(128);

const toFakeEmail = (username: string) => `${username.toLowerCase()}@procureflow.local`;

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Seed admin on first load
  useEffect(() => {
    const seedAdmin = async () => {
      try {
        setSeeding(true);
        await supabase.functions.invoke("seed-admin");
      } catch {
        // ignore
      } finally {
        setSeeding(false);
      }
    };
    seedAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const username = (fd.get("username") as string).trim();
    const password = fd.get("password") as string;

    try {
      usernameSchema.parse(username);
      passwordSchema.parse(password);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Invalid input");
      setLoading(false);
      return;
    }

    const fakeEmail = toFakeEmail(username);

    if (isSignUp) {
      const fullName = ((fd.get("full_name") as string) || "").trim();
      if (fullName.length > 100) {
        toast.error("Name too long (max 100 chars)");
        setLoading(false);
        return;
      }

      // Use edge function to create user (bypasses email confirmation)
      const { data, error: fnErr } = await supabase.functions.invoke("signup-user", {
        body: { username, password, full_name: fullName },
      });

      if (fnErr || data?.error) {
        toast.error(data?.error || fnErr?.message || "Signup failed");
        setLoading(false);
        return;
      }

      toast.success("Account created! Signing you in...");
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });
      if (signInErr) {
        toast.error(signInErr.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });
      if (error) {
        toast.error("Invalid username or password");
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">ProcureFlow</CardTitle>
          <CardDescription>
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" maxLength={100} />
              </div>
            )}
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                required
                maxLength={30}
                autoComplete="username"
                placeholder="e.g. john_doe"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={4}
                maxLength={128}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || seeding}>
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
