import type { Session } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarDays, Tag, DollarSign, Users, UserCircle } from "lucide-react";
import { useAuth } from '@/components/AppLayoutClient';

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const { isAuthenticated } = useAuth();
  const displayTitle = session.title || "Untitled Session";
  const displayCategory = session.category || "Uncategorized";
  const displayTeacherName = isAuthenticated ? (session.teacherName || "Unknown Teacher") : "Login for more info";
  const displayLocation = session.location || "Unknown Location";
  const displayDescription = session.description || "No description available.";
  const displayPrice = typeof session.price === 'number' ? session.price : 0;
  
  let displayDateTime = "Date/Time not set";
  try {
    if (session.dateTime) {
      let dateObj: Date;
      if (typeof session.dateTime === "string" || session.dateTime instanceof Date) {
        dateObj = new Date(session.dateTime);
      } else if (typeof session.dateTime === "object" && session.dateTime !== null && "toDate" in session.dateTime) {
        dateObj = session.dateTime.toDate();
      } else {
        dateObj = new Date();
      }
      if (!isNaN(dateObj.getTime())) { // Check if date is valid
        displayDateTime = `${dateObj.toLocaleDateString()} - ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
  } catch (e) {
    console.error("Error parsing session dateTime for card:", session.dateTime, e);
  }


  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0 relative">
        <Link href={`/sessions/${session.id}`} passHref>
          <Image
            src={session.coverImageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(displayTitle)}`}
            alt={displayTitle}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
            data-ai-hint={session.dataAiHint || "education learning"}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Badge variant="secondary" className="mb-2">{displayCategory}</Badge>
        <Link href={`/sessions/${session.id}`} passHref>
          <CardTitle className="text-lg font-semibold mb-2 hover:text-primary transition-colors">{displayTitle}</CardTitle>
        </Link>
        <div className="text-sm text-muted-foreground space-y-1 mb-3">
          <div className="flex items-center">
            <UserCircle className="w-4 h-4 mr-2 text-accent" />
            <span>{displayTeacherName}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-accent" />
            <span>{displayLocation}</span>
          </div>
          <div className="flex items-center">
            <CalendarDays className="w-4 h-4 mr-2 text-accent" />
            <span>{displayDateTime}</span>
          </div>
        </div>
        <p className="text-sm text-foreground line-clamp-3">{displayDescription}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t">
        <div className="flex items-center font-semibold text-primary text-lg gap-1">
          <span className="font-bold">₹</span>
          <span>{displayPrice === 0 ? "Free" : displayPrice.toFixed(2)}</span>
        </div>
        <Link href={`/sessions/${session.id}`} passHref legacyBehavior>
          <Button size="sm" variant="outline">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
