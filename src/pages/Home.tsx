import React from 'react';
import { motion } from 'framer-motion';
import { PawPrint, Heart, MessageSquare, Stethoscope, ShieldCheck, MapPin, Search, User, ChevronRight, Sparkles, Zap, Star, Home as HomeIcon, Calendar, Trophy, Camera } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';

import AdSimulator from '../components/AdSimulator';

export default function Home() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [points, setPoints] = React.useState(0);
  const [hasCheckedIn, setHasCheckedIn] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setPoints(data.points || 0);
        
        if (data.lastCheckIn) {
          const lastDate = data.lastCheckIn.toDate().toDateString();
          const today = new Date().toDateString();
          setHasCheckedIn(lastDate === today);
        }
      } else {
        // Initialize user doc if not exists
        await setDoc(doc(db, 'users', user.uid), {
          points: 0,
          email: user.email,
          displayName: user.displayName,
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user || hasCheckedIn || loading) return;
    setLoading(true);
    try {
      const newPoints = points + 10;
      await updateDoc(doc(db, 'users', user.uid), {
        points: newPoints,
        lastCheckIn: Timestamp.now()
      });
      setPoints(newPoints);
      setHasCheckedIn(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: '上门喂养', icon: PawPrint, color: 'bg-orange-500', path: '/services' },
    { name: '家庭寄养', icon: HomeIcon, color: 'bg-blue-500', path: '/services' },
    { name: '领养中心', icon: Heart, color: 'bg-rose-500', path: '/adoption' },
    { name: 'AI医生', icon: Stethoscope, color: 'bg-emerald-500', path: '/ai-doctor' },
  ];

  const quickActions = [
    { name: '心情扫描', icon: Camera, color: 'text-purple-600', bg: 'bg-purple-50', path: '/mood-scanner' },
    { name: '附近宠友', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: '热门动态', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: '金牌服务', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Check-in */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Good Morning</p>
            <h2 className="text-sm font-black text-stone-900">{user?.displayName || '铲屎官'}</h2>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCheckIn}
          disabled={hasCheckedIn || loading}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all ${
            hasCheckedIn 
              ? 'bg-stone-100 text-stone-400' 
              : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-orange-500/20'
          }`}
        >
          <Calendar size={16} />
          <span className="text-xs font-black">{hasCheckedIn ? '已签到' : '每日签到'}</span>
          {!hasCheckedIn && <span className="text-[10px] bg-white/20 px-1.5 rounded-md">+10</span>}
        </motion.button>
      </div>

      {/* Points & Stats */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase">我的积分</p>
            <p className="text-lg font-black text-stone-900">{points}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Star size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase">勋章等级</p>
            <p className="text-lg font-black text-stone-900">Lv.{Math.floor(points / 100) + 1}</p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
        </div>
        <input 
          type="text" 
          placeholder="搜索附近的喂养、寄养、宠友..." 
          className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
        />
      </div>

      {/* Pet of the Day */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy size={120} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg">
            <img 
              src="https://picsum.photos/seed/pet_of_day/200/200" 
              alt="Pet of the Day" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy size={14} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">今日萌主</span>
            </div>
            <h3 className="text-lg font-black mb-1">金毛“球球”</h3>
            <p className="text-xs text-white/80 line-clamp-1">凭借一张治愈系笑脸获得 1.2k 票！</p>
          </div>
          <button className="px-4 py-2 bg-white text-indigo-600 text-xs font-black rounded-xl shadow-lg">
            去投票
          </button>
        </div>
      </section>

      {/* Main Categories */}
      <section className="grid grid-cols-4 gap-3">
        {categories.map((cat, i) => (
          <Link 
            key={i} 
            to={cat.path}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 group-active:scale-90 transition-transform`}>
              <cat.icon size={28} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-black text-stone-700">{cat.name}</span>
          </Link>
        ))}
      </section>

      {/* Quick Actions Bar */}
      <section className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm">
        {quickActions.map((action, i) => (
          <button 
            key={i} 
            onClick={() => action.path && navigate(action.path)}
            className="flex flex-col items-center gap-1.5 px-2"
          >
            <div className={`p-2 ${action.bg} rounded-xl ${action.color}`}>
              <action.icon size={20} />
            </div>
            <span className="text-[10px] font-bold text-stone-500">{action.name}</span>
          </button>
        ))}
      </section>

      {/* Hero Banner - Xianyu Style */}
      <section className="relative h-44 rounded-3xl overflow-hidden shadow-lg group">
        <img 
          src="https://picsum.photos/seed/petpal_hero/1200/600" 
          alt="Banner" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex flex-col justify-center p-6">
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">春季萌宠出游季</h2>
          <p className="text-white/80 text-xs font-bold mb-4">预约上门喂养，享 8 折优惠</p>
          <button 
            onClick={() => navigate('/services')}
            className="w-fit px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-full hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/30"
          >
            立即预约
          </button>
        </div>
      </section>

      {/* Featured Section - Xianyu Style Feed */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-black text-stone-900 tracking-tight">猜你喜欢</h3>
          <Link to="/services" className="text-xs font-bold text-stone-400 flex items-center gap-0.5">
            查看更多 <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/services')}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-50 flex flex-col"
            >
              <div className="relative h-40">
                <img 
                  src={`https://picsum.photos/seed/pet_feed_${i}/400/500`} 
                  alt="Pet" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md text-[9px] font-bold text-white flex items-center gap-1">
                  <MapPin size={10} /> 1.2km
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h4 className="text-xs font-black text-stone-800 line-clamp-2 mb-2 leading-relaxed">
                  {i % 2 === 0 ? '专业上门喂猫，有丰富养宠经验，可提供视频反馈' : '家庭寄养，大空间，每日消毒，给毛孩子家一般的温暖'}
                </h4>
                <div className="mt-auto flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-rose-500 text-sm font-black">¥{i * 30 + 20}</span>
                    <span className="text-[9px] text-stone-400">/天</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Native Ad Placement */}
          <AdSimulator type="native" onClose={() => {}} />

          {[3, 4].map((i) => (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/services')}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-50 flex flex-col"
            >
              <div className="relative h-40">
                <img 
                  src={`https://picsum.photos/seed/pet_feed_${i}/400/500`} 
                  alt="Pet" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md text-[9px] font-bold text-white flex items-center gap-1">
                  <MapPin size={10} /> 1.2km
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h4 className="text-xs font-black text-stone-800 line-clamp-2 mb-2 leading-relaxed">
                  {i % 2 === 0 ? '专业上门喂猫，有丰富养宠经验，可提供视频反馈' : '家庭寄养，大空间，每日消毒，给毛孩子家一般的温暖'}
                </h4>
                <div className="mt-auto flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-rose-500 text-sm font-black">¥{i * 30 + 20}</span>
                    <span className="text-[9px] text-stone-400">/天</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Community Teaser - Douyin Style */}
      <section className="relative rounded-3xl overflow-hidden h-60 group">
        <img 
          src="https://picsum.photos/seed/community_vibe/800/600" 
          alt="Community" 
          className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <img 
                  key={i}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user_${i}`} 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                  alt="User"
                />
              ))}
            </div>
            <span className="text-xs font-bold text-white/90">1.2w+ 宠友正在热聊</span>
          </div>
          <h3 className="text-xl font-black text-white mb-2">加入宠友圈，分享快乐</h3>
          <button 
            onClick={() => navigate('/community')}
            className="w-full py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white font-black rounded-2xl hover:bg-white/30 transition-all"
          >
            进入社区
          </button>
        </div>
      </section>
    </div>
  );
}
