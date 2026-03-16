import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, orderBy, Timestamp, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { MessageSquare, Heart, Share2, Plus, Loader2, Image as ImageIcon, Send, X, MoreHorizontal } from 'lucide-react';
import Auth from '../components/Auth';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Community() {
  const [user] = useAuthState(auth);
  const [isAdding, setIsAdding] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const [postsSnap, postsLoading] = useCollection(
    query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'))
  );
  const posts = postsSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content: content.trim(),
        media: [`https://picsum.photos/seed/${Math.random()}/800/1000`],
        likes: [],
        createdAt: Timestamp.now(),
      });
      setContent('');
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'communityPosts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, likes: string[]) => {
    if (!user) return;
    const postRef = doc(db, 'communityPosts', postId);
    const isLiked = likes.includes(user.uid);
    
    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  if (!user) return <Auth />;

  return (
    <div className="pb-20 bg-stone-50 min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-4 py-3 flex justify-between items-center border-b border-stone-100">
        <h1 className="text-xl font-black italic tracking-tight text-stone-900">宠友圈</h1>
        <div className="flex gap-4">
          <button className="text-stone-600"><ImageIcon size={20} /></button>
          <button onClick={() => setIsAdding(true)} className="text-stone-900"><Plus size={24} /></button>
        </div>
      </div>

      {/* Posts List - Waterfall Style (Simplified for now) */}
      <div className="p-3 space-y-3">
        {postsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {posts?.map((post: any) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={post.id || Math.random()}
                className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-stone-100"
              >
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
                      alt={post.authorName} 
                      className="w-9 h-9 rounded-full bg-stone-100 border border-stone-50"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-bold text-xs text-stone-900">{post.authorName}</h3>
                      <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">
                        {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: zhCN }) : '刚刚'}
                      </p>
                    </div>
                  </div>
                  <button className="text-stone-400"><MoreHorizontal size={18} /></button>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-stone-800 leading-relaxed line-clamp-3">{post.content}</p>
                </div>
                
                {/* Post Media */}
                {post.media && post.media.length > 0 && (
                  <div className="px-2">
                    <div className="aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-stone-100">
                      <img 
                        src={post.media[0]} 
                        alt="Post media" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* Post Actions */}
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={() => handleLike(post.id, post.likes || [])}
                      className={`flex items-center gap-1.5 transition-all active:scale-125 ${
                        post.likes?.includes(user.uid) ? 'text-rose-500' : 'text-stone-400'
                      }`}
                    >
                      <Heart size={22} fill={post.likes?.includes(user.uid) ? 'currentColor' : 'none'} />
                      <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-stone-400">
                      <MessageSquare size={22} />
                      <span className="text-xs font-bold">12</span>
                    </button>
                  </div>
                  <button className="text-stone-400">
                    <Share2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAdding(true)}
        className="fixed right-6 bottom-24 w-14 h-14 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-xl z-40"
      >
        <Plus size={28} />
      </motion.button>

      {/* Add Post Modal - Full Screen Style */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] bg-white">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="h-full flex flex-col"
            >
              <div className="px-4 py-4 flex justify-between items-center border-b border-stone-50">
                <button onClick={() => setIsAdding(false)} className="text-stone-400"><X size={24} /></button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || loading}
                  className="px-6 py-2 bg-stone-900 text-white font-bold rounded-full text-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : '发布'}
                </button>
              </div>

              <div className="flex-1 p-6 space-y-6">
                <textarea
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="分享一下毛孩子的趣事吧..."
                  className="w-full text-lg text-stone-900 placeholder-stone-300 outline-none resize-none h-40"
                />
                
                <div className="grid grid-cols-3 gap-2">
                  <button className="aspect-square bg-stone-50 rounded-2xl flex flex-col items-center justify-center text-stone-400 gap-2 border-2 border-dashed border-stone-100">
                    <ImageIcon size={24} />
                    <span className="text-[10px] font-bold">添加图片</span>
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-stone-50 flex items-center gap-4 text-stone-400">
                <button className="flex items-center gap-2 text-xs font-bold"><Share2 size={16} /> 公开可见</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
