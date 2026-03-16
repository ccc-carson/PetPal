import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { Heart, Filter, Plus, Loader2, Camera, Info, Search, ChevronRight, X } from 'lucide-react';
import Auth from '../components/Auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function Adoption() {
  const [user] = useAuthState(auth);
  const [isAdding, setIsAdding] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(false);

  const postsQuery = filter === 'all' 
    ? query(collection(db, 'adoptionPosts'), orderBy('createdAt', 'desc'))
    : query(collection(db, 'adoptionPosts'), where('petType', '==', filter), orderBy('createdAt', 'desc'));

  const [postsSnap, postsLoading] = useCollection(postsQuery);
  const posts = postsSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const newPost = {
        authorId: user.uid,
        authorName: user.displayName,
        petName: formData.get('petName'),
        petType: formData.get('petType'),
        breed: formData.get('breed'),
        age: formData.get('age'),
        description: formData.get('description'),
        status: 'available',
        photo: `https://picsum.photos/seed/${Math.random()}/600/400`,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'adoptionPosts'), newPost);
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'adoptionPosts');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Auth />;

  return (
    <div className="pb-20">
      {/* Search & Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black italic tracking-tight text-stone-900">领养中心</h1>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-4 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg shadow-rose-500/20"
          >
            <Plus size={14} /> 发布送养
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input 
            type="text" 
            placeholder="搜索心仪的毛孩子..." 
            className="w-full pl-11 pr-4 py-2.5 bg-stone-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['all', 'dog', 'cat', 'other'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filter === type 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'bg-stone-50 text-stone-500 border border-stone-100'
              }`}
            >
              {type === 'all' ? '全部' : type === 'dog' ? '狗狗' : type === 'cat' ? '猫猫' : '其他'}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid - Two Column Layout like Xianyu */}
      <div className="px-3 pt-4">
        {postsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-rose-500" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {posts?.map((post: any) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={post.id || Math.random()}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100 flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={post.photo} 
                    alt={post.petName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm ${
                      post.status === 'available' ? 'bg-emerald-500 text-white' : 'bg-stone-500 text-white'
                    }`}>
                      {post.status === 'available' ? '待领养' : '已领养'}
                    </span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm text-stone-900 truncate">{post.petName}</h3>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-stone-100 rounded text-stone-500">
                      {post.petType === 'dog' ? '狗狗' : post.petType === 'cat' ? '猫猫' : '其他'}
                    </span>
                  </div>
                  <p className="text-stone-500 text-[10px] line-clamp-2 mb-3 leading-relaxed">
                    {post.description}
                  </p>
                  <div className="mt-auto pt-2 border-t border-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
                        alt="Author" 
                        className="w-4 h-4 rounded-full bg-stone-100"
                      />
                      <span className="text-[9px] text-stone-400 truncate max-w-[50px]">{post.authorName}</span>
                    </div>
                    <button className="text-rose-500">
                      <Heart size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {posts?.length === 0 && (
              <div className="col-span-full text-center py-20">
                <p className="text-stone-400 text-sm">暂无相关领养信息</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Post Modal - Bottom Sheet Style */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] shadow-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">发布领养信息</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-stone-100 rounded-full">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 ml-1">宠物昵称</label>
                    <input name="petName" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 text-sm" placeholder="如：球球" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 ml-1">宠物类型</label>
                    <select name="petType" className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 text-sm appearance-none">
                      <option value="dog">狗狗</option>
                      <option value="cat">猫猫</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 ml-1">品种</label>
                    <input name="breed" className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 text-sm" placeholder="如：金毛" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 ml-1">年龄</label>
                    <input name="age" className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 text-sm" placeholder="如：2岁" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 ml-1">故事 & 性格描述</label>
                  <textarea name="description" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 h-32 text-sm resize-none" placeholder="介绍一下它的性格、健康状况和领养要求..." />
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl flex gap-3 items-start border border-rose-100">
                  <Info size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-rose-700 leading-relaxed">
                    发布后，系统将自动匹配附近有领养意向的用户。请确保信息真实，并对领养者进行必要的背景审核。
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : '确认发布'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
