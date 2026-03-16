import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { MessageSquare, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Auth from '../components/Auth';
import { motion } from 'framer-motion';

export default function Messages() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [sessionsSnap, sessionsLoading] = useCollection(
    user ? query(collection(db, 'chatSessions'), where('participants', 'array-contains', user.uid), orderBy('lastTimestamp', 'desc')) : null
  );
  const chatSessions = sessionsSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (!user) return <Auth />;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6 px-1">
        <h1 className="text-2xl font-bold tracking-tight">我的消息</h1>
      </div>

      {sessionsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {chatSessions?.map((session: any) => {
            const otherId = session.participants.find((p: string) => p !== user.uid);
            const otherInfo = session.participantInfo?.[otherId] || { name: '宠友', photo: '' };
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={session.id}
                onClick={() => navigate(`/chat/${otherId}`)}
                className="p-4 bg-white rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-stone-50 transition-all active:scale-[0.98]"
              >
                <div className="relative">
                  <img 
                    src={otherInfo.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`} 
                    alt={otherInfo.name}
                    className="w-14 h-14 rounded-full bg-stone-50 border border-stone-100"
                  />
                  {/* Badge for unread could go here */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-base truncate text-stone-900">{otherInfo.name}</h4>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {session.lastTimestamp ? format(session.lastTimestamp.toDate(), 'MM/dd HH:mm', { locale: zhCN }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500 truncate pr-4">{session.lastMessage}</p>
                    <ChevronRight size={16} className="text-stone-300 flex-shrink-0" />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {chatSessions?.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-stone-200" />
              </div>
              <p className="text-stone-400 font-medium">暂无聊天记录</p>
              <p className="text-xs text-stone-300 mt-1">去社区或服务大厅看看吧</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
