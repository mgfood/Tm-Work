import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import ApiErrorInterceptor from './components/ApiErrorInterceptor';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ContactPage from './pages/ContactPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

// Job Pages
import JobListPage from './pages/jobs/JobListPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import EditJobPage from './pages/jobs/EditJobPage';
import CategoriesPage from './pages/jobs/CategoriesPage';

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

// Legal Pages
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import LogoutPage from './pages/LogoutPage';

import GlobalImpersonationBanner from './components/GlobalImpersonationBanner';

function AppContent() {
    const location = useLocation();
    const isChatRoot = location.pathname === '/chat';
    const isSpecificChat = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';
    const isChatPage = isChatRoot || isSpecificChat;

    return (
        <div className={`bg-slate-50 flex flex-col ${isChatPage ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
            <GlobalImpersonationBanner />
            <Navbar />

            <main className="flex-grow flex flex-col min-h-0 relative">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/logout" element={<LogoutPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Admin Routes */}
                    <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/contact" element={<ContactPage />} />

                    {/* Job Routes */}
                    <Route path="/jobs" element={<JobListPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/jobs/create" element={<ProtectedRoute><CreateJobPage /></ProtectedRoute>} />
                    <Route path="/jobs/:id/edit" element={<ProtectedRoute><EditJobPage /></ProtectedRoute>} />
                    <Route path="/jobs/:id" element={<JobDetailPage />} />

                    {/* Profile Routes */}
                    <Route path="/talents" element={<TalentListPage />} />
                    <Route path="/profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
                    <Route path="/talents/:id" element={<TalentProfilePage />} />

                    <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />

                    {/* Notification routes */}
                    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                    <Route path="/admin/broadcast" element={<ProtectedRoute><BroadcastPage /></ProtectedRoute>} />

                    {/* VIP Routes */}
                    <Route path="/vip" element={<ProtectedRoute><VIPPage /></ProtectedRoute>} />

                    {/* Chat Routes */}
                    <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                    <Route path="/chat/:threadId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

                    {/* Legal Routes */}
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                </Routes>
            </main>

            {!isChatPage && <Footer />}
            {!isSpecificChat && <MobileBottomNav />}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <ConfirmProvider>
                    <ApiErrorInterceptor />
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <AppContent />
                    </Router>
                </ConfirmProvider>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;

