import React from 'react';
import { 
  School, 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Image as ImageIcon, 
  Database, 
  LogOut, 
  Wifi, 
  WifiOff, 
  User as UserIcon,
  Users,
  Sparkles
} from 'lucide-react';
import { SchoolBranding, SupabaseConfig, User } from '../types';

interface NavbarProps {
  user: User;
  activeTab: 'dashboard' | 'create' | 'list' | 'branding' | 'database' | 'users';
  setActiveTab: (tab: 'dashboard' | 'create' | 'list' | 'branding' | 'database' | 'users') => void;
  branding: SchoolBranding;
  supabaseConfig: SupabaseConfig;
  onLogout: () => void;
  onOpenDatabaseSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  branding,
  supabaseConfig,
  onLogout,
  onOpenDatabaseSettings,
}) => {
  return (
    <header className="no-print bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-xl font-kalpurush">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: School Logo & Title */}
          <div className="flex items-center space-x-4 space-x-reverse cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-900/40 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                {branding.logo_url ? (
                  <img
                    src={branding.logo_url}
                    alt={branding.school_name}
                    className="w-10 h-10 object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <School className="w-6 h-6 text-emerald-400 absolute" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading leading-snug">
                  {branding.school_name}
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                  EIIN: {branding.eiin_no}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ভাউচার জেনারেটর ও হিসাব ব্যবস্থাপনা সফটওয়্যার
              </p>
            </div>
          </div>

          {/* Center Navigation Buttons for Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 space-x-reverse bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 space-x-reverse px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>ড্যাশবোর্ড</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center space-x-2 space-x-reverse px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন ভাউচার</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center space-x-2 space-x-reverse px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ভাউচার তালিকা</span>
            </button>

            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center space-x-2 space-x-reverse px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'branding'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>লোগো কাস্টমাইজ</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 space-x-reverse px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ইউজার ও সেটিং</span>
            </button>
          </nav>

          {/* Right Controls: Database status + Profile + Logout */}
          <div className="flex items-center space-x-3 space-x-reverse">
            
            {/* Supabase Status Button */}
            <button
              onClick={onOpenDatabaseSettings}
              title={supabaseConfig.isConnected ? 'Supabase সংযুক্ত আছে' : 'Supabase ডাটাবেজ কানেক্ট করুন'}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                  : 'bg-amber-950/50 text-amber-300 border-amber-500/40 hover:bg-amber-900/80 animate-pulse'
              }`}
            >
              {supabaseConfig.isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Supabase সিঙ্কড</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">ডাটাবেজ কানেক্ট</span>
                </>
              )}
            </button>

            {/* User Profile Badge */}
            <div 
              onClick={() => setActiveTab('users')}
              title="ইউজার প্রোফাইল ও স্বাক্ষর পরিবর্তন করুন"
              className="hidden sm:flex items-center space-x-2 space-x-reverse bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow">
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-100 leading-none truncate max-w-[120px]">
                  {user.full_name}
                </p>
                <p className="text-[10px] text-emerald-400 font-medium leading-tight mt-0.5">
                  {user.role === 'ADMIN' ? 'সুপার অ্যাডমিন' : user.role === 'ACCOUNTANT' ? 'হিসাবরক্ষক' : 'প্রধান শিক্ষক'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              type="button"
              title="লগআউট করুন"
              className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4 text-rose-400 group-hover:text-white" />
              <span className="text-xs font-bold">লগআউট</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex items-center justify-between py-2.5 px-1 border-t border-slate-800/80 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>ড্যাশবোর্ড</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'create' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <PlusCircle className="w-4 h-4 mb-0.5" />
            <span>নতুন ভাউচার</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'list' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4 mb-0.5" />
            <span>তালিকা</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'branding' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <ImageIcon className="w-4 h-4 mb-0.5" />
            <span>লোগো</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>ইউজার</span>
          </button>

          <button
            onClick={onLogout}
            type="button"
            className="flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 mb-0.5" />
            <span>লগআউট</span>
          </button>
        </div>

      </div>
    </header>
  );
};
