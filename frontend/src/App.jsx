import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ContactPage from './pages/ContactPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Job Pages
import JobListPage from './pages/jobs/JobListPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import EditJobPage from './pages/jobs/EditJobPage';

// Profile Pages
import TalentListPage from './pages/profiles/TalentListPage';
import MyProfilePage from './pages/profiles/MyProfilePage';
import TalentProfilePage from './pages/profiles/TalentProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VIPPage from './pages/VIPPage';

// Chat Pages
import ChatPage from './pages/chat/ChatPage';

// Wallet Pages
import WalletPage from './pages/WalletPage';

// Notification Pages
import NotificationsPage from './pages/NotificationsPage';
import BroadcastPage from './pages/admin/BroadcastPage';

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Router>
                    <div className="min-h-screen bg-slate-50 flex flex-col">
                        <Navbar />

                        <main className="flex-grow flex flex-col">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />

                                {/* Admin Routes */}
                                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                                <Route path="/contact" element={<ContactPage />} />

                                {/* Job Routes */}
                                <Route path="/jobs" element={<JobListPage />} />
                                <Route path="/jobs/create" element={<CreateJobPage />} />
                                <Route path="/jobs/:id/edit" element={<EditJobPage />} />
                                <Route path="/jobs/:id" element={<JobDetailPage />} />

                                {/* Profile Routes */}
                                <Route path="/talents" element={<TalentListPage />} />
                                <Route path="/profile" element={<MyProfilePage />} />
                                <Route path="/talents/:id" element={<TalentProfilePage />} />

                                <Route path="/wallet" element={<WalletPage />} />

                                {/* Notification routes */}
                                <Route path="/notifications" element={<NotificationsPage />} />
                                <Route path="/admin/broadcast" element={<BroadcastPage />} />

                                {/* VIP Routes */}
                                <Route path="/vip" element={<VIPPage />} />

                                {/* Chat Route */}
                                <Route path="/chat" element={<ChatPage />} />
                            </Routes>
                        </main>

                        <Footer />
                    </div>
                </Router>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
