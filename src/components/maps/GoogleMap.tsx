"use client";
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

export default function MyGoogleMap({
  center = { lat: 14.7526, lng: 78.5541 },
  marker,
  onMapClick,
  onMarkerDragEnd,
  zoom = 13,
  className,
  children,
}: {
  center?: { lat: number; lng: number };
  marker?: { lat: number; lng: number };
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  onMarkerDragEnd?: (e: google.maps.MapMouseEvent) => void;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className={className} style={{ width: '100%', height: '400px' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onClick={onMapClick}
      >
        {marker && (
          <Marker
            position={marker}
            draggable={!!onMarkerDragEnd}
            onDragEnd={onMarkerDragEnd}
          />
        )}
        {children}
      </GoogleMap>
    </div>
  );
}
