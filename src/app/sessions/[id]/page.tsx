"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextImage from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Session, UserProfile, BookingRequestDocument, SessionDocument, BookingRequest } from '@/lib/types';
import { CalendarDays, Clock, DollarSign, Layers, MapPin, MessageSquare, User, Users, Loader2, ArrowLeft, Send, AlertCircle, ListChecks, UserCheck, Info } from 'lucide-react';
import { useAuth } from '@/components/AppLayoutClient';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, Timestamp, query, where, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import SessionMap from '@/components/maps/SessionMap';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from '@/lib/firebase';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authIsLoadingFromContext } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [teacher, setTeacher] = useState<Partial<UserProfile> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [existingBookingStatus, setExistingBookingStatus] = useState<BookingRequest['status'] | null>(null);
  const [confirmedAttendees, setConfirmedAttendees] = useState<BookingRequest[]>([]);
  const [isSessionFull, setIsSessionFull] = useState(false);

  const id = params.id as string;

  const fetchSessionAndRelatedData = useCallback(async (
    currentIsAuthenticated: boolean,
    currentUser: UserProfile | null
  ) => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setSession(null); 
    setTeacher(null); 
    setConfirmedAttendees([]); 
    setExistingBookingStatus(null);

    let loadedSession: Session | null = null;

    try {
      if (!db) {
        toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const sessionDocRef = doc(db, "sessions", id);
      const sessionSnap = await getDoc(sessionDocRef);

      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data() as Partial<SessionDocument>;
        loadedSession = {
          id: sessionSnap.id,
          title: sessionData.title || "Untitled Session",
          description: sessionData.description || "No description provided.",
          category: sessionData.category || "Uncategorized",
          teacherId: sessionData.teacherId || "unknown_teacher",
          teacherName: sessionData.teacherName || "Unknown Teacher",
          teacherProfilePictureUrl: sessionData.teacherProfilePictureUrl,
          location: sessionData.location || "Location not specified",
          coordinates: sessionData.coordinates,
          dateTime: sessionData.dateTime instanceof Timestamp ? sessionData.dateTime.toDate().toISOString() : (sessionData.dateTime ? new Date(sessionData.dateTime as any).toISOString() : new Date().toISOString()),
          price: typeof sessionData.price === 'number' ? sessionData.price : 0,
          maxParticipants: sessionData.maxParticipants,
          status: sessionData.status || "pending",
          coverImageUrl: sessionData.coverImageUrl,
          dataAiHint: sessionData.dataAiHint,
          createdAt: sessionData.createdAt instanceof Timestamp ? sessionData.createdAt.toDate() : (sessionData.createdAt ? new Date(sessionData.createdAt as any) : new Date()),
          updatedAt: sessionData.updatedAt instanceof Timestamp ? sessionData.updatedAt.toDate() : (sessionData.updatedAt ? new Date(sessionData.updatedAt as any) : undefined),
        };
        setSession(loadedSession);
      } else {
        toast({ title: "Session Not Found", description: "The session you are looking for does not exist.", variant: "destructive" });
        setIsLoading(false);
        return; 
      }
    } catch (error: any) {
      toast({ title: "Error Loading Session", description: `Could not load session details: ${error.message}.`, variant: "destructive", duration: 7000 });
      setIsLoading(false);
      return;
    }

    if (loadedSession && loadedSession.teacherId && loadedSession.teacherId !== "unknown_teacher") {
      try {
        const teacherDocRef = doc(db, "users", loadedSession.teacherId);
        const teacherSnap = await getDoc(teacherDocRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data() as UserProfile;
          setTeacher({
            id: teacherSnap.id,
            name: teacherData.name || "Teacher Name Not Found",
            bio: teacherData.bio || "No bio available.",
            skills: teacherData.skills || [],
            profilePictureUrl: teacherData.profilePictureUrl
          });
        } else {
          setTeacher({ name: loadedSession.teacherName || "Teacher details not found", id: loadedSession.teacherId });
        }
      } catch (teacherError: any) {
        toast({ title: "Error Loading Teacher", description: `Could not load teacher details: ${teacherError.message}.`, variant: "destructive", duration: 7000 });
        setTeacher({ name: "Error loading teacher details" });
      }
    } else if (loadedSession) {
      setTeacher({ name: loadedSession.teacherName || "Teacher details not available" });
    }

    if (loadedSession && currentIsAuthenticated && currentUser) {
      try {
        const bookingsQuery = query(
          collection(db, "bookingRequests"),
          where("sessionId", "==", loadedSession.id),
          where("learnerId", "==", currentUser.id)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        if (!bookingsSnapshot.empty) {
          const existingBooking = bookingsSnapshot.docs[0].data() as BookingRequestDocument;
          setExistingBookingStatus(existingBooking.status);
        } else {
          setExistingBookingStatus(null);
        }
      } catch (bookingError: any) {
        toast({ title: "Error Checking Booking", description: `Could not check your booking status: ${bookingError.message}`, variant: "destructive" });
      }
    }
    
    if (loadedSession && currentIsAuthenticated && currentUser && currentUser.id === loadedSession.teacherId) {
      try {
        if (!db) {
          toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
          setConfirmedAttendees([]);
          return;
        }
        const confirmedBookingsQuery = query(
          collection(db, "bookingRequests"),
          where("sessionId", "==", loadedSession.id),
          where("status", "==", "confirmed")
        );
        const confirmedBookingsSnapshot = await getDocs(confirmedBookingsQuery);
        const attendees: BookingRequest[] = confirmedBookingsSnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          // Ensure all required fields for BookingRequest are present and use Timestamp for requestedAt, updatedAt, sessionDateTime
          return {
            id: docSnap.id,
            sessionId: data.sessionId,
            sessionTitle: data.sessionTitle,
            sessionDateTime: data.sessionDateTime ?? undefined,
            sessionLocation: data.sessionLocation,
            sessionCoverImageUrl: data.sessionCoverImageUrl,
            learnerId: data.learnerId,
            learnerName: data.learnerName,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            status: data.status,
            requestedAt: data.requestedAt ?? Timestamp.now(),
            updatedAt: data.updatedAt ?? undefined,
          } as BookingRequest;
        });
        setConfirmedAttendees(attendees);
      } catch (attendeesError: any) {
        if (attendeesError.code === 'permission-denied' && currentUser?.id === loadedSession?.teacherId) {
           toast({ title: "Teacher: Error Loading Attendees", description: `Could not load your session's attendees: ${attendeesError.message}. This likely means a Firestore security rule prevented access. Check rules for 'bookingRequests'.`, variant: "destructive", duration: 10000 });
        } else if (currentUser?.id === loadedSession?.teacherId) { 
           toast({ title: "Teacher: Error Loading Attendees", description: `Could not load your session's attendees: ${attendeesError.message}.`, variant: "destructive" });
        }
      }
    } else {
      setConfirmedAttendees([]); 
    }

    setIsLoading(false);
  }, [id, toast]); 

  useEffect(() => {
    if (!authIsLoadingFromContext) {
        fetchSessionAndRelatedData(isAuthenticated, user);
    }
  }, [id, isAuthenticated, user, authIsLoadingFromContext, fetchSessionAndRelatedData]);

  useEffect(() => {
    if (session && session.maxParticipants && session.maxParticipants > 0) {
      setIsSessionFull(confirmedAttendees.length >= session.maxParticipants);
    } else {
      setIsSessionFull(false); 
    }
  }, [session, confirmedAttendees]);

  const handleBookingRequest = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Authentication Required", description: "Please log in to book a session.", variant: "destructive" });
      router.push(`/auth?redirect=/sessions/${id}`);
      return;
    }
    if (!session || !session.teacherId || session.teacherId === "unknown_teacher") { 
      toast({ title: "Error", description: "Session data missing or incomplete.", variant: "destructive" });
      return;
    }
    if (user.id === session.teacherId) {
      toast({ title: "Action Not Allowed", description: "You cannot book your own session.", variant: "destructive" });
      return;
    }
    if (isSessionFull) {
      toast({ title: "Session Full", description: "This session has reached its maximum capacity.", variant: "default" });
      return;
    }
    if (existingBookingStatus && existingBookingStatus !== 'rejected' && existingBookingStatus !== 'cancelled_by_learner' && existingBookingStatus !== 'cancelled_by_teacher') {
      toast({ title: "Already Requested", description: `Your booking status is: ${existingBookingStatus}.`, variant: "default" });
      return;
    }

    setIsBookingLoading(true);
    try {
      if (!db) {
        toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
        setIsBookingLoading(false);
        return;
      }
      let sessionDate: Date;
      if (session.dateTime instanceof Timestamp) {
        sessionDate = session.dateTime.toDate();
      } else if (typeof session.dateTime === 'string' || session.dateTime instanceof Date) {
        sessionDate = new Date(session.dateTime);
      } else {
        sessionDate = new Date();
      }
      const bookingData: Omit<BookingRequestDocument, 'id' | 'requestedAt' | 'updatedAt'> = {
        sessionId: session.id,
        sessionTitle: session.title || "Untitled Session",
        sessionDateTime: Timestamp.fromDate(sessionDate),
        sessionLocation: session.location || "Location TBD",
        sessionCoverImageUrl: session.coverImageUrl || "",
        learnerId: user.id,
        learnerName: user.name || "Learner",
        teacherId: session.teacherId, 
        teacherName: teacher?.name || session.teacherName || "Unknown Teacher", 
        status: "pending",
      };
      const docRef = await addDoc(collection(db, "bookingRequests"), {
        ...bookingData,
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Booking Requested!", description: `Your request for \"${session.title}\" has been sent.`, variant: "default" });
      setExistingBookingStatus("pending");
    } catch (error: any) {
      toast({ title: "Booking Failed", description: `Could not submit your booking request: ${error.message}`, variant: "destructive" });
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleChatRequest = async () => {
     if (!isAuthenticated || !user) {
      toast({ title: "Authentication Required", description: "Please log in to chat.", variant: "destructive" });
      router.push(`/auth?redirect=/sessions/${id}`);
      return;
    }
    if (!session || !session.teacherId || session.teacherId === "unknown_teacher" || !teacher || !teacher.id || teacher.id === "unknown_teacher") { 
        toast({ title: "Error", description: "Session or teacher data missing for chat.", variant: "destructive" });
        return;
    }
    if (user.id === session.teacherId) {
      toast({ title: "Action Not Allowed", description: "You cannot chat with yourself.", variant: "destructive" });
      return;
    }
    if (!db) {
      toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
      return;
    }
    
    // Debug logging
    console.log("=== CHAT DEBUG INFO ===");
    console.log("User object:", user);
    console.log("User ID:", user.id);
    console.log("Session teacher ID:", session.teacherId);
    console.log("Teacher object:", teacher);
    console.log("Is authenticated:", isAuthenticated);
    console.log("Firebase auth current user:", auth?.currentUser);
    console.log("Firebase auth UID:", auth?.currentUser?.uid);
    
    // Ensure we have valid IDs
    const learnerId = user.id;
    const teacherId = session.teacherId;
    
    if (!learnerId || !teacherId) {
      toast({ title: "Error", description: "Invalid user or teacher ID for chat.", variant: "destructive" });
      return;
    }
    
    const participantIds = [learnerId, teacherId].sort();
    const chatId = participantIds.join('_');
    
    console.log("Learner ID:", learnerId);
    console.log("Teacher ID:", teacherId);
    console.log("Participant IDs:", participantIds);
    console.log("Chat ID:", chatId);
    
    try {
        // First, check if a chat thread already exists
        const existingChatsQuery = query(
          collection(db, "chatThreads"),
          where("participantIds", "array-contains", learnerId)
        );
        const existingChatsSnapshot = await getDocs(existingChatsQuery);
        
        let existingChatId = null;
        existingChatsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.participantIds && data.participantIds.includes(teacherId)) {
            existingChatId = doc.id;
          }
        });
        
        if (existingChatId) {
          console.log("Chat thread already exists:", existingChatId);
          router.push(`/chat/${existingChatId}`);
          return;
        }
        
        // Create new chat thread using addDoc (auto-generated ID)
        const now = serverTimestamp();
        const teacherForChatInfo = teacher && teacher.id === session.teacherId ? teacher : {name: session.teacherName, profilePictureUrl: session.teacherProfilePictureUrl};
        
        const newThreadData = {
            participantIds: participantIds,
            participantsInfo: {
                [learnerId]: { 
                    name: user.name || "User", 
                    avatarUrl: user.profilePictureUrl || "" 
                },
                [teacherId]: { 
                    name: teacherForChatInfo.name || "Teacher", 
                    avatarUrl: teacherForChatInfo.profilePictureUrl || "" 
                }
            },
            createdAt: now, 
            updatedAt: now, 
            lastMessageText: "", 
            lastMessageSenderId: "",
        };
        
        console.log("Creating chat thread with data:", newThreadData);
        console.log("Checking if current user ID is in participantIds:", participantIds.includes(auth?.currentUser?.uid || ""));
        console.log("Current Firebase auth UID:", auth?.currentUser?.uid);
        console.log("Participant IDs array:", participantIds);
        
        const docRef = await addDoc(collection(db, "chatThreads"), newThreadData);
        console.log("Chat thread created with ID:", docRef.id);
        
        toast({ title: "Chat Started!", description: `You can now chat with ${newThreadData.participantsInfo[teacherId].name || 'the teacher'}.`});
        router.push(`/chat/${docRef.id}`);
        
    } catch (error: any) {
        console.error("Chat creation error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Full error object:", error);
        
        let errorMessage = "Could not initiate chat.";
        
        if (error.code === 'permission-denied') {
            errorMessage = "Permission denied. Please check if you're logged in and try again.";
        } else if (error.message) {
            errorMessage = `Could not initiate chat: ${error.message}`;
        }
        
        toast({ title: "Chat Error", description: errorMessage, variant: "destructive"});
    }
  }

  if (isLoading || authIsLoadingFromContext && !session) { 
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!session && !isLoading) { 
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Not Found</AlertTitle>
            <AlertDescription>
            The session details could not be loaded or the session does not exist.
            </AlertDescription>
        </Alert>
         <Button onClick={() => router.push('/')} variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Discover
        </Button>
      </div>
    );
  }

  if (!session) { 
      return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /><p className="ml-2">Loading session data...</p></div>;
  }

  let sessionDate: Date;
  if (session.dateTime instanceof Timestamp) {
    sessionDate = session.dateTime.toDate();
  } else if (typeof session.dateTime === 'string' || session.dateTime instanceof Date) {
    sessionDate = new Date(session.dateTime);
  } else {
    sessionDate = new Date();
  }
  const displayDate = !isNaN(sessionDate.getTime()) ? sessionDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Date TBD";
  const displayTime = !isNaN(sessionDate.getTime()) ? sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Time TBD";

  return (
    <div className="container mx-auto py-8 px-4">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden shadow-xl">
            <CardHeader className="p-0">
              <NextImage
                src={session.coverImageUrl || `https://placehold.co/1200x600.png?text=${encodeURIComponent(session.title || 'Session')}`}
                alt={session.title || "Session image"}
                width={1200} height={600} className="w-full h-64 md:h-96 object-cover"
                data-ai-hint={session.dataAiHint || "education detail"} priority
              />
            </CardHeader>
            <CardContent className="p-6">
              <Badge variant="secondary" className="mb-2">{session.category || "Uncategorized"}</Badge>
              <CardTitle className="text-3xl font-bold mb-4 text-primary">{session.title || "Untitled Session"}</CardTitle>
              <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">{session.description || "No description."}</p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center"><CalendarDays className="w-5 h-5 mr-3 text-accent" /> <span>{displayDate}</span></div>
                <div className="flex items-center"><Clock className="w-5 h-5 mr-3 text-accent" /> <span>{displayTime}</span></div>
                <div className="flex items-center"><MapPin className="w-5 h-5 mr-3 text-accent" /> <span>{session.location || "Location TBD"}</span></div>
                <div className="flex items-center"><span className="w-5 h-5 mr-3 text-accent font-bold">₹</span> <span className="font-semibold text-foreground">{session.price === 0 ? "Free" : `₹${session.price.toFixed(2)}`}</span></div>
                {session.maxParticipants != null && <div className="flex items-center"><Users className="w-5 h-5 mr-3 text-accent" /> <span>{session.maxParticipants} max ({confirmedAttendees.length} confirmed)</span></div>}
                <div className="flex items-center"><Layers className="w-5 h-5 mr-3 text-accent" /> <span>Category: {session.category || "N/A"}</span></div>
              </div>
            </CardContent>
             <CardFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              {!isAuthenticated ? (
                <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push(`/auth?redirect=/sessions/${id}`)}>
                  Log in to view more details
                </Button>
              ) : (
                (!user || user.id !== session.teacherId) && (
                  <>
                    <Button size="lg" onClick={handleBookingRequest} className="w-full sm:w-auto"
                      disabled={isBookingLoading || isSessionFull || (!!existingBookingStatus && existingBookingStatus !== 'rejected' && existingBookingStatus !== 'cancelled_by_learner' && existingBookingStatus !== 'cancelled_by_teacher')}>
                      {isBookingLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                      {isSessionFull ? "Session Full" : (existingBookingStatus && existingBookingStatus !== 'rejected' && existingBookingStatus !== 'cancelled_by_learner' && existingBookingStatus !== 'cancelled_by_teacher' ? `Request ${existingBookingStatus}` : 'Request to Book')}
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleChatRequest} className="w-full sm:w-auto" disabled={!teacher || !teacher.id || teacher.id === "unknown_teacher" || session.teacherId === "unknown_teacher"}> 
                      <MessageSquare className="mr-2 h-5 w-5" /> Chat with Teacher
                    </Button>
                  </>
                )
              )}
              {user?.id === session.teacherId && (
                 <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                    <Link href={`/teaching/edit-session/${session.id}`}>Edit Your Session</Link>
                 </Button>
              )}
            </CardFooter>
          </Card>

          {user?.id === session.teacherId && confirmedAttendees.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="flex items-center"><ListChecks className="mr-2 text-primary h-6 w-6"/>Confirmed Attendees ({confirmedAttendees.length})</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {confirmedAttendees.map(attendee => (
                    <li key={attendee.id} className="flex items-center gap-3 p-2 border rounded-md bg-background hover:bg-muted/50">
                      <Avatar className="h-10 w-10"><AvatarFallback>{(attendee.learnerName || "L")?.[0].toUpperCase()}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium text-foreground">{attendee.learnerName || "Unknown Learner"}</p>
                        <p className="text-xs text-muted-foreground">Requested: {attendee.requestedAt ? new Date(attendee.requestedAt as any).toLocaleDateString() : "N/A"}</p>
                        <p className="text-xs text-muted-foreground">Confirmed: {attendee.updatedAt ? new Date(attendee.updatedAt as any).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {user?.id === session.teacherId && confirmedAttendees.length === 0 && session?.status !== "pending" && (
             <Card className="shadow-lg"><CardHeader><CardTitle className="flex items-center"><ListChecks className="mr-2 text-primary h-6 w-6"/>Confirmed Attendees (0)</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">No confirmed attendees yet.</p></CardContent></Card>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
           {!isAuthenticated ? (
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 p-4 bg-secondary/20">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">Log in to view teacher details</CardTitle>
                  <CardDescription className="text-sm">Sign in to see more about the teacher and session.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Button onClick={() => router.push(`/auth?redirect=/sessions/${id}`)} className="w-full">Log in</Button>
              </CardContent>
            </Card>
          ) : (
            teacher && teacher.id !== "unknown_teacher" ? (
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center gap-4 p-4 bg-secondary/20">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={teacher.profilePictureUrl || undefined} alt={teacher.name || "Teacher"} data-ai-hint="person teacher" />
                    <AvatarFallback>{(teacher.name || session.teacherName || "T")?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div><CardTitle className="text-xl">{teacher.name || session.teacherName || "Teacher N/A"}</CardTitle><CardDescription className="text-sm">Teacher</CardDescription></div>
                </CardHeader>
                <CardContent className="p-4"><p className="text-sm text-muted-foreground mb-3">{teacher.bio || "No bio available."}</p>
                  {teacher.skills && teacher.skills.length > 0 && (<>
                      <h4 className="font-semibold text-sm mb-1">Skills:</h4>
                      <div className="flex flex-wrap gap-1">{teacher.skills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}</div></>)}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg"><CardHeader className="flex flex-row items-center gap-4 p-4 bg-secondary/20">
                        <Avatar className="h-16 w-16 border-2 border-primary"><AvatarFallback>{(session.teacherName || "T")?.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div><CardTitle className="text-xl">{session.teacherName || "Teacher N/A"}</CardTitle><CardDescription className="text-sm">Teacher</CardDescription></div></CardHeader>
                    <CardContent className="p-4"><p className="text-sm text-muted-foreground mb-3">Teacher profile not loaded.</p></CardContent></Card>
            )
          )}
           <Card className="shadow-lg">
            <CardHeader><CardTitle>Location Details</CardTitle></CardHeader>
            <CardContent>
               {session.coordinates ? (
                <SessionMap sessions={[session]} />
               ) : (
                 <NextImage src={`https://placehold.co/600x300.png?text=${encodeURIComponent(session.location || "Map")}`}
                  alt={`Map placeholder for ${session.location || "session location"}`} width={600} height={300}
                  className="w-full h-48 object-cover rounded-md mb-2" data-ai-hint="map location" />
               )}
              <p className="text-sm text-muted-foreground mt-2">{session.location || "Location TBD."}</p>
            </CardContent>
          </Card>
          {isSessionFull && (!user || user.id !== session.teacherId) && ( 
            <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Info className="h-5 w-5 text-primary" /><AlertTitle className="font-semibold text-primary">Session Full</AlertTitle>
                <AlertDescription className="text-primary/80">Max participants reached.</AlertDescription></Alert>
          )}
        </div>
      </div>
    </div>
  );
}
