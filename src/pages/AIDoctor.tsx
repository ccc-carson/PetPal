import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { GoogleGenAI } from '@google/genai';
import { Send, Stethoscope, Loader2, Bot, User, Sparkles, Info, ChevronLeft } from 'lucide-react';
import Auth from '../components/Auth';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AdSimulator from '../components/AdSimulator';

export default function AIDoctor() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showAd, setShowAd] = React.useState(false);
  const [hasUnlockedReport, setHasUnlockedReport] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: userMessage,
        config: {
          systemInstruction: '你是一位专业的宠物医生。请根据用户描述的宠物症状提供初步的健康建议。你的回答应该专业、亲切，并始终提醒用户：AI 建议不能替代线下兽医的专业诊断。如果遇到紧急情况，请务必立即前往宠物医院。',
        },
      });

      const aiResponse = response.text || '抱歉，我暂时无法回答这个问题。';
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: '医生现在有点忙，请稍后再试。' }]);
    } finally {
      setLoading(false);
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
            <h1 className="text-sm font-bold text-stone-900">AI 宠物医生</h1>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-stone-400 font-medium">在线咨询中</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold">
          <Sparkles size={12} /> Gemini Pro
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pt-20 pb-32 px-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-purple-100 rounded-[2rem] flex items-center justify-center text-purple-600 shadow-xl shadow-purple-100/50">
              <Bot size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-stone-800 tracking-tight">我是您的 AI 宠物健康助手</h2>
              <p className="text-xs text-stone-400 max-w-[200px] mx-auto leading-relaxed">
                您可以描述宠物的症状，我会为您提供初步的健康建议。
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              {['狗狗不吃东西怎么办？', '猫咪疫苗接种时间表？', '宠物换粮需要注意什么？'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-4 py-3 bg-white border border-stone-100 rounded-2xl text-xs text-stone-600 font-bold hover:bg-stone-50 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-stone-900 text-white' : 'bg-white text-purple-600 border border-stone-100'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-stone-900 text-white rounded-tr-none' 
                  : 'bg-white text-stone-800 rounded-tl-none border border-stone-100'
              }`}>
                <div className="markdown-body text-sm leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-purple-600 flex items-center justify-center border border-stone-100 shadow-sm">
              <Bot size={20} />
            </div>
            <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-stone-100 shadow-sm">
              <Loader2 className="animate-spin text-purple-600" size={20} />
            </div>
          </div>
        )}

        {messages.length > 0 && !loading && !hasUnlockedReport && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl text-white shadow-xl shadow-purple-500/20 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-purple-200" />
              <h4 className="font-black">解锁深度诊断报告</h4>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              观看一段短视频，即可获取由 AI 生成的详细健康评估、饮食建议及线下就医指南。
            </p>
            <button 
              onClick={() => setShowAd(true)}
              className="w-full py-3 bg-white text-purple-600 font-black rounded-xl text-sm shadow-lg hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              立即观看并解锁报告
            </button>
          </motion.div>
        )}

        {hasUnlockedReport && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-white border-2 border-purple-500 rounded-3xl space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <Sparkles size={20} />
                <h4 className="font-black">深度诊断报告已解锁</h4>
              </div>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-black rounded uppercase">Premium</span>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase">风险评估</p>
                <p className="text-xs font-bold text-stone-700">低风险 - 建议居家观察 24 小时</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase">护理方案</p>
                <p className="text-xs text-stone-600 leading-relaxed">
                  1. 禁食 6-8 小时，少量多次饮水<br/>
                  2. 保持环境安静，避免剧烈运动<br/>
                  3. 记录排泄物形态及次数
                </p>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-md border-t border-stone-100">
        {/* Warning */}
        <div className="mb-3 px-4 py-2 bg-amber-50 rounded-xl flex gap-2 items-center border border-amber-100">
          <Info size={14} className="text-amber-600 shrink-0" />
          <p className="text-[9px] text-amber-800 leading-tight font-medium">
            免责声明：AI 建议仅供参考，不能替代专业兽医诊断。紧急情况请立即就医。
          </p>
        </div>

        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="描述宠物的症状或问题..."
              className="w-full pl-5 pr-12 py-4 bg-stone-100 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center hover:bg-purple-700 transition-all disabled:opacity-50 disabled:bg-stone-300 shadow-lg shadow-purple-600/20"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
      <AnimatePresence>
        {showAd && (
          <AdSimulator 
            type="rewarded" 
            onClose={() => setShowAd(false)} 
            onReward={() => setHasUnlockedReport(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
