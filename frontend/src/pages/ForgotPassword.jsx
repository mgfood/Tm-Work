import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import apiClient from '../api/client';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSent, setIsSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            const response = await apiClient.post('/auth/password-reset/request/', { email });
            const targetEmail = response.data.email;

            const [userPart, domainPart] = targetEmail.split('@');
            const masked = userPart.length > 2
                ? `${userPart[0]}***${userPart[userPart.length - 1]}@${domainPart}`
                : `***@${domainPart}`;

            setMessage(`${t('forgotPassword.success_message_prefix')} ${masked}`);
            setIsSent(true);

            setTimeout(() => {
                navigate('/reset-password', { state: { email: targetEmail } });
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.email?.[0] || t('forgotPassword.error_generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center px-6 py-12 bg-slate-50">
            <div className="w-full max-w-md">
                <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-6 transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">{t('forgotPassword.back_to_login')}</span>
                </Link>

                <div className="premium-card p-10 animate-in fade-in zoom-in duration-500">
                    <div className="text-center mb-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-500 ${isSent ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'}`}>
                            {isSent ? <CheckCircle size={32} /> : <Mail size={32} />}
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">{t('forgotPassword.title')}</h2>
                        <p className="text-slate-500 mt-2">{t('forgotPassword.subtitle')}</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-in slide-in-from-top-2">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-in slide-in-from-top-2">
                            <p className="text-sm font-medium">{message}</p>
                        </div>
                    )}

                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('forgotPassword.email_label')}</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        placeholder={t('forgotPassword.email_placeholder')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? '...' : (
                                    <>
                                        <span>{t('forgotPassword.submit_button')}</span>
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-slate-600 mb-4 italic">{t('forgotPassword.redirecting')}</p>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary-500 h-full animate-progress-fast"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;