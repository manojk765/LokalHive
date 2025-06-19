"use client";

import { useState, useCallback, useEffect } from 'react';
import { Marker } from 'react-leaflet';
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

  const handleMarkerDrag = useCallback((e: any) => {
    const marker = e.target;
    const position: [number, number] = [marker.getLatLng().lat, marker.getLatLng().lng];
    setPosition(position);
    onLocationSelect?.(position);
  }, [onLocationSelect]);

  return (
    <BaseMap center={position} zoom={13} className={className}>
      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend: handleMarkerDrag,
        }}
      />
    </BaseMap>
  );
}
