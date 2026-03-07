import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login({ email, password });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || t('login.error_invalid_credentials'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="premium-card p-10">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <LogIn size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">{t('login.title')}</h2>
                        <p className="text-slate-500 mt-2">{t('login.subtitle')}</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('login.email_label')}</label>
                            <div className="relative">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                    placeholder={t('login.email_placeholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-slate-700">{t('login.password_label')}</label>
                                <Link to="/forgot-password" size="sm" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                    {t('login.forgot_password')}
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary py-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '...' : t('login.submit_button')}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-slate-500">
                        {t('login.no_account')}{' '}
                        <Link to="/register" className="text-primary-600 font-bold hover:underline">
                            {t('login.register_link')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;