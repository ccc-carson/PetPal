import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Loader2, Sparkles, Heart, ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function MoodScanner() {
  const navigate = useNavigate();
  const [image, setImage] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    if (!image) return;
    setScanning(true);
    setError(null);

    try {
      const base64Data = image.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "你是一个宠物情绪专家。请分析这张宠物照片，告诉我现在它的心情如何。请以JSON格式返回，包含：mood (心情关键词), description (详细描述), advice (给主人的建议), score (心情分数 0-100)。语言请使用中文，语气要亲切幽默。" },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('扫描失败，请重试。');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-stone-900 tracking-tight">AI 宠物心情扫描仪</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Upload Area */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-stone-50 text-center">
          <div className="relative aspect-square max-w-sm mx-auto rounded-3xl bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center overflow-hidden group">
            {image ? (
              <>
                <img src={image} alt="Pet" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white/90 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2">
                    <Upload size={14} /> 更换照片
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-4 p-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Camera size={32} />
                </div>
                <div>
                  <p className="text-sm font-black text-stone-900">拍摄或上传宠物照片</p>
                  <p className="text-[10px] text-stone-400 font-bold mt-1">AI 将为您解读它的内心世界</p>
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          <button
            onClick={startScan}
            disabled={!image || scanning}
            className={`mt-8 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${
              !image || scanning 
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-95'
            }`}
          >
            {scanning ? (
              <>
                <Loader2 size={20} className="animate-spin" /> 正在解读中...
              </>
            ) : (
              <>
                <Sparkles size={20} /> 开始扫描心情
              </>
            )}
          </button>
        </section>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-stone-50 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Heart size={120} />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-xl font-black">{result.score}</span>
                    <span className="text-[8px] font-bold uppercase">Mood Score</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-stone-900">{result.mood}</h2>
                    <p className="text-xs text-stone-400 font-bold">AI 情绪解读报告</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-stone-50 rounded-2xl p-4">
                    <p className="text-sm text-stone-700 leading-relaxed font-medium">
                      {result.description}
                    </p>
                  </div>
                  
                  <div className="flex gap-3 items-start bg-emerald-50/50 rounded-2xl p-4">
                    <div className="mt-1 text-emerald-600">
                      <Info size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-700 uppercase mb-1">专家建议</p>
                      <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                        {result.advice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-3">
                <Sparkles size={16} className="text-amber-500" />
                <p className="text-[10px] text-amber-700 font-bold">
                  提示：心情扫描结果仅供参考，请多陪伴您的爱宠哦！
                </p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
