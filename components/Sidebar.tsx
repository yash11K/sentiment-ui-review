import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  Sparkles, 
  Users, 
  Settings, 
  LogOut,
  Car
} from 'lucide-react';
import { clsx } from 'clsx';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Sparkles, label: 'AI Analysis', path: '/ai-analysis', badge: 'New' },
    { icon: MessageSquareText, label: 'Reviews', path: '/reviews' },
    { icon: Users, label: 'Staff Perf.', path: '/staff' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-bg-elevated border-r border-white/5 flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <Car className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-text-primary text-lg leading-tight">AutoInsights</h1>
            <p className="text-[11px] text-text-tertiary uppercase tracking-wider font-semibold">Station Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-accent-primary text-white shadow-md shadow-accent-primary/10" 
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              )
            }
          >
            <item.icon size={20} className="relative z-10" />
            <span className="font-medium relative z-10">{item.label}</span>
            {item.badge && (
              <span className="ml-auto relative z-10 px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-bg-surface/30">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-bg-elevated" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">James Carter</p>
            <p className="text-xs text-text-tertiary truncate">JFK Terminal 4</p>
          </div>
          <LogOut size={16} className="text-text-tertiary hover:text-text-primary" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;