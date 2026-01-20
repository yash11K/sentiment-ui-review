import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  Sparkles, 
  LogOut,
  Car,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Sparkles, label: 'AI Analysis', path: '/ai-analysis', badge: 'New' },
    { icon: MessageSquareText, label: 'Reviews', path: '/reviews' },
  ];

  return (
    <aside className={clsx(
      "fixed left-0 top-0 h-screen bg-bg-elevated border-r-2 border-accent-primary/20 flex flex-col z-50 transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Brand */}
      <div className="p-6 border-b-2 border-accent-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center shadow-lg shadow-accent-primary/20 flex-shrink-0">
            <Car className="text-white" size={20} />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-text-primary text-lg leading-tight">AutoInsights</h1>
              <p className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">Station Manager</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-3 rounded-none transition-all duration-200 group relative overflow-hidden border-2",
                isActive 
                  ? "bg-accent-primary text-white shadow-md shadow-accent-primary/10 border-accent-primary" 
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary border-transparent hover:border-accent-primary/30",
                isCollapsed && "justify-center px-3"
              )
            }
          >
            <item.icon size={20} className="relative z-10 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="font-medium relative z-10">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto relative z-10 px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-none">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t-2 border-accent-primary/20">
        <button
          onClick={onToggle}
          className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-none transition-all duration-200 w-full border-2 border-transparent",
            "text-text-secondary hover:bg-bg-hover hover:text-text-primary hover:border-accent-primary/30",
            isCollapsed && "justify-center px-3"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="font-medium">Collapse</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t-2 border-accent-primary/20 bg-bg-surface/30">
        <div className={clsx(
          "flex items-center gap-3 p-2 rounded-none hover:bg-bg-hover transition-colors cursor-pointer",
          isCollapsed && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-none bg-gradient-to-tr from-accent-primary to-purple-500 border-2 border-accent-primary flex-shrink-0" />
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">James Carter</p>
                <p className="text-xs text-text-tertiary truncate">JFK Terminal 4</p>
              </div>
              <LogOut size={16} className="text-text-tertiary hover:text-accent-primary" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;