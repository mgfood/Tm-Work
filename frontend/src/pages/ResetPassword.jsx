import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowLeft, RefreshCw, Key } from 'lucide-react';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        code: '',
        password: '',
        password_confirm: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirm) {
            setError('Пароли не совпадают');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await apiClient.post('/auth/password-reset/confirm/', formData);
            showToast('Пароль успешно изменен', 'success');
            navigate('/login');
        } catch (err) {
            const errorData = err.response?.data;
            if (typeof errorData === 'object') {
                const message = Object.values(errorData).flat().join(', ');
                setError(message);
            } else {
                setError('Ошибка при сбросе пароля. Проверьте код и попробуйте снова.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center px-6 py-12 bg-slate-50">
            <div className="w-full max-w-md">
                <Link to="/forgot-password" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-6 transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Назад к запросу кода</span>
                </Link>

                <div className="premium-card p-10 animate-in fade-in zoom-in duration-500">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">Новый пароль</h2>
                        <p className="text-slate-500 mt-2">Введите код из письма и ваш новый пароль</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 animate-in shake-x">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                readOnly={!!location.state?.email}
                                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all ${location.state?.email ? 'text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary-500'}`}
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Код подтверждения (6 цифр)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="code"
                                    required
                                    maxLength="6"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="000000"
                                    value={formData.code}
                                    onChange={handleChange}
                                />
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Новый пароль</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-slate-700">Подтвердите пароль</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password_confirm"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary py-4 flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <RefreshCw className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>Сбросить пароль</span>
                                    <ShieldCheck size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
