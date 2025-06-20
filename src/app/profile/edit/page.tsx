"use client";

import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AppLayoutClient';
import type { UserProfile } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Loader2, ShieldAlert, UploadCloud } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().optional().or(z.literal("")), // Allow empty string for controlled input
  // profilePictureUrl is handled separately by file upload
  bio: z.string().max(500, "Bio must be 500 characters or less").optional().or(z.literal("")),
  // skills are handled by skillsList state
  availability: z.string().optional().or(z.literal("")),
  preferences: z.string().optional().or(z.literal("")),
  experience: z.string().optional().or(z.literal("")), // Teacher specific
});

// We omit profilePictureUrl from form values as it's not a direct input field
type ProfileFormValues = Omit<z.infer<typeof profileSchema>, 'skills'> & { skills?: string[] };


export default function EditProfilePage() {
  const { user, isAuthenticated, firebaseUser, isLoading: authLoading, updateUserProfileInContext } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentSkill, setCurrentSkill] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [originalSkillsList, setOriginalSkillsList] = useState<string[]>([]);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting,isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { // Ensure all fields have a default non-undefined value
      name: "",
      phoneNumber: "",
      bio: "",
      availability: "",
      preferences: "",
      experience: "",
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
        bio: user.bio || "",
        availability: user.availability || "",
        preferences: user.preferences || "",
        experience: (user.role === 'teacher' ? user.experience : "") || "",
      });
      const userSkills = user.skills || [];
      setSkillsList(userSkills);
      setOriginalSkillsList(userSkills);
      setProfilePicturePreview(user.profilePictureUrl || `https://placehold.co/100x100.png?text=${(user.name || 'LH').substring(0,2)}`);
    }
  }, [user, reset]);

  // Check if skills have changed
  const skillsChanged = JSON.stringify(skillsList) !== JSON.stringify(originalSkillsList);
  
  // Check if any changes have been made
  const hasChanges = isDirty || skillsChanged || profilePictureFile;

  if (authLoading) {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || !user || !firebaseUser) {
    if (typeof window !== "undefined") {
      router.push('/auth?redirect=/profile/edit');
    }
    return (
       <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">Please log in to edit your profile.</p>
        <Button onClick={() => router.push('/auth?redirect=/profile/edit')}>Go to Login</Button>
      </div>
    );
  }
  
  const handleAddSkill = () => {
    if (currentSkill.trim() && !skillsList.includes(currentSkill.trim())) {
      const updatedSkills = [...skillsList, currentSkill.trim()];
      setSkillsList(updatedSkills);
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = skillsList.filter(skill => skill !== skillToRemove);
    setSkillsList(updatedSkills);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!firebaseUser) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive"});
      return;
    }

    if (!storage) {
      toast({ title: "Error", description: "Storage is not initialized.", variant: "destructive"});
      return;
    }

    if (!db) {
      toast({ title: "Error", description: "Database is not initialized.", variant: "destructive"});
      return;
    }

    setIsUploading(true); 

    let newProfilePictureUrl = user.profilePictureUrl;

    if (profilePictureFile) {
      try {
        const storageRef = ref(storage, `profile_pictures/${firebaseUser.uid}/${profilePictureFile.name}`);
        const snapshot = await uploadBytes(storageRef, profilePictureFile);
        newProfilePictureUrl = await getDownloadURL(snapshot.ref);
        toast({ title: "Profile Picture Uploaded!" });
      } catch (error: any) {
        console.error("Profile picture upload error:", error);
        toast({ title: "Upload Failed", description: "Could not upload profile picture. "+ error.message, variant: "destructive"});
        setIsUploading(false);
        return; // Stop if picture upload fails
      }
    }

    const profileDataToUpdate: Partial<UserProfile> = {
      name: data.name,
      phoneNumber: data.phoneNumber || "", // Ensure empty string if undefined
      profilePictureUrl: newProfilePictureUrl || "", // Ensure empty string if undefined/null
      bio: data.bio || "",
      skills: skillsList,
      availability: data.availability || "",
      preferences: data.preferences || "",
    };

    if (user.role === 'teacher') {
      profileDataToUpdate.experience = data.experience || "";
    }
    
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      // Ensure we don't write undefined values to Firestore, convert to null or empty string
      const sanitizedProfileData = Object.fromEntries(
        Object.entries(profileDataToUpdate).map(([key, value]) => [key, value === undefined ? null : value])
      );

      await updateDoc(userDocRef, sanitizedProfileData);
      
      updateUserProfileInContext(sanitizedProfileData as Partial<UserProfile>);
      
      toast({ title: "Profile Updated!", description: "Your profile has been successfully updated." });
      router.push('/profile');
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive"});
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
      </Button>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Edit Profile</CardTitle>
          <CardDescription>Update your personal information and preferences.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={profilePicturePreview || `https://placehold.co/100x100.png?text=${(user?.name || 'LH').substring(0,2)}`} data-ai-hint="person placeholder"/>
                <AvatarFallback>{(user?.name || 'LH').substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/gif"
                className="hidden" 
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <UploadCloud className="mr-2 h-4 w-4"/> Change Picture
              </Button>
              {profilePictureFile && <p className="text-xs text-muted-foreground">New: {profilePictureFile.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Cannot be changed)</Label>
                <Input id="email" value={user.email} disabled />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" type="tel" {...register("phoneNumber")} />
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell us a bit about yourself..." {...register("bio")} rows={4} />
              {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <div className="flex gap-2 mb-2">
                    <Input 
                        id="skill-input" 
                        placeholder="Add a skill (e.g., Painting)" 
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill();}}}
                    />
                    <Button type="button" variant="outline" onClick={handleAddSkill}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {skillsList.map(skill => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1 text-muted-foreground hover:text-destructive">&times;</button>
                        </Badge>
                    ))}
                </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Input id="availability" placeholder="e.g., Weekends, Evenings after 6 PM" {...register("availability")} />
              {errors.availability && <p className="text-sm text-destructive">{errors.availability.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferences">Preferences</Label>
              <Textarea id="preferences" placeholder="e.g., Preferred learning style, topics of interest" {...register("preferences")} />
              {errors.preferences && <p className="text-sm text-destructive">{errors.preferences.message}</p>}
            </div>
            
            {user.role === 'teacher' && (
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (for Teachers)</Label>
                <Textarea id="experience" placeholder="Describe your teaching experience" {...register("experience")} />
                {errors.experience && <p className="text-sm text-destructive">{errors.experience.message}</p>}
              </div>
            )}
            
            {user.role === 'teacher' && (
              <div className="space-y-2 border-t pt-4 mt-4">
                <Label htmlFor="idVerification">ID Verification (Teachers)</Label>
                <div className="flex items-center gap-2 p-3 border border-dashed rounded-md">
                  <UploadCloud className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Upload ID Document</p>
                    <p className="text-xs text-muted-foreground">Feature coming soon! (Storage integration)</p>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="p-6 bg-muted/30 border-t">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isUploading || (!hasChanges) }>
              {(isSubmitting || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
