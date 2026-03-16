import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Play, Info } from 'lucide-react';

type AdType = 'interstitial' | 'rewarded' | 'native' | 'banner';

interface AdProps {
  type: AdType;
  onClose: () => void;
  onReward?: () => void;
}

export default function AdSimulator({ type, onClose, onReward }: AdProps) {
  const [countdown, setCountdown] = React.useState(type === 'rewarded' ? 5 : 3);
  const [isFinished, setIsFinished] = React.useState(false);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsFinished(true);
    }
  }, [countdown]);

  const handleClose = () => {
    if (type === 'rewarded' && !isFinished) return;
    if (isFinished && onReward) onReward();
    onClose();
  };

  if (type === 'native') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100 flex flex-col relative group">
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-black/20 backdrop-blur-md rounded text-[8px] font-bold text-white uppercase tracking-wider">
          广告
        </div>
        <div className="relative h-40">
          <img 
            src="https://picsum.photos/seed/pet_food_ad/400/500" 
            alt="Ad" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="p-3 flex-1 flex flex-col bg-amber-50/30">
          <h4 className="text-xs font-black text-stone-800 line-clamp-2 mb-2 leading-relaxed">
            【限时特惠】皇家宠物粮，科学配比，让爱宠茁壮成长！
          </h4>
          <div className="mt-auto flex justify-between items-center">
            <span className="text-amber-600 text-[10px] font-bold">查看详情</span>
            <ExternalLink size={12} className="text-amber-400" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'banner') {
    return (
      <div className="w-full bg-stone-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <PawPrint className="text-white" size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold opacity-60">赞助商广告</p>
            <p className="text-xs font-black">PetPal 尊享会员，首月仅需 ¥1</p>
          </div>
        </div>
        <button className="px-3 py-1.5 bg-white text-black text-[10px] font-black rounded-lg">
          立即开通
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Ad Header */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button 
            onClick={handleClose}
            disabled={type === 'rewarded' && !isFinished}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${
              type === 'rewarded' && !isFinished 
                ? 'bg-black/20 text-white/40 cursor-not-allowed' 
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            {countdown > 0 ? (
              <span className="text-xs font-black px-1">{countdown}s</span>
            ) : (
              <X size={18} />
            )}
          </button>
        </div>

        {/* Ad Content */}
        <div className="aspect-[9/16] relative bg-stone-100">
          <img 
            src={`https://picsum.photos/seed/ad_fullscreen_${type}/1080/1920`} 
            alt="Ad Content" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded text-[10px] font-bold text-white uppercase">
                {type === 'rewarded' ? '激励视频' : '插屏广告'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">
              {type === 'rewarded' 
                ? '观看完整视频，解锁 AI 医生深度报告' 
                : '发现更多有趣的宠物生活方式'}
            </h2>
            <p className="text-white/60 text-sm mb-8">
              点击下方按钮，探索更多精彩内容。
            </p>
            <button className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2">
              立即探索 <ExternalLink size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PawPrint({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="11" cy="5" r="2"/><circle cx="18" cy="9" r="2"/><circle cx="7" cy="9" r="2"/><circle cx="14" cy="5" r="2"/><path d="M12 13c-2 0-4 1-4 4 0 2 2 3 4 3s4-1 4-3c0-3-2-4-4-4Z"/>
    </svg>
  );
}
