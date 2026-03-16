import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, orderBy, Timestamp, limit, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Send, Loader2, User, ClipboardCheck, CheckCircle2, ChevronLeft, MoreHorizontal } from 'lucide-react';
import Auth from '../components/Auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
  const { userId: otherUserId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceId = searchParams.get('serviceId');
  
  const [user] = useAuthState(auth);
  const [text, setText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [serviceRequest, setServiceRequest] = React.useState<any>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Simple chat ID generation (sorted UIDs)
  const chatId = user && otherUserId ? [user.uid, otherUserId].sort().join('_') : '';

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [chatId]);

  React.useEffect(() => {
    if (serviceId) {
      getDoc(doc(db, 'serviceRequests', serviceId)).then(snap => {
        if (snap.exists()) {
          setServiceRequest({ id: snap.id, ...snap.data() });
        }
      });
    }
  }, [serviceId]);

  const [messagesSnap, messagesLoading] = useCollection(
    chatId ? query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp', 'asc'), limit(50)) : null
  );
  const messages = messagesSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateChatSession = async (lastMsg: string) => {
    if (!user || !otherUserId || !chatId) return;
    
    // Get other user info for the session list
    const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
    const otherUserData = otherUserDoc.exists() ? otherUserDoc.data() : { displayName: '宠友', photoURL: '' };

    await setDoc(doc(db, 'chatSessions', chatId), {
      participants: [user.uid, otherUserId],
      lastMessage: lastMsg,
      lastTimestamp: Timestamp.now(),
      participantInfo: {
        [user.uid]: { name: user.displayName, photo: user.photoURL },
        [otherUserId]: { name: otherUserData.displayName, photo: otherUserData.photoURL }
      }
    }, { merge: true });
  };

  const handleSend = async (e?: React.FormEvent, customText?: string, type: string = 'text') => {
    if (e) e.preventDefault();
    const messageText = customText || text;
    if (!user || !messageText.trim() || !chatId) return;

    setLoading(true);
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        senderId: user.uid,
        receiverId: otherUserId,
        text: messageText.trim(),
        type,
        serviceId: serviceId || null,
        timestamp: Timestamp.now(),
      });
      if (!customText) setText('');
      await updateChatSession(type === 'application' ? '[申请接单]' : messageText.trim());
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!serviceRequest) return;
    const applyText = `我申请接单：${serviceRequest.type === 'sitting' ? '上门喂养' : '家庭寄养'} - ${serviceRequest.petName}`;
    handleSend(undefined, applyText, 'application');
  };

  const handleConfirmOrder = async (msgId: string, sId: string) => {
    try {
      await updateDoc(doc(db, 'serviceRequests', sId), {
        status: 'in-progress',
        sitterId: otherUserId,
        updatedAt: Timestamp.now()
      });
      // Mark the message as confirmed
      await updateDoc(doc(db, `chats/${chatId}/messages`, msgId), {
        confirmed: true
      });
      handleSend(undefined, '我已确认您的接单申请，交易已开始！', 'text');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'serviceRequests');
    }
  };

  if (!user) return <Auth />;

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-stone-100 rounded-full">
            <ChevronLeft size={20} className="text-stone-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-stone-900">与宠友对话</h1>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-stone-400 font-medium">在线</span>
            </div>
          </div>
        </div>
        <button className="p-2 text-stone-400">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pt-20 pb-32 px-4 space-y-4 scrollbar-hide">
        {serviceRequest && serviceRequest.userId !== user.uid && serviceRequest.status === 'pending' && (
          <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <ClipboardCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800">正在咨询该需求</p>
                <p className="text-[10px] text-emerald-600">{serviceRequest.petName} · ¥{serviceRequest.budget}/天</p>
              </div>
            </div>
            <button 
              onClick={handleApply}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
            >
              申请接单
            </button>
          </div>
        )}

        {messagesLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-emerald-600" size={24} />
          </div>
        ) : (
          messages?.map((msg: any, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-sm text-sm ${
                msg.senderId === user.uid 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white text-stone-800 rounded-tl-none border border-stone-100'
              } ${msg.type === 'application' ? 'border-2 border-emerald-200' : ''}`}>
                {msg.type === 'application' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-bold">
                      <ClipboardCheck size={16} />
                      接单申请
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                    {serviceRequest && serviceRequest.userId === user.uid && !msg.confirmed && (
                      <button 
                        onClick={() => handleConfirmOrder(msg.id, msg.serviceId)}
                        className="w-full py-2 bg-white text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-50 transition-all border border-emerald-100"
                      >
                        确认接单
                      </button>
                    )}
                    {msg.confirmed && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-200">
                        <CheckCircle2 size={12} /> 已确认
                      </div>
                    )}
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </motion.div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-md border-t border-stone-100">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入消息..."
              className="w-full pl-5 pr-12 py-4 bg-stone-100 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:bg-stone-300 shadow-lg shadow-emerald-600/20"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
