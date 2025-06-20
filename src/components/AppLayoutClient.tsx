"use client";

import type { UserProfile, UserRole } from "@/lib/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  db,
} from "@/lib/firebase"; // db is imported here
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
  type AuthError,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp } from "firebase/firestore";

import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader as AppSidebarHeader, // Renamed to avoid conflict with SheetHeader
  SidebarContent as AppSidebarContent, // Renamed
  SidebarFooter as AppSidebarFooter, // Renamed
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Home,
  Sparkles,
  BookOpenCheck,
  GraduationCap,
  MessageSquare,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  Loader2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Rss,
  Handshake,
  Bot, // Added Bot icon
  User,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"; // Added SheetHeader, SheetTitle
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";


interface SignUpData {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  provider?: 'google' | 'email';
}


interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<FirebaseUser>;
  signUp: (data: SignUpData) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  updateUserProfileInContext: (updatedProfileData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) {
      console.error("Auth or DB not initialized");
      setIsLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log("onAuthStateChanged: fbUser received:", fbUser?.uid || "null");
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userDocRef = doc(db!, "users", fbUser.uid);
        console.log("onAuthStateChanged: Attempting to fetch user document from Firestore. Path:", userDocRef.path);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log("onAuthStateChanged: User document found in Firestore:", userData);
            setUser({ id: fbUser.uid, ...userData } as UserProfile);
          } else {
            console.warn("onAuthStateChanged: User document NOT found in Firestore for UID:", fbUser.uid, "Path queried:", userDocRef.path, "This might happen if signup didn't complete Firestore write or if user was created only in Auth.");
             setUser({
              id: fbUser.uid,
              email: fbUser.email || "",
              name: fbUser.displayName || `User ${fbUser.uid.substring(0,5)} (No DB Profile)`,
              role: "learner", // Default role, should be set during signup
              createdAt: Timestamp.now()
            });
          }
        } catch (error: any) {
            console.error("onAuthStateChanged: Error fetching user document from Firestore for UID:", fbUser.uid, "Code:", error?.code, "Message:", error?.message, "Full Error:", error);
            setUser({
              id: fbUser.uid,
              email: fbUser.email || "",
              name: fbUser.displayName || `User ${fbUser.uid.substring(0,5)} (DB Fetch Error)`,
              role: "learner", // Default or fallback role
              createdAt: Timestamp.now()
            });
        }
      } else {
        console.log("onAuthStateChanged: No Firebase user (user signed out or not logged in).");
        setUser(null);
        setFirebaseUser(null);
      }
      setIsLoading(false);
      console.log("onAuthStateChanged: Auth loading state set to false.");
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfileInContext = async (updatedProfileData: Partial<UserProfile>) => {
    if (!firebaseUser || !user || !db) { // Check if user exists before updating
      console.warn("updateUserProfileInContext called but no firebaseUser, local user state, or db found.");
      return;
    }
    const userDocRef = doc(db, "users", firebaseUser.uid);
    try {
      // Ensure not writing undefined values to Firestore for top-level fields
      const sanitizedData = Object.fromEntries(
        Object.entries(updatedProfileData).filter(([_, value]) => value !== undefined)
      );
      await updateDoc(userDocRef, sanitizedData);
      
      // Optimistically update local state or re-fetch for consistency
      setUser(prevUser => prevUser ? ({ ...prevUser, ...sanitizedData, updatedAt: Timestamp.now() }) : null);

      toast({ title: "Profile Updated", description: "Your profile has been refreshed." });
    } catch (error: any) {
      console.error("Error updating profile in context/Firestore:", error.code, error.message, error);
      toast({ title: "Update Error", description: "Could not refresh profile data.", variant: "destructive" });
    }
  };


  const fbsignIn = async (email: string, pass: string) => {
    if (!auth) {
      throw new Error("Auth not initialized");
    }
    console.log("fbsignIn: Attempting to sign in with email:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      console.log("fbsignIn: Firebase signInWithEmailAndPassword successful for:", email, "UID:", userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("fbsignIn: Firebase signInWithEmailAndPassword failed for email:", email, "Code:", authError.code, "Message:", authError.message, "Full Error:", authError);
       if (authError.code === 'auth/configuration-not-found') {
        toast({
          title: "Configuration Error",
          description: "Email/Password sign-in is not enabled in your Firebase project. Please enable it in the Firebase console.",
          variant: "destructive",
          duration: 10000,
        });
      }
      throw authError;
    }
  };

  const fbsignUp = async (data: SignUpData) => {
    console.log("fbsignUp: Attempting to sign up with email:", data.email);
    if (!db) {
      console.error("fbsignUp: Firestore 'db' instance is null. Firebase might not be initialized correctly. Check src/lib/firebase.ts and .env file.");
      toast({ title: "Internal Error", description: "Database service not available.", variant: "destructive"});
      throw new Error("Firestore 'db' instance is null.");
    }
    if (!auth) {
      console.error("fbsignUp: Firebase 'auth' instance is null. Firebase might not be initialized correctly. Check src/lib/firebase.ts and .env file.");
      toast({ title: "Internal Error", description: "Authentication service not available.", variant: "destructive"});
      throw new Error("Firebase 'auth' instance is null.");
    }

    try {
      if (!data.password) {
        console.error("fbsignUp: Password is required for email/password signup.");
        throw new Error("Password is required for email/password signup.");
      }
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const fbNewUser = userCredential.user;
      console.log("fbsignUp: Firebase createUserWithEmailAndPassword successful for:", data.email, "UID:", fbNewUser.uid);

      const userDocRef = doc(db, "users", fbNewUser.uid);
      const userProfileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt?: any } = {
        email: fbNewUser.email || data.email,
        name: data.name,
        role: data.role,
        phoneNumber: data.phoneNumber || "",
        profilePictureUrl: fbNewUser.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        skills: [],
        availability: "",
        preferences: "",
        bio: "",
        ...(data.role === 'teacher' && { experience: "" }),
      };

      console.log(`fbsignUp: PREPARING TO CREATE Firestore user document. Path: ${userDocRef.path}. Data:`, JSON.stringify(userProfileData, null, 2));
      
      await setDoc(userDocRef, userProfileData);
      console.log("fbsignUp: Firestore user document SUCCESSFULLY created for UID:", fbNewUser.uid, "at path:", userDocRef.path);

      const freshUserProfile = {
          id: fbNewUser.uid,
          ...userProfileData
      } as UserProfile;
      setUser(freshUserProfile); // Set local user state immediately
      setFirebaseUser(fbNewUser); // Set local firebase user state

      return fbNewUser;
    } catch (error: any) {
      const authError = error as AuthError;
      console.error("fbsignUp: Firebase operation (Auth or Firestore setDoc) FAILED:", authError?.code, authError?.message, "Full Error Object:", error);
       if (authError?.code === 'auth/configuration-not-found') {
         toast({
           title: "Configuration Error",
           description: "Email/Password sign-in is not enabled in your Firebase project. Please enable it in the Firebase console (Authentication > Sign-in method).",
           variant: "destructive",
           duration: 10000,
         });
       } else if (error.name === 'FirebaseError' && error.code === 'permission-denied') {
          toast({
            title: "Firestore Permission Denied",
            description: "Could not save user profile to database. Check Firestore security rules for the 'users' collection.",
            variant: "destructive",
            duration: 10000,
          });
        }
        else {
          toast({
            title: "Signup Error",
            description: authError?.message || error?.message || "An unexpected error occurred during signup. Check console for details.",
            variant: "destructive",
          });
        }
        throw authError || error;
      }
    };

  const fbsignOut = async () => {
    if (!auth) {
      console.error("Auth not initialized for sign out");
      return;
    }
    console.log("fbsignOut: Attempting to sign out.");
    try {
      await firebaseSignOut(auth);
      console.log("fbsignOut: Firebase signOut successful.");
      setUser(null); // Clear local user state on sign out
      setFirebaseUser(null); // Clear local Firebase user state
    } catch (error: any) {
      console.error("fbsignOut: Error during Firebase sign out:", error.code, error.message, "Full Error:", error);
      toast({ title: "Logout Error", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };


  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isAuthenticated: !!firebaseUser && !!user, // Ensure both are set for true authentication
      isLoading,
      signIn: fbsignIn,
      signUp: fbsignUp,
      signOut: fbsignOut,
      updateUserProfileInContext
    }}>
      {children}
    </AuthContext.Provider>
  );
}

const TopNavbar = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Logo />
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          {!isAuthenticated ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth?type=signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className={pathname === "/" ? "bg-accent text-black" : ""}>
                <Link href="/">Discover</Link>
              </Button>
              {user?.role === "learner" && (
                <>
                  <Button asChild variant="ghost" className={pathname === "/recommendations" ? "bg-accent text-black" : ""}>
                    <Link href="/recommendations">AI Picks</Link>
                  </Button>
                  <Button asChild variant="ghost" className={pathname === "/bookings" ? "bg-accent text-black" : ""}>
                    <Link href="/bookings">My Bookings</Link>
                  </Button>
                </>
              )}
              {user?.role === "teacher" && (
                <>
                  <Button asChild variant="ghost" className={pathname === "/teaching" ? "bg-accent text-black" : ""}>
                    <Link href="/teaching">My Teaching</Link>
                  </Button>
                  <Button asChild variant="ghost" className={pathname === "/teaching/ai-assistant" ? "bg-accent text-black" : ""}>
                    <Link href="/teaching/ai-assistant">AI Helper</Link>
                  </Button>
                </>
              )}
              <Button asChild variant="ghost" className={pathname.startsWith("/chat") ? "bg-accent text-black" : ""}>
                <Link href="/chat">Chat</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 bg-accent text-black dark:text-black hover:text-white dark:hover:text-white">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.profilePictureUrl || undefined} alt={user?.name || ""} />
                      <AvatarFallback className="bg-black text-white">{user?.name?.substring(0, 2).toUpperCase() || 'LH'}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile"><Settings className="mr-2 h-4 w-4" /> Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, signOut, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Discover", icon: Home, roles: ["learner", "teacher"] },
    { href: "/recommendations", label: "AI Picks", icon: Sparkles, roles: ["learner"] }, // Only for learners
    { href: "/teaching/ai-assistant", label: "AI Session Helper", icon: Bot, roles: ["teacher"] }, // Only for teachers
    { href: "/bookings", label: "My Bookings", icon: BookOpenCheck, roles: ["learner"] },
    { href: "/teaching", label: "My Teaching", icon: GraduationCap, roles: ["teacher"] },
    { href: "/chat", label: "Chat", icon: MessageSquare, badge: 0, roles: ["learner", "teacher"] },
  ];

  const filteredNavLinks = navLinks.filter(link => {
    return isAuthenticated && user && link.roles.includes(user.role);
  });

  const handleSignOut = async () => {
    await signOut();
    if (isMobile) setMobileSheetOpen(false);
    router.push('/');
  };

  const NavContent = () => (
    <>
      {filteredNavLinks.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname === link.href}
              onClick={() => isMobile && setMobileSheetOpen(false)}
              tooltip={link.label}
            >
              <link.icon />
              <span>{link.label}</span>
              {link.badge !== undefined && link.badge > 0 ? <SidebarMenuBadge>{link.badge}</SidebarMenuBadge> : null}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </>
  );

  if (isLoading && pathname === "/" && !isAuthenticated) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  } else if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <TopNavbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // For authenticated users, show only TopNavbar, main, and Footer (no sidebar)
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

const UserDropdown = ({ user, logoutAction }: { user: UserProfile; logoutAction: () => void; }) => {
  let sidebarState: "expanded" | "collapsed" = 'expanded';

  try {
    const { state: actualState } = useSidebar();
    sidebarState = actualState;
  } catch (error) {
    // This catch block is for when UserDropdown is used outside SidebarProvider (e.g., mobile sheet)
    // console.warn("UserDropdown: Could not get sidebar state via useSidebar(), defaulting to 'expanded'. This is expected in mobile view if not wrapped by SidebarProvider.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`justify-start w-full p-2 ${sidebarState === 'collapsed' ? 'h-10 w-10 rounded-full p-0 flex items-center justify-center' : ''}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profilePictureUrl || undefined} alt={user.name || ""} data-ai-hint="person placeholder" />
            <AvatarFallback className="bg-black text-white">{user.name?.substring(0, 2).toUpperCase() || 'LH'}</AvatarFallback>
          </Avatar>
          {sidebarState !== 'collapsed' && <span className="ml-2 font-medium truncate">{user.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile"><Settings className="mr-2 h-4 w-4" /> Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logoutAction}>
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Footer = () => {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <footer className="py-8 px-4 md:px-6 border-t bg-card text-card-foreground">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Logo />
            <p className="text-sm text-muted-foreground mt-2">
              Connecting skills, empowering communities.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#discover-sessions" className="text-muted-foreground hover:text-primary">Discover Sessions</Link></li>
              {!isAuthenticated ? (
                <>
                  <li><Link href="/auth?type=signup&role=teacher" className="text-muted-foreground hover:text-primary">Become a Teacher</Link></li>
                  <li><Link href="/auth" className="text-muted-foreground hover:text-primary">Log In</Link></li>
                  <li><Link href="/auth?type=signup" className="text-muted-foreground hover:text-primary">Sign Up</Link></li>
                </>
              ) : user?.role === 'learner' ? (
                <>
                  <li><Link href="/recommendations" className="text-muted-foreground hover:text-primary">AI Recommendations</Link></li>
                  <li><Link href="/bookings" className="text-muted-foreground hover:text-primary">My Bookings</Link></li>
                  <li><Link href="/chat" className="text-muted-foreground hover:text-primary">Chat</Link></li>
                </>
              ) : user?.role === 'teacher' ? (
                <>
                  <li><Link href="/teaching" className="text-muted-foreground hover:text-primary">My Teaching</Link></li>
                  <li><Link href="/teaching/ai-assistant" className="text-muted-foreground hover:text-primary">AI Session Helper</Link></li>
                  <li><Link href="/chat" className="text-muted-foreground hover:text-primary">Chat</Link></li>
                </>
              ) : null}
              <li><Link href="/about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/ngo-partnership" className="text-muted-foreground hover:text-primary flex items-center"><Handshake className="mr-2 h-4 w-4"/>NGO Partnerships</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-primary flex items-center"><Rss className="mr-2 h-4 w-4"/>Blog</Link></li>
              {isAuthenticated && (
                <li><Link href="/profile" className="text-muted-foreground hover:text-primary flex items-center"><User className="mr-2 h-4 w-4"/>Profile</Link></li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Local Hive. All rights reserved.
          <Link href="/privacy" className="ml-2 underline hover:text-primary">Privacy Policy</Link>
          <Link href="/terms" className="ml-2 underline hover:text-primary">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};
