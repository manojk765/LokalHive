"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AppLayoutClient';
import type { UserRole } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Lock, User, Loader2 } from 'lucide-react';
import { Form, FormItem, FormControl, FormLabel, FormMessage, FormField } from '@/components/ui/form';
import { Logo } from '@/components/Logo';
import type { AuthError } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")), // Allow empty string
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  role: z.enum(["learner", "teacher"], { required_error: "Please select a role" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const initialMode = searchParams.get('type') === 'signup' ? 'signup' : 'login';
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "learner", // Default role
    }
  });

  const getFirebaseErrorMessage = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return "Invalid email or password. Please check your credentials and try again.";
      case 'auth/user-disabled':
        return "This user account has been disabled.";
      case 'auth/email-already-in-use':
        return "This email address is already in use.";
      case 'auth/weak-password':
        return "The password is too weak. Please use a stronger password.";
      case 'auth/requires-recent-login':
        return "This operation is sensitive and requires recent authentication. Log in again before retrying this request.";
      case 'auth/api-key-not-valid':
        return "Firebase API Key is not valid. Please check your .env configuration.";
      case 'auth/configuration-not-found':
        return "Email/Password sign-in is not enabled in Firebase. Please enable it in the Firebase console (Authentication > Sign-in method).";
      case 'auth/too-many-requests':
        return "Access to this account has been temporarily disabled due to many failed login attempts. You can try again later or reset your password.";
      default:
        console.error("Unhandled Firebase Auth Error:", error.code, error.message, error);
        return error.message || "An unexpected error occurred. Please try again.";
    }
  };

  const onLogin: SubmitHandler<LoginFormValues> = async (data) => {
    console.log("onLogin: Submitting with data:", data);
    try {
      console.log("onLogin: Calling signIn from useAuth...");
      await signIn(data.email, data.password);
      console.log("onLogin: signIn call successful.");
      toast({ title: "Login Successful!", description: "Welcome back to Local Hive." });
      router.push('/');
    } catch (error: any) {
      console.error("onLogin: Login error caught in AuthPageContent:", error.code, error.message, error);
      const message = getFirebaseErrorMessage(error as AuthError);
      toast({ title: "Login Failed", description: message, variant: "destructive" });
    } finally {
      console.log("onLogin: Submit handler finally block reached. isSubmitting should be reset by RHF.");
    }
  };

  const onSignup: SubmitHandler<SignupFormValues> = async (data) => {
    console.log("onSignup: Submitting with data:", data);
    try {
      console.log("onSignup: Calling signUp from useAuth...");
      await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as UserRole,
        phoneNumber: data.phone,
      });
      console.log("onSignup: signUp call successful.");
      toast({ title: "Signup Successful!", description: `Welcome to Local Hive, ${data.name}!` });
      router.push('/');
    } catch (error: any) {
      console.error("onSignup: Signup error caught in AuthPageContent:", error.code, error.message, error);
      const message = getFirebaseErrorMessage(error as AuthError);
      toast({ title: "Signup Failed", description: message, variant: "destructive" });
    } finally {
       console.log("onSignup: Submit handler finally block reached. isSubmitting should be reset by RHF.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{authMode === 'login' ? 'Welcome Back!' : 'Join Local Hive'}</CardTitle>
          <CardDescription>{authMode === 'login' ? 'Log in to discover and share skills.' : 'Create an account to get started.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {authMode === 'login' ? (
            <Form {...loginForm} key="login-form">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="email" placeholder="you@example.com" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log In"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...signupForm} key="signup-form">
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                 <FormField
                  control={signupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Your Name" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="email" placeholder="you@example.com" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" placeholder="+1234567890" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>I am a...</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4 pt-1"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="learner" id="role-learner" />
                            </FormControl>
                            <Label htmlFor="role-learner" className="font-normal">Learner</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="teacher" id="role-teacher" />
                            </FormControl>
                            <Label htmlFor="role-teacher" className="font-normal">Teacher</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                  {signupForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              // Reset forms when switching modes to avoid state leakage
              if (authMode === 'login') {
                signupForm.reset();
              } else {
                loginForm.reset();
              }
            }}>
              {authMode === 'login' ? 'Sign Up' : 'Log In'}
            </Button>
          </p>
          <div className="text-xs text-muted-foreground">
            By continuing, you agree to Local Hive's <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <AuthPageContent />
    </Suspense>
  );
}