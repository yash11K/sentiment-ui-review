import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LocationSelector, MiniMap } from './LocationSelector';
import { BrandPicker } from './BrandPicker/BrandPicker';
import { MapPin, Bell, ChevronDown, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { useLocations } from '../hooks/useLocations';
import type { BrandMetrics } from '../types/api';

const Layout = () => {
  const location = useLocation();
  const { currentLocation, setLocation, selectedBrand, setSelectedBrand } = useStore();
  const { locations, isLoading: locationsLoading } = useLocations();
  
  // Hide location selector on Reddit page
  const isRedditPage = location.pathname === '/reddit';

  // Auto-select first location with brand "avis" when locations load and none is selected
  useEffect(() => {
    if (!locationsLoading && locations.length > 0 && !currentLocation) {
      setLocation(locations[0].location_id);
      setSelectedBrand('avis');
    }
  }, [locations, locationsLoading, currentLocation, setLocation, setSelectedBrand]);

  // Derive brands for the picker from the locations API
  const brandsForPicker: BrandMetrics[] = React.useMemo(() => {
    const loc = locations.find(l => l.location_id === currentLocation);
    if (!loc?.brands?.length) return [];
    return loc.brands.map(b => ({
      brand: b.brand,
      is_own_brand: !b.is_competitor,
      total_reviews: 0,
      average_rating: 0,
      sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
      top_topics: [],
      rating_distribution: {},
    }));
  }, [locations, currentLocation]);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Get current location object for display
  const currentLocationObj = locations.find((l) => l.location_id === currentLocation);
  const displayName = currentLocationObj?.name || currentLocation;

  /**
   * Handle location selection from the selector.
   * Updates the store with the new location, which triggers
   * dashboard and reviews data refetch via their respective hooks.
   * 
   * Requirements:
   * - 3.7: WHEN the location changes, THE Dashboard_Page SHALL refetch all data for the new location
   * - 6.3: WHEN a user selects a different location, THE System SHALL update all data views for that location
   */
  const handleLocationSelect = (locationId: string) => {
    setLocation(locationId);
    setSelectedBrand('avis');
  };

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary font-body">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="min-h-[5rem] border-b-2 border-accent-primary/20 bg-bg-base/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8 py-3">
          
          {/* Location Picker Button - hidden on Reddit page */}
          {!isRedditPage ? (
            <button 
              className="flex items-center gap-3 p-2 rounded-none bg-bg-elevated hover:bg-bg-hover transition-colors border-2 border-accent-primary/20 hover:border-accent-primary group"
              onClick={() => setIsLocationSelectorOpen(true)}
              aria-label="Select location"
            >
              {/* Mini Map Preview */}
              {currentLocationObj ? (
                <div className="w-16 h-12 rounded-none overflow-hidden border-2 border-accent-primary/30 flex-shrink-0">
                  <MiniMap 
                    latitude={currentLocationObj.latitude} 
                    longitude={currentLocationObj.longitude}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-16 h-12 rounded-none bg-bg-surface flex items-center justify-center flex-shrink-0 border-2 border-accent-primary/30">
                  <MapPin size={20} className="text-accent-primary" />
                </div>
              )}
              
              {/* Location Name */}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-text-primary whitespace-nowrap pr-[5px]">
                  {currentLocationObj?.name?.replace('Avis Car Rental - ', '') || currentLocation}
                </span>
                <span className="text-xs text-text-tertiary flex items-center gap-1">
                  Change location
                  {locationsLoading ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <ChevronDown size={10} />
                  )}
                </span>
              </div>
            </button>
          ) : (
            <div /> 
          )}

          <div className="flex items-center gap-4">
            <BrandPicker
              brands={brandsForPicker}
              selectedBrand={selectedBrand}
              onSelectBrand={setSelectedBrand}
            />
            <button className="p-2 text-text-secondary hover:text-accent-primary hover:bg-bg-hover rounded-none transition-colors relative border-2 border-transparent hover:border-accent-primary/30">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-status-warning rounded-none border-2 border-bg-base"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Location Selector Modal - not needed on Reddit page */}
      {!isRedditPage && (
        <LocationSelector
          isOpen={isLocationSelectorOpen}
          onClose={() => setIsLocationSelectorOpen(false)}
          locations={locations}
          currentLocationId={currentLocation}
          onSelectLocation={handleLocationSelect}
          isLoading={locationsLoading}
        />
      )}
    </div>
  );
};

export default Layout;