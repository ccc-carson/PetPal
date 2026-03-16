import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { PawPrint } from 'lucide-react';

export default function Auth() {
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create user document if it doesn't exist
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-8">
        <PawPrint size={40} className="text-emerald-600" />
      </div>
      <h2 className="text-3xl font-bold mb-4 tracking-tight">欢迎来到 PetPal</h2>
      <p className="text-stone-500 mb-10 max-w-xs mx-auto">
        请登录以访问完整的宠物服务、社区和 AI 医生功能。
      </p>
      <button
        onClick={handleSignIn}
        className="px-8 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-lg flex items-center gap-3"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        使用 Google 账号登录
      </button>
    </div>
  );
}
