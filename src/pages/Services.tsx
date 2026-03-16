import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  Timestamp, 
  where, 
  limit, 
  startAfter, 
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { PawPrint, MapPin, Calendar, DollarSign, Plus, Loader2, ChevronLeft, ChevronRight, Clock, Search, Filter, X } from 'lucide-react';
import Auth from '../components/Auth';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useJsApiLoader, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

// Haversine formula to calculate distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const PAGE_SIZE = 5;

interface MapSelectorProps {
  apiKey: string;
  selectedAddress: string;
  setSelectedAddress: (addr: string) => void;
  selectedCoords: { lat: number, lng: number } | null;
  setSelectedCoords: (coords: { lat: number, lng: number } | null) => void;
  userLocation: { lat: number, lng: number } | null;
  onMapClick: (e: google.maps.MapMouseEvent) => void;
  onPlaceChanged: () => void;
  autocompleteRef: React.MutableRefObject<google.maps.places.Autocomplete | null>;
}

function MapSelector({ 
  apiKey, 
  selectedAddress, 
  setSelectedAddress, 
  selectedCoords, 
  setSelectedCoords,
  userLocation,
  onMapClick,
  onPlaceChanged,
  autocompleteRef
}: MapSelectorProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  });

  return (
    <div className="space-y-4">
      {isLoaded ? (
        <Autocomplete
          onLoad={(ref) => (autocompleteRef.current = ref)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="输入详细地址或搜索..."
            value={selectedAddress}
            required
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </Autocomplete>
      ) : (
        <input
          type="text"
          placeholder="输入详细地址..."
          value={selectedAddress}
          required
          onChange={(e) => setSelectedAddress(e.target.value)}
          className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
        />
      )}

      {loadError ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-[10px]">
          <p className="font-bold mb-1">地图服务配置错误</p>
          <p className="mb-2">错误代码: {loadError.message || 'ApiProjectMapError'}</p>
          <p>这通常是因为您的 Google Cloud 项目未启用 <b>Maps JavaScript API</b>。请前往 Google Cloud Console 启用该 API 并确保 API Key 已授权。</p>
          <p className="mt-1 font-medium text-stone-500">提示：您仍可以手动输入地址完成发布。</p>
        </div>
      ) : !isLoaded ? (
        <div className="h-48 bg-stone-50 rounded-2xl animate-pulse flex items-center justify-center">
          <p className="text-stone-400 text-sm">地图加载中...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-48 w-full rounded-2xl overflow-hidden border border-stone-100">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={selectedCoords || userLocation || { lat: 39.9042, lng: 116.4074 }}
              zoom={15}
              onClick={onMapClick}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
              }}
            >
              {selectedCoords && <Marker position={selectedCoords} />}
            </GoogleMap>
          </div>
          <p className="text-[10px] text-stone-400">提示：可以在地图上点击微调位置</p>
        </div>
      )}
    </div>
  );
}

export default function Services() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'sitting' | 'boarding'>('sitting');
  const [isAdding, setIsAdding] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<{ lat: number, lng: number } | null>(null);
  
  // Map selection state
  const [selectedAddress, setSelectedAddress] = React.useState('');
  const [selectedCoords, setSelectedCoords] = React.useState<{ lat: number, lng: number } | null>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);

  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

  // Pagination state
  const [requests, setRequests] = React.useState<any[]>([]);
  const [lastDoc, setLastDoc] = React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] = React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [hasNextPage, setHasNextPage] = React.useState(false);

  // Fetch user's pets for the dropdown
  const [userPets, setUserPets] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (user) {
      const q = query(collection(db, 'pets'), where('ownerId', '==', user.uid));
      getDocs(q).then(snapshot => {
        setUserPets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [user]);

  // Get user location on mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          setSelectedCoords(coords);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setSelectedCoords({ lat, lng });
        setSelectedAddress(place.formatted_address || '');
      }
    }
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedCoords({ lat, lng });
      
      // Reverse geocoding to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setSelectedAddress(results[0].formatted_address);
        }
      });
    }
  };

  const fetchRequests = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    if (!user) return;
    setIsInitialLoading(true);
    
    try {
      let q = query(
        collection(db, 'serviceRequests'),
        where('type', '==', activeTab),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE + 1)
      );

      if (direction === 'next' && lastDoc) {
        q = query(
          collection(db, 'serviceRequests'),
          where('type', '==', activeTab),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE + 1)
        );
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      const hasMore = docs.length > PAGE_SIZE;
      const pageDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;
      
      setRequests(pageDocs.map(d => ({ id: d.id, ...d.data() })));
      setLastDoc(pageDocs[pageDocs.length - 1]);
      setFirstDoc(pageDocs[0]);
      setHasNextPage(hasMore);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests('initial');
  }, [user, activeTab]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !selectedCoords || !selectedAddress) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const petId = formData.get('petId');
      const pet = userPets.find(p => p.id === petId);

      const newRequest = {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        petId: petId,
        petName: pet?.name || '未知宠物',
        petPhoto: pet?.photo || null,
        type: formData.get('type'),
        startDate: Timestamp.fromDate(new Date(formData.get('startDate') as string)),
        endDate: Timestamp.fromDate(new Date(formData.get('endDate') as string)),
        budget: Number(formData.get('budget')),
        address: selectedAddress,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        status: 'pending',
        description: formData.get('description'),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'serviceRequests'), newRequest);
      setIsAdding(false);
      setSelectedAddress('');
      fetchRequests('initial');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'serviceRequests');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (start: any, end: any, daily: number) => {
    if (!start || !end) return 0;
    const startDate = start.toDate();
    const endDate = end.toDate();
    const days = Math.max(1, differenceInDays(endDate, startDate));
    return days * daily;
  };

  if (!user) return <Auth />;

  return (
    <div className="pb-20 bg-stone-50 min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-4 py-3 space-y-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black italic tracking-tight text-stone-900">服务大厅</h1>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-500/20"
          >
            <Plus size={14} /> 发布需求
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-stone-100 rounded-2xl w-full">
          <button
            onClick={() => setActiveTab('sitting')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sitting' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'
            }`}
          >
            上门喂养
          </button>
          <button
            onClick={() => setActiveTab('boarding')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'boarding' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500'
            }`}
          >
            家庭寄养
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-stone-100 rounded-full text-[10px] font-bold text-stone-600">
          <Filter size={12} /> 筛选
        </button>
        <button className="px-4 py-1.5 bg-white border border-stone-100 rounded-full text-[10px] font-bold text-stone-600">
          距离最近
        </button>
        <button className="px-4 py-1.5 bg-white border border-stone-100 rounded-full text-[10px] font-bold text-stone-600">
          价格最低
        </button>
      </div>

      {/* Requests List */}
      <div className="px-3 space-y-3">
        {isInitialLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : (
          <div className="grid gap-3">
            {requests.map((req: any) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={req.id}
                onClick={() => navigate(`/service/${req.id}`)}
                className="bg-white rounded-[2rem] p-5 shadow-sm border border-stone-100 active:scale-[0.98] transition-all"
              >
                <div className="flex gap-4">
                  <div className="relative">
                    <img 
                      src={req.petPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.userId}`} 
                      alt={req.petName} 
                      className="w-16 h-16 rounded-2xl bg-stone-50 object-cover border border-stone-50"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                      <img src={req.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.userId}`} alt="Owner" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-stone-900 truncate">{req.petName}</h3>
                      <p className="text-emerald-600 font-black text-sm">¥{req.budget}<span className="text-[10px] font-normal text-stone-400">/天</span></p>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                      <div className="flex items-center gap-1 text-stone-400 text-[10px] font-bold">
                        <Calendar size={10} />
                        {req.startDate && req.endDate ? (
                          `${format(req.startDate.toDate(), 'MM/dd')} - ${format(req.endDate.toDate(), 'MM/dd')}`
                        ) : '日期未设置'}
                      </div>
                      <div className="flex items-center gap-1 text-stone-400 text-[10px] font-bold">
                        <MapPin size={10} />
                        {userLocation && req.lat && req.lng ? (
                          `${getDistance(userLocation.lat, userLocation.lng, req.lat, req.lng).toFixed(1)}km`
                        ) : '未知距离'}
                      </div>
                    </div>

                    <p className="text-[10px] text-stone-500 line-clamp-1 bg-stone-50 p-2 rounded-lg">
                      {req.description || '暂无备注说明...'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-stone-50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[9px] text-stone-300">
                    <Clock size={10} />
                    <span>{req.updatedAt ? format(req.updatedAt.toDate(), 'HH:mm', { locale: zhCN }) : '刚刚'}更新</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat/${req.userId}`);
                    }}
                    className="px-6 py-1.5 bg-stone-900 text-white text-[10px] font-bold rounded-full shadow-lg shadow-stone-900/10"
                  >
                    立即沟通
                  </button>
                </div>
              </motion.div>
            ))}
            
            {requests.length > 0 && hasNextPage && (
              <button 
                onClick={() => fetchRequests('next')}
                className="w-full py-4 text-stone-400 text-xs font-bold"
              >
                加载更多...
              </button>
            )}

            {requests.length === 0 && (
              <div className="text-center py-20">
                <p className="text-stone-400 text-sm">该分类下暂无需求</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Request Modal - Bottom Sheet Style */}
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
                <h2 className="text-xl font-bold">发布服务需求</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-stone-100 rounded-full">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 ml-1">选择宠物</label>
                  {userPets.length > 0 ? (
                    <select name="petId" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm appearance-none">
                      <option value="">请选择您的宠物...</option>
                      {userPets.map(pet => (
                        <option key={pet.id} value={pet.id}>{pet.name} ({pet.type === 'dog' ? '狗狗' : '猫猫'})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-[10px] text-amber-700 mb-2">您还没有添加宠物档案，请先添加宠物再发布需求。</p>
                      <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="text-[10px] font-bold text-amber-800 underline"
                      >
                        前往个人中心添加宠物 →
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 ml-1">开始日期</label>
                    <input type="date" name="startDate" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 ml-1">结束日期</label>
                    <input type="date" name="endDate" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 ml-1">详细地址</label>
                  <MapSelector
                    apiKey={apiKey}
                    selectedAddress={selectedAddress}
                    setSelectedAddress={setSelectedAddress}
                    selectedCoords={selectedCoords}
                    setSelectedCoords={setSelectedCoords}
                    userLocation={userLocation}
                    onMapClick={onMapClick}
                    onPlaceChanged={onPlaceChanged}
                    autocompleteRef={autocompleteRef}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 ml-1">单价 (元/天)</label>
                  <input type="number" name="budget" required className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" placeholder="如：50" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 ml-1">备注说明</label>
                  <textarea name="description" className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none h-24 text-sm resize-none" placeholder="特殊要求，如：需要喂药、拍照等" />
                </div>

                <button
                  type="submit"
                  disabled={loading || userPets.length === 0}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : '发布需求'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
