'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MyGoogleMap from './GoogleMap';

interface BaseMapProps {
  center: [number, number];
  zoom: number;
  children?: React.ReactNode;
  className?: string;
  marker?: { lat: number; lng: number };
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  onMarkerDragEnd?: (e: google.maps.MapMouseEvent) => void;
}

export default function BaseMap({ center, zoom, children, className = 'h-[400px] w-full', marker, onMapClick, onMarkerDragEnd }: BaseMapProps) {
  return (
    <MyGoogleMap
      center={{ lat: center[0], lng: center[1] }}
      zoom={zoom}
      className={className}
      marker={marker}
      onMapClick={onMapClick}
      onMarkerDragEnd={onMarkerDragEnd}
    >
      {children}
    </MyGoogleMap>
  );
} 