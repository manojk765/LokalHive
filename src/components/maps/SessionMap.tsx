"use client";

import { Marker, Popup } from 'react-leaflet';
import BaseMap from './BaseMap';
import { Session } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import MyGoogleMap from './GoogleMap';
import { MarkerF, InfoWindowF } from '@react-google-maps/api';

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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

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
    <MyGoogleMap
      center={{ lat: center[0], lng: center[1] }}
      zoom={12}
      className={className}
    >
      {sessions.map((session) => (
        session.coordinates && (
          <MarkerF
            key={session.id}
            position={{ lat: session.coordinates.lat, lng: session.coordinates.lng }}
            onClick={() => {
              setActiveSessionId(session.id);
              onSessionClick?.(session);
            }}
          >
            {activeSessionId === session.id && (
              <InfoWindowF onCloseClick={() => setActiveSessionId(null)}>
                <div className="p-2 min-w-[180px]">
                  <h3 className="font-semibold mb-1">{session.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">{session.description}</p>
                  <p className="text-xs mb-1">
                    {typeof session.dateTime === 'string'
                      ? new Date(session.dateTime).toLocaleDateString() + ' ' + new Date(session.dateTime).toLocaleTimeString()
                      : ''}
                  </p>
                  <p className="text-xs font-semibold mb-2">₹{session.price}</p>
                  <a
                    href={`https://www.google.com/maps?q=${session.coordinates.lat},${session.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )
      ))}
    </MyGoogleMap>
  );
}
