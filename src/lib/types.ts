
import type { Timestamp } from 'firebase/firestore';

export type UserRole = "learner" | "teacher";

export interface UserProfile {
  id: string; 
  email: string;
  phoneNumber?: string;
  name: string;
  role: UserRole;
  skills?: string[];
  availability?: string;
  preferences?: string;
  profilePictureUrl?: string; 
  bio?: string;
  experience?: string; 
  idVerificationUrl?: string; 
  location?: { 
    address: string; 
    lat?: number; 
    lng?: number; 
  };
  createdAt: Timestamp; 
  updatedAt?: Timestamp;
}

export interface Session {
  id: string; 
  title: string;
  description: string;
  category: string;
  teacherId: string; 
  teacherName: string; 
  teacherProfilePictureUrl?: string; 
  location: string; 
  coordinates?: { lat: number; lng: number }; 
  dateTime: Timestamp | Date | string; // Allow string for form input, Date for state, Timestamp for DB
  price: number;
  maxParticipants?: number;
  status: "pending" | "confirmed" | "cancelled" | "completed"; 
  coverImageUrl?: string; 
  dataAiHint?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface ChatMessage {
  id: string; 
  chatId: string;
  senderId: string; 
  receiverId: string; 
  text: string;
  timestamp: Timestamp; 
  isRead?: boolean;
}

export interface ChatThread {
  id: string; 
  participantIds: string[]; 
  participantsInfo: {
    [userId: string]: { 
      name: string;
      avatarUrl?: string;
    }
  };
  lastMessageText?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageSenderId?: string;
  unreadCount?: { [userId: string]: number }; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface BookingRequest {
  id: string; 
  sessionId: string;
  sessionTitle?: string; 
  sessionDateTime?: Timestamp; 
  sessionLocation?: string; 
  sessionCoverImageUrl?: string; 
  learnerId: string; 
  learnerName?: string; 
  teacherId: string; 
  teacherName?: string; 
  requestedAt: Timestamp; 
  status: "pending" | "confirmed" | "rejected" | "cancelled_by_learner" | "cancelled_by_teacher" | "completed";
  updatedAt?: Timestamp;
}


export const CATEGORIES = ["Arts & Crafts", "Music", "Cooking", "Technology", "Sports", "Languages", "Wellness", "Business", "Lifestyle", "Academics", "Other"];

// --- Firestore Document Interfaces (for writing/updating) ---

export interface UserDocument extends Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp; 
  updatedAt?: Timestamp; 
}

export interface SessionDocument extends Omit<Session, 'id' | 'dateTime' | 'createdAt' | 'updatedAt' | 'coordinates'> {
  dateTime: Timestamp; 
  coordinates?: { lat: number; lng: number }; // Stored as an object in Firestore
  createdAt: Timestamp; 
  updatedAt?: Timestamp; 
}

export interface BookingRequestDocument extends Omit<BookingRequest, 'id' | 'requestedAt' | 'updatedAt' | 'sessionDateTime'> {
  requestedAt: Timestamp; 
  updatedAt?: Timestamp; 
  sessionDateTime?: Timestamp; 
}

export interface ChatThreadDocument extends Omit<ChatThread, 'id' | 'createdAt' | 'updatedAt'> {
    createdAt: Timestamp; 
    updatedAt: Timestamp; 
}

export interface ChatMessageDocument extends Omit<ChatMessage, 'id' | 'timestamp'> {
    timestamp: Timestamp; 
}
