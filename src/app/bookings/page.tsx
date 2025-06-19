"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AppLayoutClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ShieldAlert, Frown, Loader2, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BookingRequest, Session } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface EnrichedBooking extends BookingRequest {
  sessionDetails?: Partial<Session>; // Make sessionDetails optional as it's fetched
}

export default function MyBookingsPage() {
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [userBookings, setUserBookings] = useState<EnrichedBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  const fetchUserBookings = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    if (!db) {
      toast({ title: "Firestore Error", description: "Database not initialized.", variant: "destructive" });
      setIsLoadingBookings(false);
      return;
    }
    setIsLoadingBookings(true);
    try {
      const bookingsQuery = query(
        collection(db, "bookingRequests"),
        where("learnerId", "==", user.id),
        orderBy("requestedAt", "desc")
      );
      const querySnapshot = await getDocs(bookingsQuery);
      
      const bookingsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const bookingData = docSnapshot.data(); // No 'as BookingRequest' yet
        let sessionDetails: Partial<Session> | undefined;

        if (bookingData.sessionId) {
          if (!db) return { id: docSnapshot.id } as EnrichedBooking; // Extra guard for type safety
          const sessionDocRef = doc(db, "sessions", bookingData.sessionId);
          const sessionSnap = await getDoc(sessionDocRef);
          if (sessionSnap.exists()) {
            const sessionData = sessionSnap.data();
            sessionDetails = {
              id: sessionSnap.id,
              title: sessionData.title || "Session Title Missing",
              dateTime: (sessionData.dateTime as Timestamp)?.toDate()?.toISOString(),
              location: sessionData.location || "Location TBD",
              coverImageUrl: sessionData.coverImageUrl,
              category: sessionData.category || "Uncategorized",
            };
          }
        }
        return { 
          id: docSnapshot.id, 
          sessionId: bookingData.sessionId || "unknown_session_id",
          sessionTitle: bookingData.sessionTitle || sessionDetails?.title || "Session Title Missing",
          learnerId: bookingData.learnerId || "unknown_learner_id",
          teacherId: bookingData.teacherId || "unknown_teacher_id",
          status: bookingData.status || "pending",
          requestedAt: (bookingData.requestedAt as Timestamp) || Timestamp.now(), // Fallback
          sessionDetails 
        } as EnrichedBooking;
      });

      const fetchedBookings = await Promise.all(bookingsPromises);
      setUserBookings(fetchedBookings);

    } catch (error) {
      console.error("Error fetching user bookings:", error);
      toast({ title: "Error", description: "Could not fetch your bookings.", variant: "destructive" });
    } finally {
      setIsLoadingBookings(false);
    }
  }, [user, isAuthenticated, toast]);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated && user?.role === 'learner') {
      fetchUserBookings();
    } else if (!authIsLoading && (!isAuthenticated || user?.role !== 'learner')) {
      router.push(isAuthenticated && user?.role === 'teacher' ? '/teaching' : '/auth?redirect=/bookings');
    }
  }, [authIsLoading, isAuthenticated, user, router, fetchUserBookings]);


  if (authIsLoading || isLoadingBookings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your bookings...</p>
      </div>
    );
  }
  
  if (!isAuthenticated || user?.role !== 'learner') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">This page is for learners only. Please log in as a learner to view your bookings.</p>
        <Button onClick={() => router.push('/auth?redirect=/bookings')}>Go to Login</Button>
      </div>
    );
  }

  const getStatusBadgeVariant = (status?: BookingRequest['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed': return 'default'; 
      case 'pending': return 'secondary';
      case 'rejected':
      case 'cancelled_by_learner':
      case 'cancelled_by_teacher':
        return 'destructive';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Bookings</h1>
        <p className="text-muted-foreground">Keep track of your requested and confirmed skill sessions.</p>
      </header>

      {userBookings.length > 0 ? (
        <div className="space-y-6">
          {userBookings.map(booking => (
            <Card key={booking.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="md:flex">
                {booking.sessionDetails?.coverImageUrl && (
                  <div className="md:w-1/3">
                    <Image 
                      src={booking.sessionDetails.coverImageUrl} 
                      alt={booking.sessionDetails.title || "Session Image"}
                      width={300}
                      height={200}
                      className="object-cover w-full h-48 md:h-full"
                      data-ai-hint={booking.sessionDetails.category?.toLowerCase() || "education"}
                    />
                  </div>
                )}
                <div className={booking.sessionDetails?.coverImageUrl ? "md:w-2/3" : "w-full"}>
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-semibold mb-1">{booking.sessionDetails?.title || booking.sessionTitle || "Session Title Missing"}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">{(booking.status || "unknown").replace('_', ' ')}</Badge>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">
                       Requested on: {booking.requestedAt instanceof Timestamp ? booking.requestedAt.toDate().toLocaleDateString() : (booking.requestedAt ? new Date(booking.requestedAt as any).toLocaleDateString() : 'N/A')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 text-sm space-y-1">
                    {booking.sessionDetails?.dateTime && (
                      <p><strong>Date & Time:</strong> {
                        (() => {
                          const dt = booking.sessionDetails?.dateTime;
                          let dateObj: Date;
                          if (typeof dt === "string" || dt instanceof Date) {
                            dateObj = new Date(dt);
                          } else if (typeof dt === "object" && dt !== null && "toDate" in dt) {
                            dateObj = dt.toDate();
                          } else {
                            dateObj = new Date();
                          }
                          return dateObj.toLocaleString();
                        })()
                      }</p>
                    )}
                    {booking.sessionDetails?.location && <p><strong>Location:</strong> {booking.sessionDetails.location}</p>}
                    {booking.sessionDetails?.category && <p><strong>Category:</strong> {booking.sessionDetails.category}</p>}
                    {!booking.sessionDetails && <p className="text-muted-foreground">Full session details might be loading or unavailable.</p>}
                  </CardContent>
                  <CardFooter className="p-4 border-t bg-muted/20">
                     <Link href={`/sessions/${booking.sessionId}`} passHref legacyBehavior>
                        <Button variant="outline" size="sm">View Session Details</Button>
                     </Link>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <Frown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Bookings Yet</h2>
            <p className="text-muted-foreground mb-4">You haven't requested or booked any sessions. Start exploring!</p>
            <Button asChild>
              <Link href="/">Discover Sessions</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
