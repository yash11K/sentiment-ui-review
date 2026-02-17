import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Search, MapPin, Check, Navigation, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import type { Location } from '../../types/api';
import { isOwnBrand } from '../../types/api';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon for selected location - using violet/purple
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  currentLocationId: string;
  onSelectLocation: (locationId: string) => void;
  onSelectBrand?: (brand: string | null) => void;
}

// Component to handle map view changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [map, center, zoom]);
  
  return null;
}

export function LocationSelector({
  isOpen,
  onClose,
  locations,
  currentLocationId,
  onSelectLocation,
  onSelectBrand,
}: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);
  const [step, setStep] = useState<'location' | 'brand'>('location');
  const [pendingLocationId, setPendingLocationId] = useState<string | null>(null);

  // Derive brand groups directly from the locations data — no extra API calls
  const { ownBrands, competitorBrands } = useMemo(() => {
    if (!pendingLocationId) return { ownBrands: [], competitorBrands: [] };
    const loc = locations.find((l) => l.location_id === pendingLocationId);
    const brands = loc?.brands ?? [];
    return {
      ownBrands: brands.filter((b) => !b.is_competitor),
      competitorBrands: brands.filter((b) => b.is_competitor),
    };
  }, [locations, pendingLocationId]);

  // Get the pending location name for the step 2 header
  const pendingLocationName = useMemo(() => {
    if (!pendingLocationId) return '';
    const loc = locations.find((l) => l.location_id === pendingLocationId);
    return loc?.name?.replace('Avis Car Rental - ', '') ?? pendingLocationId;
  }, [locations, pendingLocationId]);

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(
      (loc) =>
        (loc.name?.toLowerCase().includes(query)) ||
        (loc.address?.toLowerCase().includes(query)) ||
        (loc.location_id?.toLowerCase().includes(query))
    );
  }, [locations, searchQuery]);

  // Filter locations with valid coordinates for the map
  const locationsWithCoords = useMemo(() => {
    return locations.filter(
      (loc) => loc.latitude != null && loc.longitude != null
    );
  }, [locations]);

  // Calculate map center - focus on hovered/focused location or current
  const mapCenter = useMemo((): [number, number] => {
    const focusLocation = focusedLocationId 
      ? locationsWithCoords.find((l) => l.location_id === focusedLocationId)
      : locationsWithCoords.find((l) => l.location_id === currentLocationId);
    
    if (focusLocation && focusLocation.latitude != null && focusLocation.longitude != null) {
      return [focusLocation.latitude, focusLocation.longitude];
    }
    if (locationsWithCoords.length > 0) {
      const avgLat = locationsWithCoords.reduce((sum, l) => sum + (l.latitude || 0), 0) / locationsWithCoords.length;
      const avgLng = locationsWithCoords.reduce((sum, l) => sum + (l.longitude || 0), 0) / locationsWithCoords.length;
      return [avgLat, avgLng];
    }
    return [39.8283, -98.5795]; // Center of US
  }, [locationsWithCoords, currentLocationId, focusedLocationId]);

  const mapZoom = focusedLocationId ? 10 : (locationsWithCoords.length === 1 ? 10 : 4);

  const handleSelect = (locationId: string) => {
    setPendingLocationId(locationId);
    setStep('brand');
  };

  const handleBrandSelect = (brand: string) => {
    if (pendingLocationId) {
      onSelectLocation(pendingLocationId);
      onSelectBrand?.(brand);
    }
    onClose();
  };

  const handleSkipBrand = () => {
    if (pendingLocationId) {
      onSelectLocation(pendingLocationId);
      onSelectBrand?.(null);
    }
    onClose();
  };

  const handleHover = (locationId: string | null) => {
    setHoveredLocationId(locationId);
    if (locationId) {
      setFocusedLocationId(locationId);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setFocusedLocationId(null);
      setHoveredLocationId(null);
      setStep('location');
      setPendingLocationId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-bg-elevated rounded-none shadow-2xl border-2 border-accent-primary overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-accent-primary/30">
          <div className="flex items-center gap-3">
            {step === 'brand' && (
              <button
                onClick={() => setStep('location')}
                className="p-1.5 rounded-none hover:bg-bg-hover transition-colors text-text-secondary hover:text-accent-primary border-2 border-transparent hover:border-accent-primary/30"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {step === 'location' ? 'Select Location' : `Select Brand at ${pendingLocationName}`}
              </h2>
              <p className="text-sm text-text-tertiary mt-0.5">
                {step === 'location'
                  ? 'Choose a rental location to view its data'
                  : 'Choose a brand to filter competitive data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-none hover:bg-bg-hover transition-colors text-text-secondary hover:text-accent-primary border-2 border-transparent hover:border-accent-primary/30"
          >
            <X size={20} />
          </button>
        </div>

        {step === 'location' ? (
        <div className="flex flex-col lg:flex-row">
          {/* Map Section */}
          <div className="lg:w-1/2 h-72 lg:h-96 relative">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <MapController center={mapCenter} zoom={mapZoom} />
              {locationsWithCoords.map((location) => (
                <Marker
                  key={location.location_id}
                  position={[location.latitude!, location.longitude!]}
                  icon={
                    location.location_id === currentLocationId || 
                    location.location_id === hoveredLocationId 
                      ? selectedIcon 
                      : defaultIcon
                  }
                  eventHandlers={{
                    click: () => handleSelect(location.location_id),
                    mouseover: () => handleHover(location.location_id),
                    mouseout: () => setHoveredLocationId(null),
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-semibold text-gray-900">{(location.name || location.location_id).replace('Avis Car Rental - ', '')}</p>
                      <p className="text-gray-600 text-xs mt-1">{location.address || 'No address available'}</p>
                      <button 
                        className="mt-2 w-full py-1.5 bg-purple-600 text-white text-xs font-medium rounded-none hover:bg-purple-700 transition-colors"
                        onClick={() => handleSelect(location.location_id)}
                      >
                        Select Location
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            {/* Map hint overlay */}
            <div className="absolute bottom-3 left-3 bg-accent-primary/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-none flex items-center gap-1.5">
              <Navigation size={12} />
              Click a marker to select
            </div>
          </div>

          {/* List Section */}
          <div className="lg:w-1/2 flex flex-col border-t-2 lg:border-t-0 lg:border-l-2 border-accent-primary/30">
            {/* Search */}
            <div className="p-4 border-b-2 border-accent-primary/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, code, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border-2 border-accent-primary/20 rounded-none text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Location List */}
            <div className="flex-1 overflow-y-auto max-h-64 lg:max-h-80">
              {filteredLocations.length === 0 ? (
                <div className="p-8 text-center text-text-tertiary">
                  <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No locations found matching "{searchQuery}"</p>
                </div>
              ) : (
                filteredLocations.map((location) => {
                  const isSelected = location.location_id === currentLocationId;
                  const isHovered = location.location_id === hoveredLocationId;
                  
                  return (
                    <button
                      key={location.location_id}
                      onClick={() => handleSelect(location.location_id)}
                      onMouseEnter={() => handleHover(location.location_id)}
                      onMouseLeave={() => setHoveredLocationId(null)}
                      className={clsx(
                        'w-full px-4 py-3.5 flex items-start gap-3 transition-all text-left border-b-2 border-accent-primary/10 last:border-b-0',
                        isSelected && 'bg-accent-primary/10 border-l-4 border-l-accent-primary',
                        !isSelected && isHovered && 'bg-bg-hover',
                        !isSelected && !isHovered && 'hover:bg-bg-hover'
                      )}
                    >
                      {/* Location Icon */}
                      <div className={clsx(
                        'w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0 transition-colors',
                        isSelected ? 'bg-accent-primary/20' : 'bg-bg-surface'
                      )}>
                        <MapPin
                          size={20}
                          className={isSelected ? 'text-accent-primary' : 'text-text-tertiary'}
                        />
                      </div>
                      
                      {/* Location Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              'font-semibold truncate',
                              isSelected ? 'text-accent-primary' : 'text-text-primary'
                            )}
                          >
                            {(location.name || location.location_id).replace('Avis Car Rental - ', '')}
                          </span>
                          <span className="text-[10px] text-text-tertiary bg-bg-surface px-1.5 py-0.5 rounded-none font-mono border border-accent-primary/20">
                            {location.location_id}
                          </span>
                        </div>
                        <p className="text-sm text-text-tertiary truncate mt-0.5">
                          {location.address || 'No address available'}
                        </p>
                      </div>
                      
                      {/* Selected Check */}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-none bg-accent-primary flex items-center justify-center flex-shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
        ) : (
        /* Step 2: Brand Selection */
        <div className="p-5">
          {/* Skip / All Brands button */}
          <button
            onClick={handleSkipBrand}
            className="w-full mb-4 py-2.5 px-4 bg-bg-surface border-2 border-accent-primary/20 rounded-none text-text-primary font-medium hover:bg-bg-hover hover:border-accent-primary/40 transition-colors"
          >
            Skip / All Brands
          </button>

          {ownBrands.length === 0 && competitorBrands.length === 0 ? (
            <div className="py-12 text-center text-text-tertiary">
              <p>No brands available at this location</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-72 lg:max-h-80 space-y-4">
              {/* Our Brands */}
              {ownBrands.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Our Brands</h3>
                  <div className="space-y-1">
                    {ownBrands.map((b) => (
                      <button
                        key={b.brand}
                        onClick={() => handleBrandSelect(b.brand)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-bg-hover transition-colors border-2 border-transparent hover:border-accent-primary/20 rounded-none"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                        <span className="font-medium text-text-primary capitalize">{b.brand}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitors */}
              {competitorBrands.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Competitors</h3>
                  <div className="space-y-1">
                    {competitorBrands.map((b) => (
                      <button
                        key={b.brand}
                        onClick={() => handleBrandSelect(b.brand)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-bg-hover transition-colors border-2 border-transparent hover:border-accent-primary/20 rounded-none"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="font-medium text-text-primary capitalize">{b.brand}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

export default LocationSelector;
