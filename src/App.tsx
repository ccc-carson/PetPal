import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Adoption from './pages/Adoption';
import Community from './pages/Community';
import AIDoctor from './pages/AIDoctor';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import MoodScanner from './pages/MoodScanner';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/mood-scanner" element={<MoodScanner />} />
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/adoption" element={<Adoption />} />
              <Route path="/community" element={<Community />} />
              <Route path="/ai-doctor" element={<AIDoctor />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:userId" element={<Chat />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}
