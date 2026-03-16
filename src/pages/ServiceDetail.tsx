import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  MessageCircle, 
  ChevronLeft, 
  Clock, 
  ShieldCheck, 
  Info,
  PawPrint,
  User,
  Share2,
  Heart,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { motion } from 'framer-motion';

const containerStyle = {
  width: '100%',
  height: '200px'
};

const libraries: ("places")[] = ["places"];

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [request, setRequest] = React.useState<any>(null);
  const [pet, setPet] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const reqDoc = await getDoc(doc(db, 'serviceRequests', id));
        if (reqDoc.exists()) {
          const reqData = reqDoc.data();
          setRequest({ id: reqDoc.id, ...reqData });
          
          if (reqData.petId) {
            const petDoc = await getDoc(doc(db, 'pets', reqData.petId));
            if (petDoc.exists()) {
              setPet({ id: petDoc.id, ...petDoc.data() });
            }
          }
        } else {
          setError('需求不存在或已被删除');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('加载详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-stone-500 text-sm font-medium">正在加载详情...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 gap-6 text-center px-4">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
          <AlertCircle size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">{error || '出错了'}</h2>
          <p className="text-stone-500">抱歉，我们无法找到您要查看的内容</p>
        </div>
        <button
          onClick={() => navigate('/services')}
          className="px-8 py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all"
        >
          返回服务列表
        </button>
      </div>
    );
  }

  const days = request.startDate && request.endDate 
    ? Math.max(1, differenceInDays(request.endDate.toDate(), request.startDate.toDate())) 
    : 0;

  return (
    <div className="pb-24 bg-stone-50 min-h-screen">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="p-2 bg-stone-100 rounded-full">
          <ChevronLeft size={20} className="text-stone-600" />
        </button>
        <h1 className="text-sm font-bold text-stone-900">需求详情</h1>
        <div className="flex gap-2">
          <button className="p-2 bg-stone-100 rounded-full">
            <Share2 size={18} className="text-stone-600" />
          </button>
        </div>
      </div>

      <div className="pt-16 px-4 space-y-4">
        {/* Pet Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-stone-100"
        >
          <div className="flex items-center gap-4 mb-6">
            <img 
              src={pet?.photo || request.petPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.userId}`} 
              alt={request.petName}
              className="w-20 h-20 rounded-3xl object-cover bg-stone-50 border-4 border-stone-50"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-stone-900">{request.petName}</h2>
                <span className="px-2 py-0.5 bg-stone-100 text-[10px] font-bold text-stone-500 rounded-full">
                  {request.type === 'sitting' ? '上门喂养' : '家庭寄养'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-stone-400 text-xs font-bold">
                <PawPrint size={14} className="text-emerald-500" />
                <span>{pet ? `${pet.breed} · ${pet.age}岁 · ${pet.gender}` : '待照顾的小可爱'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-stone-400 mb-1 uppercase tracking-wider">服务单价</p>
              <p className="text-xl font-black text-emerald-600">¥{request.budget}<span className="text-xs font-normal text-stone-400">/天</span></p>
            </div>
            <div className="bg-stone-50 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-stone-400 mb-1 uppercase tracking-wider">预计总额</p>
              <p className="text-xl font-black text-emerald-600">¥{days * request.budget}</p>
            </div>
          </div>
        </motion.div>

        {/* Service Details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-stone-100 space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Calendar size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 mb-0.5">服务周期</p>
                <p className="text-sm font-bold text-stone-900">
                  {format(request.startDate.toDate(), 'yyyy年MM月dd日')} - {format(request.endDate.toDate(), 'MM月dd日')}
                </p>
                <p className="text-[10px] text-emerald-600 font-bold">共计 {days} 天</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 mb-0.5">服务地点</p>
                <p className="text-sm font-bold text-stone-900 line-clamp-2">{request.address}</p>
              </div>
            </div>
          </div>

          {/* Map Preview */}
          {isLoaded && request.lat && request.lng && (
            <div className="rounded-2xl overflow-hidden border border-stone-100">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={{ lat: request.lat, lng: request.lng }}
                zoom={15}
                options={{
                  disableDefaultUI: true,
                  zoomControl: false,
                }}
              >
                <Marker position={{ lat: request.lat, lng: request.lng }} />
              </GoogleMap>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <Info size={16} className="text-stone-400" />
              备注说明
            </div>
            <p className="text-sm text-stone-500 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-50">
              {request.description || '主人很懒，暂时没有填写更多要求哦~'}
            </p>
          </div>
        </motion.div>

        {/* Publisher Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-stone-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={request.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.userId}`} 
                alt={request.userName}
                className="w-12 h-12 rounded-full object-cover bg-stone-50"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-bold text-stone-900">{request.userName}</h3>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                  <ShieldCheck size={12} />
                  <span>实名认证已通过</span>
                </div>
              </div>
            </div>
            <button className="px-4 py-1.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-full">
              查看主页
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-50">
            <div className="text-center">
              <p className="text-lg font-black text-stone-900">12</p>
              <p className="text-[10px] text-stone-400 font-bold">发布需求</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-stone-900">98%</p>
              <p className="text-[10px] text-stone-400 font-bold">好评率</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-stone-900">3</p>
              <p className="text-[10px] text-stone-400 font-bold">养宠经验</p>
            </div>
          </div>
        </motion.div>

        {/* Safety Tips */}
        <div className="px-4 py-6 text-center">
          <p className="text-[10px] text-stone-400 leading-relaxed italic">
            温馨提示：线下交易请注意安全，建议通过平台进行沟通和确认。
            如遇可疑情况请及时举报。
          </p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4 bg-white/80 backdrop-blur-md border-t border-stone-100 flex items-center gap-3">
        <button className="p-4 bg-stone-100 text-stone-600 rounded-2xl active:scale-95 transition-all">
          <Heart size={20} />
        </button>
        <button 
          onClick={() => navigate(`/chat/${request.userId}?serviceId=${request.id}`)}
          className="flex-1 py-4 bg-stone-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-stone-900/20 active:scale-[0.98] transition-all"
        >
          <MessageCircle size={20} />
          立即沟通
        </button>
      </div>
    </div>
  );
}
