import React, { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { MapPin, Bell, ChevronDown, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { useLocations } from '../hooks/useLocations';

const Layout = () => {
  const { currentLocation, setLocation } = useStore();
  const { locations, isLoading: locationsLoading } = useLocations();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Handle location selection from dropdown.
   * Updates the store with the new location, which triggers
   * dashboard and reviews data refetch via their respective hooks.
   * 
   * Requirements:
   * - 3.7: WHEN the location changes, THE Dashboard_Page SHALL refetch all data for the new location
   * - 6.3: WHEN a user selects a different location, THE System SHALL update all data views for that location
   */
  const handleLocationSelect = (location: string) => {
    setLocation(location);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary font-body">
      <Sidebar />
      
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-bg-base/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
          
          {/* Location Picker Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-hover transition-colors border border-white/5 group"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-label="Select location"
            >
              <MapPin size={16} className="text-accent-primary" />
              <span className="text-sm font-medium">{currentLocation}</span>
              {locationsLoading ? (
                <Loader2 size={12} className="ml-2 animate-spin text-text-tertiary" />
              ) : (
                <ChevronDown 
                  size={12} 
                  className={`ml-2 text-text-tertiary group-hover:text-text-secondary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && locations.length > 0 && (
              <div 
                className="absolute top-full left-0 mt-1 w-48 bg-bg-elevated border border-white/10 rounded-lg shadow-lg overflow-hidden z-50"
                role="listbox"
                aria-label="Available locations"
              >
                {locations.map((location) => (
                  <button
                    key={location}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-bg-hover transition-colors flex items-center gap-2 ${
                      location === currentLocation 
                        ? 'bg-accent-primary/10 text-accent-primary' 
                        : 'text-text-primary'
                    }`}
                    onClick={() => handleLocationSelect(location)}
                    role="option"
                    aria-selected={location === currentLocation}
                  >
                    <MapPin size={14} className={location === currentLocation ? 'text-accent-primary' : 'text-text-tertiary'} />
                    {location}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-status-warning rounded-full border-2 border-bg-base"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;