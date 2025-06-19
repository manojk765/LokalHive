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
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Chats</h1>
        <p className="text-muted-foreground">Connect with teachers and learners.</p>
      </header>

      {chatThreads.length > 0 ? (
        <div className="space-y-4">
          {chatThreads.map(thread => {
            const otherParticipantId = thread.participantIds.find(id => id !== user?.id);
            const otherParticipant = otherParticipantId && thread.participantsInfo ? thread.participantsInfo[otherParticipantId] : { name: "User", avatarUrl: "" }; // Added null check for thread.participantsInfo
            const lastMsgTimestamp = thread.lastMessageTimestamp instanceof Timestamp ? thread.lastMessageTimestamp.toDate() : null;
            
            return (
              <Link key={thread.id} href={`/chat/${thread.id}`} passHref>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherParticipant?.avatarUrl || undefined} alt={otherParticipant?.name || "User"} data-ai-hint="person avatar"/>
                      <AvatarFallback>{otherParticipant?.name?.substring(0,2).toUpperCase() || '??'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{otherParticipant?.name || "Chat User"}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {thread.lastMessageSenderId === user?.id ? "You: " : ""}
                        {thread.lastMessageText || "No messages yet."}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {lastMsgTimestamp && lastMsgTimestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      <br/>
                      {lastMsgTimestamp && lastMsgTimestamp.toLocaleDateString([], {month:'short', day:'numeric'})}
                      {/* Placeholder for unread count */}
                      {/* {thread.unreadCount && thread.unreadCount[user?.id || ''] > 0 && (
                        <span className="ml-2 mt-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                          {thread.unreadCount[user?.id || '']}
                        </span>
                      )} */}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
             <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You have no active chats yet.</p>
            <p className="text-sm text-muted-foreground">Start a conversation by contacting a teacher about a session.</p>
            <Button variant="link" asChild className="mt-2"><Link href="/">Discover Sessions</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
