import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

/**
 * A tiny, non-interactive map preview showing a single location.
 * Used in the header to give visual context for the selected location.
 */
export function MiniMap({ latitude, longitude, className = '' }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([latitude, longitude], 11);

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Add a subtle marker/circle for the location
      L.circleMarker([latitude, longitude], {
        radius: 6,
        fillColor: '#22B8A0',
        color: '#22B8A0',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapInstanceRef.current);
    } else {
      // Update existing map view
      mapInstanceRef.current.setView([latitude, longitude], 11);
      
      // Clear existing markers and add new one
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          layer.remove();
        }
      });
      
      L.circleMarker([latitude, longitude], {
        radius: 6,
        fillColor: '#22B8A0',
        color: '#22B8A0',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div 
      ref={mapRef} 
      className={`rounded overflow-hidden ${className}`}
      style={{ minWidth: 40, minHeight: 40 }}
    />
  );
}

export default MiniMap;
