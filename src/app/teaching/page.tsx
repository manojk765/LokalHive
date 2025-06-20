"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AppLayoutClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, ShieldAlert, Edit2, Users, Eye, Trash2, Frown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Session, BookingRequest, UserProfile, SessionDocument } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, writeBatch, serverTimestamp, Timestamp, updateDoc, orderBy } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EnrichedBookingRequest extends BookingRequest {
  learnerName?: string;
  sessionTitle?: string;
}


export default function MyTeachingPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [teacherSessions, setTeacherSessions] = useState<Session[]>([]);
  const [bookingRequests, setBookingRequests] = useState<EnrichedBookingRequest[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const fetchTeacherSessions = useCallback(async () => {
    if (!user || user.role !== 'teacher') {
        console.log("fetchTeacherSessions: User not authenticated or not a teacher.");
        setIsLoadingSessions(false);
        return;
    }
    console.log("fetchTeacherSessions: Fetching sessions for teacherId:", user.id);
    setIsLoadingSessions(true);
    if (!db) {
      toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
      setIsLoadingSessions(false);
      return;
    }
    try {
      const q = query(collection(db, "sessions"), where("teacherId", "==", user.id), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      console.log(`fetchTeacherSessions: Firestore query executed for teacher ${user.id}. Documents fetched: ${querySnapshot.size}`);
      const sessions = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as Partial<SessionDocument>; // Use Partial for safety
        return { 
          id: docSnap.id, 
          title: data.title || "Untitled Session",
          description: data.description || "No description.",
          category: data.category || "Uncategorized",
          teacherId: data.teacherId || "unknown_teacher",
          teacherName: data.teacherName || user.name || "Unknown Teacher", 
          teacherProfilePictureUrl: data.teacherProfilePictureUrl || user.profilePictureUrl, 
          location: data.location || "Unknown Location",
          dateTime: data.dateTime instanceof Timestamp ? data.dateTime.toDate().toISOString() : new Date(data.dateTime as any || Date.now()).toISOString(),
          price: typeof data.price === 'number' ? data.price : 0,
          status: data.status || "pending",
          coverImageUrl: data.coverImageUrl,
          coordinates: data.coordinates,
          maxParticipants: data.maxParticipants,
          dataAiHint: data.dataAiHint,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as any || Date.now()),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt as any) : undefined),
        } as Session;
      });
      setTeacherSessions(sessions);
    } catch (error: any) {
      console.error("Error fetching teacher sessions:", error.code, error.message, error);
      toast({ title: "Error Fetching Sessions", description: `Could not fetch your sessions: ${error.message}. Check Firestore rules.`, variant: "destructive" });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user, toast]);

  const fetchBookingRequests = useCallback(async () => {
    if (!user || user.role !== 'teacher') {
        setIsLoadingRequests(false);
        return;
    }
    setIsLoadingRequests(true);
    console.log("fetchBookingRequests: Fetching requests for teacherId:", user.id);
    if (!db) {
      toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
      setIsLoadingRequests(false);
      return;
    }
    try {
      const q = query(
        collection(db, "bookingRequests"), 
        where("teacherId", "==", user.id), 
        orderBy("requestedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      console.log(`fetchBookingRequests: Firestore query executed for teacher ${user.id}. Documents fetched: ${querySnapshot.size}`);
      const requestsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const requestData = docSnapshot.data();
        const request = { 
          id: docSnapshot.id, 
          ...requestData,
          requestedAt: (requestData.requestedAt as Timestamp) || Timestamp.now(), 
          sessionDateTime: requestData.sessionDateTime ? (requestData.sessionDateTime as Timestamp) : undefined,
          updatedAt: requestData.updatedAt ? (requestData.updatedAt as Timestamp) : undefined,
        } as BookingRequest;
        
        let learnerName = requestData.learnerName || "Unknown Learner";
        if (request.learnerId && !requestData.learnerName) { 
          if (!db) {
            toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
            return learnerName;
          }
          const learnerDocRef = doc(db, "users", request.learnerId);
          const learnerDocSnap = await getDoc(learnerDocRef);
          if (learnerDocSnap.exists()) learnerName = (learnerDocSnap.data() as UserProfile).name || "Learner";
        }

        let sessionTitle = requestData.sessionTitle || "Unknown Session";
        if (request.sessionId && !requestData.sessionTitle) { 
           if (!db) {
             toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
             return sessionTitle;
           }
           const sessionDocRef = doc(db, "sessions", request.sessionId);
           const sessionDocSnap = await getDoc(sessionDocRef);
           if (sessionDocSnap.exists()) sessionTitle = (sessionDocSnap.data() as Session).title || "Session";
        }
        
        return { ...request, learnerName, sessionTitle } as EnrichedBookingRequest;
      });
      const enrichedRequests = await Promise.all(requestsPromises);
      setBookingRequests(enrichedRequests);
    } catch (error: any) {
      console.error("Error fetching booking requests:", error.code, error.message, error);
      let description = `Could not fetch booking requests: ${error.message}.`;
      if (error.code === 'permission-denied') {
        description = "Could not fetch booking requests due to a permission error. Please check Firestore security rules for the 'bookingRequests' collection to ensure teachers can list requests where they are the teacherId.";
      }
      toast({ title: "Error Fetching Bookings", description, variant: "destructive", duration: 7000 });
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user, toast]);


  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'teacher') {
      fetchTeacherSessions();
      fetchBookingRequests();
    } else if (!authLoading && (!isAuthenticated || user?.role !== 'teacher')) {
        router.push(isAuthenticated && user?.role === 'learner' ? '/bookings' : '/auth?redirect=/teaching');
    }
  }, [authLoading, isAuthenticated, user, router, fetchTeacherSessions, fetchBookingRequests]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!db) {
      toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
      return;
    }
    try {
      await deleteDoc(doc(db, "sessions", sessionId));
      toast({ title: "Session Deleted", description: "The session has been successfully deleted.", variant: "default" });
      setTeacherSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error: any) {
      console.error("Error deleting session:", error.code, error.message, error);
      toast({ title: "Error Deleting Session", description: `Could not delete the session: ${error.message}.`, variant: "destructive" });
    }
  };
  
  const handleRequestAction = async (requestId: string, newStatus: BookingRequest['status']) => {
    if (!db) {
      toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
      return;
    }
    try {
      const requestRef = doc(db, "bookingRequests", requestId);
      await updateDoc(requestRef, { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });
      toast({ title: `Request ${newStatus}`, description: `The booking request has been ${newStatus}.`, variant: 'default' });
      setBookingRequests(prev => 
        prev.map(req => req.id === requestId ? {...req, status: newStatus, updatedAt: Timestamp.now()} : req)
      );
    } catch (error: any) {
      console.error(`Error updating booking request ${requestId} to ${newStatus}:`, error.code, error.message, error);
      toast({ title: "Error Updating Booking", description: `Could not update booking request status: ${error.message}.`, variant: "destructive" });
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!isAuthenticated || user?.role !== 'teacher') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">This page is for teachers only.</p>
        <Button onClick={() => router.push('/auth?redirect=/teaching')}>Go to Login</Button>
      </div>
    );
  }
  
  const getSessionStatusBadgeVariant = (status?: Session['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getBookingStatusBadgeVariant = (status: BookingRequest['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'cancelled_by_learner': return 'destructive';
      case 'cancelled_by_teacher': return 'destructive';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };
  
  const pendingBookingRequests = bookingRequests.filter(req => req.status === 'pending');
  const historicalBookingRequests = bookingRequests.filter(req => req.status !== 'pending');


  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your sessions and booking requests.</p>
        </div>
        <Button 
          size="lg"
          onClick={() => {
            console.log("Create New Session button clicked, attempting to navigate programmatically.");
            try {
              router.push('/teaching/create-session');
              console.log("Navigation to /teaching/create-session initiated successfully.");
            } catch (error) {
              console.error("Error during router.push to /teaching/create-session:", error);
              toast({
                title: "Navigation Error",
                description: "Could not navigate to create session page. Please try again.",
                variant: "destructive"
              });
            }
          }}
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Session
        </Button>
      </header>

      {/* Booking Requests Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Pending Booking Requests ({isLoadingRequests ? <Loader2 className="inline h-5 w-5 animate-spin" /> : pendingBookingRequests.length})</h2>
        {isLoadingRequests ? (
           <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : pendingBookingRequests.length > 0 ? (
          <Card className="shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBookingRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.learnerName || 'N/A'}</TableCell>
                    <TableCell>{req.sessionTitle || 'N/A'}</TableCell>
                    <TableCell>{req.requestedAt instanceof Timestamp ? req.requestedAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleRequestAction(req.id, 'confirmed')}><CheckCircle className="mr-1 h-4 w-4"/>Confirm</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleRequestAction(req.id, 'rejected')}><XCircle className="mr-1 h-4 w-4"/>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>No Pending Requests</AlertTitle>
            <AlertDescription>You currently have no new booking requests.</AlertDescription>
          </Alert>
        )}
      </section>

      {/* My Sessions Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">My Sessions ({isLoadingSessions ? <Loader2 className="inline h-5 w-5 animate-spin" /> : teacherSessions.length})</h2>
        {isLoadingSessions ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : teacherSessions.length > 0 ? (
          <div className="space-y-6">
            {teacherSessions.map(session => (
              <Card key={session.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="md:flex">
                    {session.coverImageUrl && (
                    <div className="md:w-1/4">
                        <Image 
                        src={session.coverImageUrl} 
                        alt={session.title || "Session image"}
                        width={200}
                        height={150}
                        className="object-cover w-full h-40 md:h-full"
                        data-ai-hint={(session.category || "education").toLowerCase()}
                        />
                    </div>
                    )}
                    <div className={session.coverImageUrl ? "md:w-3/4" : "w-full"}>
                        <CardHeader className="p-4">
                            <div className="flex justify-between items-start">
                            <CardTitle className="text-xl font-semibold mb-1">{session.title || "Untitled Session"}</CardTitle>
                            <Badge variant={getSessionStatusBadgeVariant(session.status)} className="capitalize">{session.status || "Unknown"}</Badge>
                            </div>
                            <CardDescription className="text-sm text-muted-foreground">
                            {session.location || "Location TBD"} - {(() => {
                              if (session.dateTime instanceof Date) return session.dateTime.toLocaleDateString();
                              if (typeof session.dateTime === 'string') return new Date(session.dateTime).toLocaleDateString();
                              return "Date TBD";
                            })()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 text-sm">
                            <p className="line-clamp-2">{session.description || "No description."}</p>
                            <div className="mt-2 flex gap-4">
                                <span>Price: ${session.price != null ? session.price.toFixed(2) : '0.00'}</span>
                                {session.maxParticipants && <span>Max Participants: {session.maxParticipants}</span>}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 border-t bg-muted/20 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild><Link href={`/sessions/${session.id}`}><Eye className="mr-1 h-4 w-4" /> View</Link></Button>
                            <Button variant="outline" size="sm" asChild><Link href={`/teaching/edit-session/${session.id}`}><Edit2 className="mr-1 h-4 w-4" /> Edit</Link></Button>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the session "{session.title || 'this session'}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSession(session.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
              <h2 className="text-xl font-semibold mb-2">No Sessions Created Yet</h2>
              <p className="text-muted-foreground mb-4">Share your skills with the community. Create your first session now!</p>
              <Button 
                onClick={() => {
                    console.log("Create New Session button (empty state) clicked, attempting to navigate programmatically.");
                     try {
                        router.push('/teaching/create-session');
                        console.log("Navigation to /teaching/create-session (empty state) initiated successfully.");
                    } catch (error) {
                        console.error("Error during router.push from empty state button:", error);
                        toast({
                            title: "Navigation Error",
                            description: "Could not navigate to create session page. Please try again.",
                            variant: "destructive"
                        });
                    }
                  }}
              >Create New Session</Button>
            </CardContent>
          </Card>
        )}
      </section>

       {/* Historical Booking Requests Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Booking Request History ({isLoadingRequests ? <Loader2 className="inline h-5 w-5 animate-spin" /> : historicalBookingRequests.length})</h2>
        {isLoadingRequests ? (
          <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : historicalBookingRequests.length > 0 ? (
          <Card className="shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalBookingRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.learnerName || 'N/A'}</TableCell>
                    <TableCell>{req.sessionTitle || 'N/A'}</TableCell>
                    <TableCell>{req.requestedAt instanceof Timestamp ? req.requestedAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell><Badge variant={getBookingStatusBadgeVariant(req.status)} className="capitalize">{(req.status || "Unknown").replace(/_/g, ' ')}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>No Historical Requests</AlertTitle>
            <AlertDescription>You have no past booking requests.</AlertDescription>
          </Alert>
        )}
      </section>
    </div>
  );
}

    
