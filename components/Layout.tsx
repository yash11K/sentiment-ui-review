import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { MapPin, Bell } from 'lucide-react';
import { useStore } from '../store';

const Layout = () => {
  const { currentLocation } = useStore();

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary font-body">
      <Sidebar />
      
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-bg-base/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
          
          {/* Location Picker Trigger */}
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-hover transition-colors border border-white/5 group">
            <MapPin size={16} className="text-accent-primary" />
            <span className="text-sm font-medium">{currentLocation}</span>
            <span className="text-[10px] text-text-tertiary ml-2 group-hover:text-text-secondary">▼</span>
          </button>

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