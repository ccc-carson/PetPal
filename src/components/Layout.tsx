import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Heart, MessageSquare, User, Stethoscope, PawPrint, Plus, Bell, Search } from 'lucide-react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'framer-motion';
import AdSimulator from './AdSimulator';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: '首页', path: '/', icon: Home },
    { name: '领养', path: '/adoption', icon: Heart },
    { name: '发布', path: '/services', icon: Plus, isCenter: true },
    { name: '社区', path: '/community', icon: MessageSquare },
    { name: '我的', path: '/profile', icon: User },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const isChatPage = location.pathname.startsWith('/chat/');
  const isAIDoctorPage = location.pathname === '/ai-doctor';
  const isFullScreen = isChatPage || isAIDoctorPage;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-stone-900 font-sans pb-20">
      {/* Top Bar - Mobile App Style */}
      {!isFullScreen && (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-100 px-4 h-14 flex justify-between items-center max-w-2xl mx-auto w-full">
          <Link to="/" className="flex items-center gap-1.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <PawPrint className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tighter text-stone-900">PetPal</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
              <Search size={22} />
            </button>
            <Link to="/messages" className="relative p-2 text-stone-400 hover:text-stone-900 transition-colors">
              <Bell size={22} />
              {/* Notification dot */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </Link>
          </div>
        </header>
      )}

      {/* Main Content - Centered for Mobile App Feel */}
      <main className={`max-w-2xl mx-auto min-h-screen ${isFullScreen ? '' : 'pt-4 px-4'}`}>
        {children}
      </main>

      {/* Bottom Navigation - Xianyu/Didi Style */}
      {!isFullScreen && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-stone-100 h-16 max-w-2xl mx-auto w-full px-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            if (item.isCenter) {
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className="relative -top-4 flex flex-col items-center"
                >
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 active:scale-90 transition-transform border-4 border-white">
                    <Plus size={32} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 mt-1">发布</span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center justify-center w-14 h-full transition-all active:scale-95 ${
                  isActive ? 'text-emerald-600' : 'text-stone-400'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-emerald-600' : 'text-stone-400'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
