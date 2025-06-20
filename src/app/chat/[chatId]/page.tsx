"use client";

import { useAuth } from '@/components/AppLayoutClient';
import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card'; // Only CardHeader is used directly
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, MessageSquare, Send, ShieldAlert, AlertCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import type { ChatMessage, ChatMessageDocument, ChatThread, ChatThreadDocument, UserProfile } from '@/lib/types';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  updateDoc, 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function ChatPage() {
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;
  const { toast } = useToast();

  const [chatThread, setChatThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    console.log(`ChatPage: useEffect triggered. ChatId: ${chatId}, User: ${user?.id}, IsAuthenticated: ${isAuthenticated}, AuthLoading: ${authIsLoading}`);
    if (authIsLoading) {
        console.log("ChatPage: Auth is loading, returning early from useEffect.");
        setIsLoadingPage(true); // Ensure loading is true if auth is still loading
        return;
    }

    if (!isAuthenticated || !user) {
      console.log("ChatPage: User not authenticated, redirecting to auth.");
      // Check if already on auth page to prevent loop, though router.push should handle it
      if (router && typeof router.push === 'function' && !window.location.pathname.startsWith('/auth')) {
        router.push(`/auth?redirect=/chat/${chatId}`);
      }
      return;
    }

    if (!chatId || chatId === "undefined" || chatId === "null") { // More robust check for invalid chatId
        console.warn(`ChatPage: Invalid or no chatId provided ('${chatId}'). Cannot load chat.`);
        setIsLoadingPage(false);
        setChatThread(null); // Ensure chatThread is reset
        return;
    }

    if (!db) {
      toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
      setIsLoadingPage(false);
      return;
    }

    setIsLoadingPage(true);
    console.log(`ChatPage: Attempting to load chat thread for chatId: ${chatId}`);
    
    const threadDocRef = doc(db, "chatThreads", chatId);
    const threadUnsubscribe = onSnapshot(threadDocRef, async (docSnap) => {
      console.log(`ChatPage: onSnapshot for thread ${chatId} received update. Exists: ${docSnap.exists()}`);
      if (docSnap.exists()) {
        const threadData = docSnap.data() as ChatThreadDocument;
        console.log(`ChatPage: Raw thread data for ${chatId}:`, threadData);
        
        const participantsInfo: ChatThread['participantsInfo'] = threadData.participantsInfo || {}; 
        
        // Ensure all participant info is loaded, especially if it was missing initially
        if (threadData.participantIds) {
            for (const participantId of threadData.participantIds) {
                if (!participantsInfo[participantId]?.name) { 
                    console.log(`ChatPage: Participant info for ${participantId} in thread ${chatId} is incomplete or missing, fetching...`);
                    if (!db) {
                        console.warn("ChatPage: Firestore db is null, cannot fetch participant info.");
                        continue;
                    }
                    const userDocRef = doc(db, "users", participantId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as UserProfile;
                        participantsInfo[participantId] = {
                            name: userData.name || "User",
                            avatarUrl: userData.profilePictureUrl || "",
                        };
                        console.log(`ChatPage: Fetched info for ${participantId}:`, participantsInfo[participantId]);
                    } else {
                         console.warn(`ChatPage: User document for participant ${participantId} in thread ${chatId} not found.`);
                         participantsInfo[participantId] = { name: `User (${participantId.substring(0,5)})`, avatarUrl: "" };
                    }
                }
            }
        }
        
        const loadedChatThread = {
          id: docSnap.id,
          ...threadData,
          participantsInfo: participantsInfo,
          lastMessageTimestamp: threadData.lastMessageTimestamp instanceof Timestamp ? threadData.lastMessageTimestamp : undefined, // Handle potential undefined
          createdAt: threadData.createdAt as Timestamp,
          updatedAt: threadData.updatedAt as Timestamp,
        } as ChatThread;

        console.log("ChatPage: Setting chatThread state:", loadedChatThread);
        setChatThread(loadedChatThread);

      } else {
        console.warn(`ChatPage: Chat thread with ID ${chatId} not found.`);
        toast({ title: "Chat not found", description: "This chat session does not exist or you may not have access.", variant: "destructive" });
        setChatThread(null); 
        if (router && typeof router.push === 'function') router.push('/chat'); 
      }
      setIsLoadingPage(false); // Set loading false after thread processing
    }, (error) => {
        console.error(`ChatPage: Error fetching chat thread ${chatId}:`, error);
        toast({ title: "Error loading chat", description: error.message, variant: "destructive"});
        setIsLoadingPage(false);
    });

    if (!db) {
      toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
      setIsLoadingPage(false);
      return;
    }
    const messagesQuery = query(collection(db, "chatThreads", chatId, "messages"), orderBy("timestamp", "asc"));
    console.log(`ChatPage: Subscribing to messages for chat thread ${chatId}`);
    const messagesUnsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      console.log(`ChatPage: onSnapshot for messages in ${chatId} received. Count: ${querySnapshot.size}`);
      const fetchedMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({ 
            id: doc.id, 
            ...data,
            timestamp: data.timestamp as Timestamp 
        } as ChatMessage);
      });
      setMessages(fetchedMessages);
      console.log(`ChatPage: Updated messages state for ${chatId}. Count: ${fetchedMessages.length}`);
    }, (error) => {
        console.error(`ChatPage: Error fetching messages for ${chatId}:`, error);
        toast({ title: "Error loading messages", description: error.message, variant: "destructive"});
        // Consider not setting isLoadingPage to false here if thread is still loading
    });
    
    return () => {
      console.log(`ChatPage: Unsubscribing from Firestore listeners for chatId: ${chatId}`);
      threadUnsubscribe();
      messagesUnsubscribe();
    };
  }, [chatId, user, isAuthenticated, authIsLoading, router, toast]); 
  
  if (authIsLoading || isLoadingPage) {
    console.log(`ChatPage: Rendering loading state. AuthLoading: ${authIsLoading}, PageLoading: ${isLoadingPage}`);
    return <div className="flex justify-center items-center h-[calc(100vh-var(--header-height,10rem))] md:h-[calc(100vh-var(--header-height,6rem))]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || !user) { 
    console.log("ChatPage: Fallback - User not authenticated. This should ideally be caught by useEffect.");
    // Already handled by useEffect, but as a safeguard:
    return <div className="flex justify-center items-center h-screen"><ShieldAlert className="w-16 h-16 text-destructive" /></div>;
  }

  if (!chatThread && !isLoadingPage) { // Show "Not Found" only if not loading and thread is null
    console.log(`ChatPage: Chat thread for ${chatId} is null AND not loading, rendering Chat Not Found state.`);
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,10rem))] md:h-[calc(100vh-var(--header-height,6rem))] text-center p-4">
        <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Chat Not Found</AlertTitle>
            <AlertDescription>
            This chat session does not exist or you may not have access to it.
            </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/chat')} variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Chats</Button>
      </div>
    );
  }
  
  // Handle case where chatThread might still be null but page is not "loading" due to logic flow
  if (!chatThread) {
    console.log("ChatPage: chatThread is still null after loading checks, rendering fallback loader.");
    return <div className="flex justify-center items-center h-[calc(100vh-var(--header-height,10rem))] md:h-[calc(100vh-var(--header-height,6rem))]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-2">Loading chat data...</p></div>;
  }


  const otherParticipantId = chatThread.participantIds.find(id => id !== user.id);
  const otherParticipant = otherParticipantId && chatThread.participantsInfo && chatThread.participantsInfo[otherParticipantId] 
    ? chatThread.participantsInfo[otherParticipantId] 
    : { name: "User", avatarUrl: undefined }; // Fallback

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("ChatPage: handleSendMessage called.");
    if (newMessage.trim() === "" || !user || !otherParticipantId) {
        console.warn("ChatPage: Cannot send message - empty, no user, or no other participant. Message:", newMessage, "User:", user, "OtherPID:", otherParticipantId);
        return;
    }

    setIsSending(true);
    if (!db) {
      toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
      setIsSending(false);
      return;
    }
    const messageData: ChatMessageDocument = {
      chatId: chatThread.id,
      senderId: user.id,
      receiverId: otherParticipantId, 
      text: newMessage.trim(),
      timestamp: serverTimestamp() as any // serverTimestamp is a FieldValue, but we cast for Firestore
    };
    console.log("ChatPage: Prepared messageData for sending:", messageData);

    try {
      if (!db) {
        toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
        setIsSending(false);
        return;
      }
      const messagesCollectionRef = collection(db, "chatThreads", chatThread.id, "messages");
      await addDoc(messagesCollectionRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });
      console.log("ChatPage: Message added to subcollection successfully.");

      if (!db) {
        toast({ title: "Database Error", description: "Firestore is not initialized.", variant: "destructive" });
        setIsSending(false);
        return;
      }
      const threadDocRef = doc(db, "chatThreads", chatThread.id);
      await updateDoc(threadDocRef, {
        lastMessageText: newMessage.trim(),
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: user.id,
        updatedAt: serverTimestamp(),
      });
      console.log("ChatPage: Chat thread document updated with last message info.");
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Send Error", description: "Could not send message.", variant: "destructive"});
    } finally {
      setIsSending(false);
      console.log("ChatPage: Message sending process finished.");
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-muted/30">
      <div className="sticky top-0 z-20 bg-card/95 border-b border-border/40 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 p-4">
          <Button onClick={() => router.push('/chat')} variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10 border border-border/40">
            <AvatarImage src={otherParticipant?.avatarUrl} data-ai-hint="person avatar"/>
            <AvatarFallback>{otherParticipant?.name?.substring(0,2).toUpperCase() || "??"}</AvatarFallback>
          </Avatar>
          <div className="text-lg font-semibold truncate">{otherParticipant?.name || "Chat"}</div>
        </CardHeader>
      </div>

      <ScrollArea className="flex-1 px-2 py-4 md:px-8 md:py-6 space-y-4 bg-muted/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-2 max-w-[75%]",
              msg.senderId === user.id ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {msg.senderId !== user.id && chatThread.participantsInfo && chatThread.participantsInfo[msg.senderId] && (
              <Avatar className="h-8 w-8 border border-border/40">
                <AvatarImage src={chatThread.participantsInfo[msg.senderId]?.avatarUrl} data-ai-hint="person avatar"/>
                <AvatarFallback>{chatThread.participantsInfo[msg.senderId]?.name.substring(0,2).toUpperCase() || "??"}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "p-3 rounded-2xl shadow-sm",
                msg.senderId === user.id
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card text-card-foreground border border-border/30 rounded-bl-md"
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words max-w-xs md:max-w-md">{msg.text}</p>
              <p className="text-xs mt-1 opacity-70 text-right">
                {msg.timestamp instanceof Timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="p-4 border-t bg-card/95 sticky bottom-0 z-20 shadow-inner">
        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            autoComplete="off"
            disabled={isSending || !chatThread}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending || !chatThread} className="transition-colors">
            {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

