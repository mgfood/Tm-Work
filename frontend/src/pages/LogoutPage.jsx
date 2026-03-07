import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const LogoutPage = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await logout();
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                navigate('/login');
            }
        };

        performLogout();
    }, [logout, navigate]);

    return (
        <div className="flex-grow flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
                <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
                <p className="text-slate-500 font-medium">Завершение сеанса...</p>
            </div>
        </div>
    );
};

export default LogoutPage;
