"use client";

import { Marker, Popup } from 'react-leaflet';
import BaseMap from './BaseMap';
import { Session } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

interface SessionMapProps {
  sessions: Session[];
  className?: string;
  onSessionClick?: (session: Session) => void;
}

export default function SessionMap({
  sessions,
  className,
  onSessionClick
}: SessionMapProps) {
  // Calculate the center based on the average of all session locations
  const center = sessions.length > 0
    ? [
        sessions.reduce((sum, session) => sum + (session.coordinates?.lat || 51.505), 0) / sessions.length,
        sessions.reduce((sum, session) => sum + (session.coordinates?.lng || -0.09), 0) / sessions.length,
      ] as [number, number]
    : [51.505, -0.09] as [number, number]; // Default to London

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

  return (
    <BaseMap center={center} zoom={12} className={className}>
      {sessions.map((session) => (
        session.coordinates && (
          <Marker
            key={session.id}
            position={[session.coordinates.lat, session.coordinates.lng]}
            eventHandlers={{
              click: () => onSessionClick?.(session)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{session.title}</h3>
                <p className="text-sm text-gray-600">{session.description}</p>
                <p className="text-sm mt-1">
                  {formatDateTime(session.dateTime).date} at{' '}
                  {formatDateTime(session.dateTime).time}
                </p>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </BaseMap>
  );
}
