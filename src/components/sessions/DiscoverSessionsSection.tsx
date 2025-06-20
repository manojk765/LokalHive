"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image'; 
import { SessionCard } from "@/components/sessions/SessionCard";
import { FilterControls, type Filters } from "@/components/sessions/FilterControls";
import type { Session } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, Frown, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp, limit, startAfter, QueryConstraint, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import SessionMap from '../maps/SessionMap';

const ITEMS_PER_PAGE = 6;

// Center of India for zoomed-out view
const INDIA_CENTER: [number, number] = [22.5937, 78.9629];

// Sample session locations (cooking session in Proddatur, Andhra Pradesh)
const SAMPLE_SESSIONS: Session[] = [
  {
    id: 'sample1',
    title: 'Traditional Kerala Cooking Class',
    description: 'Learn authentic Kerala cuisine from local experts',
    category: 'Cooking',
    teacherId: 'teacher1',
    teacherName: 'Priya Kumar',
    location: 'Proddatur, Andhra Pradesh',
    coordinates: { lat: 14.7502, lng: 78.5481 }, // Proddatur
    dateTime: new Date('2024-03-25T10:00:00'),
    price: 1500,
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sample2',
    title: 'Malayalam Language Workshop',
    description: 'Basic Malayalam speaking and writing for beginners',
    category: 'Language',
    teacherId: 'teacher2',
    teacherName: 'Arun Menon',
    location: 'Ernakulam',
    coordinates: { lat: 9.9816, lng: 76.2999 }, // Ernakulam
    dateTime: new Date('2024-03-26T14:00:00'),
    price: 1000,
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sample3',
    title: 'Classical Dance Introduction',
    description: 'Introduction to Kathakali and Mohiniyattam',
    category: 'Arts',
    teacherId: 'teacher3',
    teacherName: 'Lakshmi Nair',
    location: 'Mattancherry',
    coordinates: { lat: 9.9568, lng: 76.2599 }, // Mattancherry
    dateTime: new Date('2024-03-27T16:00:00'),
    price: 2000,
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

interface FilterOptions {
  category: string;
  priceRange: [number, number]; // 0 to 1000
  date: Date | null;
  searchTerm?: string;
}

const formatDateTime = (dateTime: string | Date | Timestamp) => {
  let date: Date;
  if (dateTime instanceof Date) {
    date = dateTime;
  } else if (dateTime instanceof Timestamp) {
    date = dateTime.toDate();
  } else {
    date = new Date(dateTime);
  }
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString()
  };
};

export function DiscoverSessionsSection() {
  const [allFetchedSessions, setAllFetchedSessions] = useState<Session[]>(SAMPLE_SESSIONS); 
  const [displayedSessions, setDisplayedSessions] = useState<Session[]>(SAMPLE_SESSIONS); 
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<Partial<FilterOptions>>({});
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const fetchSessions = useCallback(async (filters: Partial<FilterOptions>, loadMore = false) => {
    if (!loadMore) {
      console.log("fetchSessions: New filter or initial load. Filters:", JSON.stringify(filters));
      setIsLoading(true);
      setAllFetchedSessions([]);
      setDisplayedSessions([]);
      setLastVisibleDoc(null);
      setHasMore(true);
    } else {
      console.log("fetchSessions: Loading more. Current lastVisibleDoc ID:", lastVisibleDoc?.id);
      setIsLoadingMore(true);
    }

    try {
      if (!db) {
        toast({ title: "Firestore Error", description: "Database not initialized.", variant: "destructive" });
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }
      const constraints: QueryConstraint[] = [];
      constraints.push(where("status", "==", "confirmed")); 

      if (filters.category) {
        constraints.push(where("category", "==", filters.category));
      }
      if (filters.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);
        constraints.push(where("dateTime", ">=", Timestamp.fromDate(startOfDay)));
        constraints.push(where("dateTime", "<=", Timestamp.fromDate(endOfDay)));
      }
       if (filters.priceRange) {
        constraints.push(where("price", ">=", filters.priceRange[0]));
        constraints.push(where("price", "<=", filters.priceRange[1]));
      }
      
      constraints.push(orderBy("dateTime", "asc"));


      if (loadMore && lastVisibleDoc) {
        constraints.push(startAfter(lastVisibleDoc));
      }
      constraints.push(limit(ITEMS_PER_PAGE));
      
      console.log("fetchSessions: Firestore query constraints:", JSON.stringify(constraints.map(c => ({type: (c as any)._type, field: (c as any)._fieldPath?.toString(), op: (c as any)._op, value: (c as any)._value }))));
      const q = query(collection(db, "sessions"), ...constraints);
      const querySnapshot = await getDocs(q);
      console.log("fetchSessions: Firestore query executed. Documents fetched:", querySnapshot.size);
      
      let newSessions = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || "Untitled Session",
          description: data.description || "No description available.",
          category: data.category || "Uncategorized",
          teacherId: data.teacherId || "unknown_teacher_id",
          teacherName: data.teacherName || "Unknown Teacher",
          teacherProfilePictureUrl: data.teacherProfilePictureUrl,
          location: data.location || "Unknown Location",
          coordinates: data.coordinates,
          dateTime: (data.dateTime as Timestamp)?.toDate()?.toISOString() || new Date().toISOString(),
          price: typeof data.price === 'number' ? data.price : 0,
          maxParticipants: data.maxParticipants,
          status: data.status || "pending",
          coverImageUrl: data.coverImageUrl,
          dataAiHint: data.dataAiHint,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        } as Session;
      });

      if (filters.searchTerm) {
        console.log("fetchSessions: Applying client-side search for term:", filters.searchTerm);
        newSessions = newSessions.filter(s => 
          s.title.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
          s.description.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
          (s.teacherName && s.teacherName.toLowerCase().includes(filters.searchTerm!.toLowerCase())) ||
          s.location.toLowerCase().includes(filters.searchTerm!.toLowerCase())
        );
        console.log("fetchSessions: Sessions after client-side search:", newSessions.length);
      }

      setHasMore(newSessions.length === ITEMS_PER_PAGE && querySnapshot.docs.length === ITEMS_PER_PAGE);
      if (querySnapshot.docs.length > 0) {
        setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else if (loadMore) {
        setHasMore(false); // No more documents if query returned empty on "load more"
      }


      if (loadMore) {
        setDisplayedSessions(prev => [...prev, ...newSessions]);
        // setAllFetchedSessions(prev => [...prev, ...newSessions]); // Might not be needed if not filtering allFetchedSessions client-side
      } else {
        setDisplayedSessions(newSessions);
        // setAllFetchedSessions(newSessions);
      }
      console.log("fetchSessions: Displayed sessions count:", loadMore ? displayedSessions.length + newSessions.length : newSessions.length, "Has more:", hasMore);

    } catch (error: any) {
      console.error("Error fetching sessions from Firestore:", error.code, error.message, error);
      toast({ title: "Error Fetching Sessions", description: `Could not fetch sessions: ${error.message}. Check console for details, Firestore rules, and ensure Firestore is enabled in your Firebase project.`, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [toast, displayedSessions.length, hasMore, lastVisibleDoc]); // Added dependencies


  useEffect(() => {
    // Initial fetch
    console.log("DiscoverSessionsSection: Initial useEffect trigger for fetchSessions.");
    fetchSessions(currentFilters, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters]); // fetchSessions is memoized, currentFilters triggers new fetches.

  const handleFilterChange = (filters: Partial<FilterOptions>) => {
    console.log("DiscoverSessionsSection: Filter changed by FilterControls:", JSON.stringify(filters));
    setCurrentFilters(filters);
    // Fetch will be triggered by useEffect watching currentFilters
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      console.log("DiscoverSessionsSection: Load more button clicked.");
      fetchSessions(currentFilters, true);
    } else {
      console.log("DiscoverSessionsSection: Load more called but no more items or already loading.");
    }
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
  };

  return (
    <>
      <FilterControls onFilterChange={handleFilterChange} />

      {isLoading && !isLoadingMore ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading sessions...</p>
        </div>
      ) : displayedSessions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {displayedSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outline">
                {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More Sessions"}
              </Button>
            </div>
          )}
          {!hasMore && displayedSessions.length > 0 && (
             <p className="text-center text-muted-foreground mt-8">You've explored all available sessions for these filters.</p>
          )}
        </>
      ) : (
        !isLoading && ( // Only show 'No Sessions Found' if not loading
          <Alert className="mt-8 bg-card border-border">
            <Frown className="h-5 w-5 text-destructive" />
            <AlertTitle className="font-semibold text-foreground">No Sessions Found</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Try adjusting your filters or check back later for new sessions.
            </AlertDescription>
          </Alert>
        )
      )}
      
      <section className="my-16 p-6 md:p-10 bg-card rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-center text-primary mb-6">Find Sessions Near You</h2>
        <div className="mb-8 rounded-lg overflow-hidden">
          <SessionMap sessions={displayedSessions} className="h-[500px] w-full" onSessionClick={handleSessionClick} />
        </div>
      </section>
    </>
  );
}
