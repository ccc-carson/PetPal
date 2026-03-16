import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, Timestamp, orderBy, updateDoc, doc } from 'firebase/firestore';
import { User, PawPrint, Plus, Loader2, Settings, Calendar, Weight, ShieldCheck, LogOut, Clock, MapPin, DollarSign, Edit3, ChevronRight, Wallet, Heart, Star, ShoppingBag } from 'lucide-react';
import Auth from '../components/Auth';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import AdSimulator from '../components/AdSimulator';
import { Book, Bell as BellIcon, CheckCircle2, Circle } from 'lucide-react';

export default function Profile() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isAddingPet, setIsAddingPet] = React.useState(false);
  const [editingRequest, setEditingRequest] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'pets' | 'diary' | 'reminders'>('pets');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        alert('图片文件过大，请选择小于 500KB 的图片。');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [petsSnap, petsLoading] = useCollection(
    user ? query(collection(db, 'pets'), where('ownerId', '==', user.uid)) : null
  );
  const pets = petsSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const [requestsSnap, requestsLoading] = useCollection(
    user ? query(collection(db, 'serviceRequests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null
  );
  const myRequests = requestsSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const [diarySnap] = useCollection(
    user ? query(collection(db, 'petDiary'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null
  );
  const diaryEntries = diarySnap?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const [remindersSnap] = useCollection(
    user ? query(collection(db, 'reminders'), where('userId', '==', user.uid), orderBy('dueDate', 'asc')) : null
  );
  const reminders = remindersSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const handleAddDiary = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'petDiary'), {
        userId: user.uid,
        content: '今天带球球去公园玩了，它非常开心！',
        photo: 'https://picsum.photos/seed/diary_1/400/400',
        createdAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'petDiary');
    }
  };

  const handleAddReminder = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'reminders'), {
        userId: user.uid,
        title: '驱虫提醒',
        petName: '球球',
        dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000 * 7)),
        completed: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reminders');
    }
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'reminders', id), { completed: !completed });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reminders');
    }
  };

  const handleAddPet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoc(collection(db, 'pets'), {
        ownerId: user.uid,
        name: formData.get('name'),
        type: formData.get('type'),
        breed: formData.get('breed'),
        age: Number(formData.get('age')),
        gender: formData.get('gender'),
        isNeutered: formData.get('isNeutered') === 'true',
        isVaccinated: formData.get('isVaccinated') === 'true',
        photo: photoPreview || `https://picsum.photos/seed/${Math.random()}/400/400`,
        createdAt: Timestamp.now(),
      });
      setIsAddingPet(false);
      setPhotoPreview(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'pets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await updateDoc(doc(db, 'serviceRequests', requestId), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'serviceRequests');
    }
  };

  const handleEditRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !editingRequest) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateDoc(doc(db, 'serviceRequests', editingRequest.id), {
        budget: Number(formData.get('budget')),
        description: formData.get('description'),
        updatedAt: Timestamp.now(),
      });
      setEditingRequest(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'serviceRequests');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Auth />;

  const menuItems = [
    { name: '我的发布', icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50', count: myRequests?.length || 0 },
    { name: '我的宠物', icon: PawPrint, color: 'text-emerald-500', bg: 'bg-emerald-50', count: pets?.length || 0 },
    { name: '收藏夹', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', count: 0 },
    { name: '评价中心', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', count: 0 },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header - Mobile App Style */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="Profile" 
                className="w-20 h-20 rounded-full border-4 border-emerald-50 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                <ShieldCheck size={12} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight mb-1">{user.displayName}</h1>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-stone-100 text-[10px] font-bold text-stone-500 rounded-md uppercase tracking-wider">
                  普通用户
                </span>
                <span className="text-[10px] text-stone-300 font-medium">UID: {user.uid.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
            <Settings size={22} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-stone-50">
          <div className="text-center">
            <p className="text-lg font-black text-stone-900">12</p>
            <p className="text-[10px] font-bold text-stone-400">关注</p>
          </div>
          <div className="text-center border-x border-stone-50">
            <p className="text-lg font-black text-stone-900">8</p>
            <p className="text-[10px] font-bold text-stone-400">粉丝</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-stone-900">¥0.00</p>
            <p className="text-[10px] font-bold text-stone-400">钱包</p>
          </div>
        </div>
      </section>

      {/* Quick Menu Grid */}
      <section className="grid grid-cols-4 gap-3">
        {menuItems.map((item, i) => (
          <button 
            key={i}
            className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-stone-50 active:scale-95 transition-transform"
          >
            <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
              <item.icon size={20} />
            </div>
            <span className="text-[10px] font-black text-stone-700">{item.name}</span>
            {item.count > 0 && (
              <span className="text-[9px] font-bold text-stone-400">{item.count}</span>
            )}
          </button>
        ))}
      </section>

      {/* Tabbed Content Section */}
      <section className="space-y-6">
        <div className="flex gap-6 border-b border-stone-100 px-1">
          {[
            { id: 'pets', name: '宠物档案' },
            { id: 'diary', name: '成长日志' },
            { id: 'reminders', name: '健康提醒' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-black transition-colors relative ${
                activeTab === tab.id ? 'text-stone-900' : 'text-stone-400'
              }`}
            >
              {tab.name}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" 
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'pets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-black text-stone-900">我的爱宠 ({pets?.length || 0})</h3>
              <button
                onClick={() => setIsAddingPet(true)}
                className="text-xs font-bold text-emerald-600 flex items-center gap-1"
              >
                添加 <Plus size={14} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {petsLoading ? (
                <div className="flex justify-center w-full py-8">
                  <Loader2 className="animate-spin text-emerald-600" size={24} />
                </div>
              ) : (
                <>
                  {pets?.map((pet: any) => (
                    <motion.div
                      key={pet.id}
                      whileTap={{ scale: 0.98 }}
                      className="flex-shrink-0 w-40 bg-white rounded-2xl p-3 shadow-sm border border-stone-50"
                    >
                      <img 
                        src={pet.photo} 
                        alt={pet.name} 
                        className="w-full h-32 rounded-xl object-cover mb-3 bg-stone-50"
                        referrerPolicy="no-referrer"
                      />
                      <h3 className="font-black text-sm text-stone-900 mb-1 truncate">{pet.name}</h3>
                      <p className="text-[10px] text-stone-400 font-bold truncate">
                        {pet.breed} · {pet.age}岁
                      </p>
                    </motion.div>
                  ))}
                  {pets?.length === 0 && (
                    <div className="w-full text-center py-10 bg-white rounded-3xl border border-dashed border-stone-200">
                      <p className="text-stone-400 text-xs font-bold">还没有添加宠物档案</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-black text-stone-900">成长日志</h3>
              <button
                onClick={handleAddDiary}
                className="text-xs font-bold text-emerald-600 flex items-center gap-1"
              >
                记录瞬间 <Plus size={14} />
              </button>
            </div>
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-100">
              {diaryEntries?.map((entry: any) => (
                <div key={entry.id} className="relative pl-10">
                  <div className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-50">
                    <p className="text-xs text-stone-400 font-bold mb-2">
                      {entry.createdAt ? format(entry.createdAt.toDate(), 'yyyy年MM月dd日', { locale: zhCN }) : '刚刚'}
                    </p>
                    <p className="text-sm text-stone-700 font-medium mb-3">{entry.content}</p>
                    {entry.photo && (
                      <img 
                        src={entry.photo} 
                        alt="Diary" 
                        className="w-full h-48 rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>
              ))}
              {diaryEntries?.length === 0 && (
                <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-stone-200">
                  <p className="text-stone-400 text-xs font-bold">还没有记录成长日志</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-black text-stone-900">健康提醒</h3>
              <button
                onClick={handleAddReminder}
                className="text-xs font-bold text-emerald-600 flex items-center gap-1"
              >
                添加提醒 <Plus size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {reminders?.map((reminder: any) => (
                <div 
                  key={reminder.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-stone-50 flex items-center gap-4"
                >
                  <button 
                    onClick={() => toggleReminder(reminder.id, reminder.completed)}
                    className={`transition-colors ${reminder.completed ? 'text-emerald-500' : 'text-stone-300'}`}
                  >
                    {reminder.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <div className="flex-1">
                    <h4 className={`font-black text-sm ${reminder.completed ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                      {reminder.title} · {reminder.petName}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-bold">
                      截止日期: {reminder.dueDate ? format(reminder.dueDate.toDate(), 'MM月dd日', { locale: zhCN }) : '未设置'}
                    </p>
                  </div>
                  <BellIcon size={18} className={reminder.completed ? 'text-stone-200' : 'text-amber-400'} />
                </div>
              ))}
              {reminders?.length === 0 && (
                <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-stone-200">
                  <p className="text-stone-400 text-xs font-bold">暂无健康提醒</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Ad Banner */}
      <div className="mt-4">
        <AdSimulator type="banner" onClose={() => {}} />
      </div>

      {/* Logout Button */}
      <button 
        onClick={() => auth.signOut()}
        className="w-full py-4 bg-white text-rose-500 font-black rounded-2xl shadow-sm border border-stone-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <LogOut size={20} /> 退出登录
      </button>

      {/* Modals (Add Pet, Edit Request) - Same as before but styled */}
      <AnimatePresence>
        {isAddingPet && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingPet(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white rounded-t-[32px] shadow-2xl p-8 pb-12"
            >
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black mb-8 tracking-tight">添加宠物档案</h2>
              <form onSubmit={handleAddPet} className="space-y-6">
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-3xl bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Plus size={32} className="text-stone-300" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-500 uppercase ml-1">宠物昵称</label>
                    <input name="name" required className="w-full px-5 py-4 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="如：旺财" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-500 uppercase ml-1">宠物类型</label>
                    <select name="type" className="w-full px-5 py-4 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold appearance-none">
                      <option value="dog">狗狗</option>
                      <option value="cat">猫猫</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-500 uppercase ml-1">品种</label>
                    <input name="breed" className="w-full px-5 py-4 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="如：金毛" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-500 uppercase ml-1">年龄</label>
                    <input type="number" name="age" className="w-full px-5 py-4 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="如：2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : '确认添加'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
