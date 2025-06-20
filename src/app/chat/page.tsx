"use client";

import { useAuth } from '@/components/AppLayoutClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ChatThread, UserProfile } from '@/lib/types';
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ChatListPage() {
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);

  const fetchChatThreads = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    if (!db) {
      toast({ title: "Firestore Error", description: "Database not initialized.", variant: "destructive" });
      setIsLoadingThreads(false);
      return;
    }
    setIsLoadingThreads(true);
    try {
      const threadsQuery = query(
        collection(db, "chatThreads"),
        where("participantIds", "array-contains", user.id),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(threadsQuery);
      
      const threadsPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const threadData = docSnapshot.data();
        const participantsInfo: ChatThread['participantsInfo'] = {};

        // Fetch full participant profiles if not already in threadData.participantsInfo
        if (threadData.participantIds) { // Ensure participantIds exists
            for (const participantId of threadData.participantIds) {
                if (threadData.participantsInfo && threadData.participantsInfo[participantId]?.name) { // Check if name exists
                     participantsInfo[participantId] = threadData.participantsInfo[participantId];
                } else {
                    if (!db) continue; // Extra guard for type safety
                    const userDocRef = doc(db, "users", participantId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as UserProfile;
                        participantsInfo[participantId] = {
                            name: userData.name || "User", // Fallback for name
                            avatarUrl: userData.profilePictureUrl || "",
                        };
                    } else {
                         participantsInfo[participantId] = { name: `User (${participantId.substring(0,5)})`, avatarUrl: "" };
                    }
                }
            }
        }


        return {
          id: docSnapshot.id,
          ...threadData,
          participantsInfo: participantsInfo, // Use the fully resolved participantsInfo
          lastMessageTimestamp: threadData.lastMessageTimestamp as Timestamp,
          createdAt: threadData.createdAt as Timestamp,
          updatedAt: threadData.updatedAt as Timestamp,
        } as ChatThread;
      });
      
      const fetchedThreads = await Promise.all(threadsPromises);
      setChatThreads(fetchedThreads);

    } catch (error: any) {
      console.error("Error fetching chat threads:", error);
      let description = "Could not fetch your chats.";
      if (error.code === 'permission-denied') {
        description = "Could not fetch chats due to a permission error. Please check Firestore security rules for 'chatThreads' collection to ensure users can list threads they are part of.";
      } else if (error.message) {
        description = `Could not fetch your chats: ${error.message}`;
      }
      toast({ title: "Error", description, variant: "destructive", duration: 7000 });
    } finally {
      setIsLoadingThreads(false);
    }
  }, [user, isAuthenticated, toast]);
  
  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      fetchChatThreads();
    } else if (!authIsLoading && !isAuthenticated) {
      router.push('/auth?redirect=/chat');
    }
  }, [authIsLoading, isAuthenticated, router, fetchChatThreads]);

  if (authIsLoading || isLoadingThreads) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your chats...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) { // Should be caught by useEffect, but as a fallback
     return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">Please log in to view your chats.</p>
        <Button onClick={() => router.push('/auth?redirect=/chat')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-start py-10">
      <div className="w-full max-w-xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Chats</h1>
          <p className="text-muted-foreground">Connect with teachers and learners.</p>
        </header>

        {chatThreads.length > 0 ? (
          <div className="space-y-2">
            {chatThreads.map((thread, idx) => {
              const otherParticipantId = thread.participantIds.find(id => id !== user?.id);
              const otherParticipant = otherParticipantId && thread.participantsInfo ? thread.participantsInfo[otherParticipantId] : { name: "User", avatarUrl: "" };
              const lastMsgTimestamp = thread.lastMessageTimestamp instanceof Timestamp ? thread.lastMessageTimestamp.toDate() : null;
              return (
                <React.Fragment key={thread.id}>
                  <Link href={`/chat/${thread.id}`} passHref legacyBehavior>
                    <a className="block">
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer border border-border/60">
                        <CardContent className="p-4 flex items-center gap-4">
                          <Avatar className="h-14 w-14 border border-border/40">
                            <AvatarImage src={otherParticipant?.avatarUrl || undefined} alt={otherParticipant?.name || "User"} data-ai-hint="person avatar"/>
                            <AvatarFallback>{otherParticipant?.name?.substring(0,2).toUpperCase() || '??'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-lg truncate">{otherParticipant?.name || "Chat User"}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {thread.lastMessageSenderId === user?.id ? "You: " : ""}
                              {thread.lastMessageText || "No messages yet."}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground text-right min-w-[60px]">
                            {lastMsgTimestamp && lastMsgTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            <br/>
                            {lastMsgTimestamp && lastMsgTimestamp.toLocaleDateString([], {month:'short', day:'numeric'})}
                            {/* Placeholder for unread count */}
                            {/* <span className="ml-2 mt-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                              2
                            </span> */}
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  </Link>
                  {idx < chatThreads.length - 1 && <div className="border-b border-border/30 mx-4" />}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <Card className="mt-16 shadow-none border border-border/40">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Active Chats</h2>
              <p className="text-muted-foreground mb-2">You have no active chats yet.</p>
              <p className="text-sm text-muted-foreground mb-4">Start a conversation by contacting a teacher about a session.</p>
              <Button variant="link" asChild className="mt-2"><Link href="/">Discover Sessions</Link></Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
