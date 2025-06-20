"use client";

import { useState, useCallback, useEffect } from 'react';
import BaseMap from './BaseMap';

interface LocationPickerMapProps {
  initialLocation?: [number, number];
  onLocationSelect?: (location: [number, number]) => void;
  className?: string;
}

export default function LocationPickerMap({
  initialLocation = [14.7526, 78.5541], // Default to London
  onLocationSelect,
  className
}: LocationPickerMapProps) {
  const [position, setPosition] = useState<[number, number]>(initialLocation);

  // Sync prop to state
  useEffect(() => {
    setPosition(initialLocation);
  }, [initialLocation[0], initialLocation[1]]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos: [number, number] = [e.latLng.lat(), e.latLng.lng()];
      setPosition(newPos);
      onLocationSelect?.(newPos);
    }
  }, [onLocationSelect]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos: [number, number] = [e.latLng.lat(), e.latLng.lng()];
      setPosition(newPos);
      onLocationSelect?.(newPos);
    }
  }, [onLocationSelect]);

  return (
    <BaseMap
      center={position}
      zoom={13}
      className={className}
      onMapClick={handleMapClick}
      onMarkerDragEnd={handleMarkerDragEnd}
    >
      {/* Marker handled in BaseMap/GoogleMap */}
      {/* Pass marker and handlers as props if needed */}
    </BaseMap>
  );
}
