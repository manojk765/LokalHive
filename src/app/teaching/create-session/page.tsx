"use client";

import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Check, Loader2, PlusCircle, ShieldAlert, Users, CalendarClock, MapPinIcon, Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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
  coverImageUrl: z.string().url("Must be a valid URL (e.g., https://...)").optional().or(z.literal("")),
}).refine(data => (data.latitude === undefined && data.longitude === undefined) || (data.latitude !== undefined && data.longitude !== undefined), {
  message: "Both latitude and longitude must be provided, or neither.",
  path: ["latitude"],
});

type SessionFormValues = z.infer<typeof sessionSchema>;

const defaultMapCenter: [number, number] = [20.5937, 78.9629]; // Center of India

export default function CreateSessionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [pincode, setPincode] = useState('');
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const { register, handleSubmit, control, setValue, getValues, formState: { errors, isSubmitting } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      price: 0,
      coverImageUrl: "",
    }
  });

  // Handler for when a location is picked on the map
  const handleLocationSelect = (coords: [number, number]) => {
    setMarkerPosition(coords);
    setValue("latitude", coords[0], { shouldValidate: true });
    setValue("longitude", coords[1], { shouldValidate: true });
  };

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

  if (!isAuthenticated || user?.role !== 'teacher') {
    if (typeof window !== "undefined") {
      router.push(isAuthenticated && user?.role === 'learner' ? '/bookings' : '/auth');
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">Only teachers can create sessions.</p>
        <Button onClick={() => router.push('/auth')}>Go to Login</Button>
      </div>
    );
  }

  const onSubmit: SubmitHandler<SessionFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }

    const sessionDataToSave: Partial<SessionDocument> = {
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      dateTime: Timestamp.fromDate(data.dateTime),
      price: data.price,
      status: "pending",
      teacherId: user.id,
      teacherName: user.name || "Unknown Teacher",
      teacherProfilePictureUrl: user.profilePictureUrl || "",
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    if (data.maxParticipants) sessionDataToSave.maxParticipants = data.maxParticipants;
    if (data.coverImageUrl) {
        sessionDataToSave.coverImageUrl = data.coverImageUrl;
        sessionDataToSave.dataAiHint = data.category?.toLowerCase() || "education skill";
    }
    if (data.latitude !== undefined && data.longitude !== undefined) {
      sessionDataToSave.coordinates = { lat: data.latitude, lng: data.longitude };
    }

    try {
      const docRef = await addDoc(collection(db, "sessions"), sessionDataToSave);
      toast({ title: "Session Created!", description: `Your session "${data.title}" has been created.`, icon: <Check className="h-5 w-5 text-green-500" /> });
      router.push('/teaching');
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast({ title: "Creation Failed", description: `Could not create session: ${error.message}.`, variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center"><PlusCircle className="mr-3 w-7 h-7 text-primary" /> Create New Session</CardTitle>
          <CardDescription>Fill in the details to offer your skill session.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input id="title" placeholder="e.g., Beginner's Watercolor Painting" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Detailed description..." {...register("description")} rows={5} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <div className="flex gap-2 mt-2 items-center">
                  <Input
                    id="pincode"
                    placeholder="Enter Indian Pincode"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    maxLength={6}
                    className="w-40"
                  />
                  <Button type="button" onClick={handlePincodeSearch} disabled={isPincodeLoading || !/^[1-9][0-9]{5}$/.test(pincode)}>
                    {isPincodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find on Map"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pin Location on Map (Optional)</Label>
              <div className="h-[400px] rounded-md overflow-hidden border">
                <LocationPickerMap
                  initialLocation={markerPosition || defaultMapCenter}
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
                        <Label htmlFor="sessionTime">Time (HH:MM)</Label>
                        <Input type="time" id="sessionTime" className="mt-1"
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
                  <Input id="price" type="number" step="0.01" placeholder="0.00 for Free" {...register("price")} className="pl-8"/>
                </div>
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="maxParticipants" type="number" placeholder="e.g., 10" {...register("maxParticipants")} className="pl-10"/>
                </div>
                {errors.maxParticipants && <p className="text-sm text-destructive">{errors.maxParticipants.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover Image URL (Optional)</Label>
              <Input id="coverImageUrl" placeholder="https://example.com/session-image.png" {...register("coverImageUrl")} />
              {errors.coverImageUrl && <p className="text-sm text-destructive">{errors.coverImageUrl.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-6 bg-muted/30 border-t">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Create Session
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
