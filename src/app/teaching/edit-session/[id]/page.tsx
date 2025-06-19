"use client";

import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AppLayoutClient';
import { CATEGORIES, type SessionDocument } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Loader2, ShieldAlert, Users, CalendarClock, MapPinIcon, Search, Edit3 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LocationPickerMap from '@/components/maps/LocationPickerMap';

const sessionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(3, "Location address is required"),
  latitude: z.coerce.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  longitude: z.coerce.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  dateTime: z.date({ required_error: "Date and time are required" }),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  maxParticipants: z.coerce.number().min(1, "Must allow at least 1 participant").optional(),
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
}).refine(data => (data.latitude === undefined && data.longitude === undefined) || (data.latitude !== undefined && data.longitude !== undefined), {
  message: "Both latitude and longitude must be provided, or neither.",
  path: ["latitude"],
});

type SessionFormValues = z.infer<typeof sessionSchema>;

const defaultMapCenter: [number, number] = [20.5937, 78.9629]; // Center of India

export default function EditSessionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [pincode, setPincode] = useState<string | null>(null);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const { register, handleSubmit, control, reset, setValue, getValues, formState: { errors, isSubmitting } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
  });

  useEffect(() => {
    if (sessionId && user) {
      const fetchSession = async () => {
        setIsPageLoading(true);
        try {
          const sessionDocRef = doc(db, "sessions", sessionId);
          const sessionSnap = await getDoc(sessionDocRef);

          if (sessionSnap.exists()) {
            const sessionData = sessionSnap.data() as SessionDocument;
            if (sessionData.teacherId !== user.id) {
              toast({ title: "Access Denied", description: "You can only edit your own sessions.", variant: "destructive" });
              router.push('/teaching');
              return;
            }
            const formData = {
              ...sessionData,
              dateTime: (sessionData.dateTime as Timestamp).toDate(),
              latitude: sessionData.coordinates?.lat,
              longitude: sessionData.coordinates?.lng,
              maxParticipants: sessionData.maxParticipants || undefined,
              coverImageUrl: sessionData.coverImageUrl || "",
            };
            reset(formData);
            if (sessionData.coordinates) {
              setMarkerPosition([sessionData.coordinates.lat, sessionData.coordinates.lng]);
            }
          } else {
            toast({ title: "Not Found", description: "Session not found.", variant: "destructive" });
            router.push('/teaching');
          }
        } catch (error) {
          console.error("Error fetching session for edit:", error);
          toast({ title: "Error", description: "Could not load session details.", variant: "destructive" });
          router.push('/teaching');
        } finally {
          setIsPageLoading(false);
        }
      };
      fetchSession();
    } else if (!user && isAuthenticated === false && typeof window !== "undefined") { 
        router.push('/auth');
    }
  }, [sessionId, user, reset, toast, router, isAuthenticated]);

  if (!isAuthenticated || user?.role !== 'teacher') {
    // Redirection logic handled in useEffect or by parent layout
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <Button onClick={() => router.push(isAuthenticated ? '/' : '/auth')}>Go Home</Button>
      </div>
    );
  }

  if (isPageLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const handleLocationSelect = (coords: [number, number]) => {
    setMarkerPosition(coords);
    setValue("latitude", coords[0], { shouldValidate: true });
    setValue("longitude", coords[1], { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<SessionFormValues> = async (data) => {
    if (!user) {
      toast({title: "Error", description: "User not found.", variant: "destructive"});
      return;
    }
    try {
      const sessionDocRef = doc(db, "sessions", sessionId);
      const dataToUpdate: Partial<SessionDocument> = {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        dateTime: Timestamp.fromDate(data.dateTime),
        price: data.price,
        status: data.status,
        maxParticipants: data.maxParticipants,
        coverImageUrl: data.coverImageUrl || "", // Ensure empty string if cleared
        updatedAt: serverTimestamp() as Timestamp,
        teacherName: user.name, 
        teacherProfilePictureUrl: user.profilePictureUrl || "",
      };

      if (data.latitude !== undefined && data.longitude !== undefined) {
        dataToUpdate.coordinates = { lat: data.latitude, lng: data.longitude };
      } else {
        dataToUpdate.coordinates = undefined; // Or firebase.firestore.FieldValue.delete()
      }
      
      if (data.maxParticipants === undefined || data.maxParticipants === null || isNaN(data.maxParticipants)) {
        delete dataToUpdate.maxParticipants;
      }
      if (data.coverImageUrl) {
        dataToUpdate.dataAiHint = data.category?.toLowerCase() || "education skill";
      }


      await updateDoc(sessionDocRef, dataToUpdate);
      toast({ title: "Session Updated!", description: `Your session "${data.title}" has been updated.`, icon: <Check className="h-5 w-5 text-green-500" /> });
      router.push('/teaching');
    } catch (error: any) {
      console.error("Error updating session:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update session.", variant: "destructive"});
    }
  };

  // Compute marker position from form fields if available
  const latitude = getValues('latitude');
  const longitude = getValues('longitude');
  const markerPositionFromForm = (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude))
    ? [latitude, longitude] as [number, number]
    : markerPosition;

  // Handler for pincode search
  const handlePincodeSearch = async () => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      toast({ title: "Invalid Pincode", description: "Please enter a valid 6-digit Indian pincode.", variant: "destructive" });
      return;
    }
    setIsPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        // Use only pincode and India for geocoding
        const address = `${pincode}, India`;
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lng = parseFloat(geoData[0].lon);
          handleLocationSelect([lat, lng]);
          toast({ title: "Pincode Found", description: `Marker moved to ${address}.` });
        } else {
          toast({ title: "Location Not Found", description: "Could not find coordinates for this pincode.", variant: "destructive" });
        }
      } else {
        toast({ title: "Pincode Not Found", description: "No data found for this pincode.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch location for pincode.", variant: "destructive" });
    } finally {
      setIsPincodeLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center"><Edit3 className="mr-3 w-7 h-7 text-primary" /> Edit Session</CardTitle>
          <CardDescription>Update the details for your skill session.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} rows={5} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location Address (Street, City)</Label>
                 <div className="flex gap-2">
                  <Input id="location" placeholder="e.g., 123 Main St, Anytown or Online" {...register("location")} />
                </div>
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Pin Location on Map (Optional)</Label>
              <div className="h-[400px] rounded-md overflow-hidden border">
                <LocationPickerMap
                  initialLocation={markerPositionFromForm || defaultMapCenter}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" placeholder="e.g., 34.0522" {...register("latitude")} />
                {errors.latitude && <p className="text-sm text-destructive">{errors.latitude.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" placeholder="e.g., -118.2437" {...register("longitude")} />
                {errors.longitude && <p className="text-sm text-destructive">{errors.longitude.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTime">Date and Time</Label>
              <Controller
                name="dateTime"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                        <CalendarClock className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date and time</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                            const currentOrSelectedDate = date || field.value || new Date();
                            const newDateTime = new Date(currentOrSelectedDate);
                             if(field.value) {
                                newDateTime.setHours(field.value.getHours());
                                newDateTime.setMinutes(field.value.getMinutes());
                            } else {
                                newDateTime.setHours(10, 0, 0, 0);
                            }
                            field.onChange(newDateTime);
                        }}
                        initialFocus
                      />
                      <div className="p-2 border-t">
                        <Label htmlFor="sessionTimeEdit">Time (HH:MM)</Label>
                        <Input type="time" id="sessionTimeEdit" className="mt-1"
                          defaultValue={field.value ? format(field.value, "HH:mm") : "10:00"}
                          onChange={(e) => {
                            const timeParts = e.target.value.split(':');
                            const hours = parseInt(timeParts[0], 10);
                            const minutes = parseInt(timeParts[1], 10);
                            const newDateTime = field.value ? new Date(field.value) : new Date();
                            newDateTime.setHours(hours, minutes, 0, 0);
                            field.onChange(newDateTime);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dateTime && <p className="text-sm text-destructive">{errors.dateTime.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <div className="flex items-center gap-1 text-lg relative">
                  <span className="font-bold absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <Input id="price" type="number" step="0.01" {...register("price")} className="pl-8"/>
                </div>
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="maxParticipants" type="number" {...register("maxParticipants")} className="pl-10"/>
                </div>
                {errors.maxParticipants && <p className="text-sm text-destructive">{errors.maxParticipants.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Session Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover Image URL (Optional)</Label>
              <Input id="coverImageUrl" {...register("coverImageUrl")} />
              {errors.coverImageUrl && <p className="text-sm text-destructive">{errors.coverImageUrl.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-6 bg-muted/30 border-t">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
