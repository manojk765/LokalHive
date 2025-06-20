
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/AppLayoutClient';
import { Mail, Phone, User, Briefcase, CalendarDays, Settings, Edit3, LogOut, Loader2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, isAuthenticated, signOut , isLoading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || !user) {
    if (typeof window !== "undefined") {
      router.push('/auth?redirect=/profile');
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">Please log in to view your profile.</p>
        <Button onClick={() => router.push('/auth?redirect=/profile')}>Go to Login</Button>
      </div>
    );
  } 
  
  const handleLogout = () => {
    signOut();
    router.push('/');
  };

  const userName = user.name || "User";
  const userEmail = user.email || "No email provided";
  const userRole = user.role || "learner";

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Profile</h1>
        <p className="text-muted-foreground">View and manage your Local Hive account details.</p>
      </header>

      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary shadow-md">
              <AvatarImage src={user.profilePictureUrl || `https://placehold.co/150x150.png?text=${userName.substring(0,2)}`} alt={userName} data-ai-hint="person placeholder" />
              <AvatarFallback className="text-3xl">{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl font-semibold">{userName}</CardTitle>
              <CardDescription className="capitalize text-accent font-medium">{userRole}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-foreground">Contact Information</h3>
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
              <span>{userEmail}</span>
            </div>
            {user.phoneNumber ? (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                <span>{user.phoneNumber}</span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mr-3" />
                <span>No phone number provided.</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-foreground">Profile Details</h3>
             {user.bio ? (
              <div className="text-sm">
                <User className="w-4 h-4 mr-3 text-muted-foreground inline-block align-text-bottom" />
                <span className="font-medium text-muted-foreground">Bio: </span>{user.bio}
              </div>
            ) : (
                 <div className="text-sm text-muted-foreground">
                    <User className="w-4 h-4 mr-3 inline-block align-text-bottom" />
                    <span>No bio provided yet.</span>
                </div>
            )}
            {(user.skills && user.skills.length > 0) ? (
              <div className="text-sm">
                <Briefcase className="w-4 h-4 mr-3 text-muted-foreground inline-block align-text-bottom" />
                <span className="font-medium text-muted-foreground">Skills: </span>
                <div className="inline-flex flex-wrap gap-1 mt-1">
                    {user.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                </div>
              </div>
            ) : (
                 <div className="text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4 mr-3 inline-block align-text-bottom" />
                    <span>No skills listed yet.</span>
                </div>
            )}
            {user.availability ? (
              <div className="text-sm">
                <CalendarDays className="w-4 h-4 mr-3 text-muted-foreground inline-block align-text-bottom" />
                <span className="font-medium text-muted-foreground">Availability: </span>{user.availability}
              </div>
            ) : (
                <div className="text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4 mr-3 inline-block align-text-bottom" />
                    <span>Availability not specified.</span>
                </div>
            )}
             {user.preferences ? (
              <div className="text-sm">
                <Settings className="w-4 h-4 mr-3 text-muted-foreground inline-block align-text-bottom" />
                 <span className="font-medium text-muted-foreground">Preferences: </span>{user.preferences}
              </div>
            ) : (
                 <div className="text-sm text-muted-foreground">
                    <Settings className="w-4 h-4 mr-3 inline-block align-text-bottom" />
                    <span>Preferences not specified.</span>
                </div>
            )}
          </div>

          {user.role === 'teacher' && (
             <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">Teaching Information</h3>
                 {user.experience ? (
                    <div className="text-sm">
                        <User className="w-4 h-4 mr-3 text-muted-foreground inline-block align-text-bottom" />
                        <span className="font-medium text-muted-foreground">Experience: </span>{user.experience}
                    </div>
                 ) : (
                    <div className="text-sm text-muted-foreground">
                        <User className="w-4 h-4 mr-3 inline-block align-text-bottom" />
                        <span>Teaching experience not provided.</span>
                    </div>
                 )}
             </div>
          )}

        </CardContent>
        <CardFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row justify-between gap-3">
          <Button variant="outline" onClick={() => router.push('/profile/edit')}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
