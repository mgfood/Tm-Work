import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next'; // 1. Импортируем хук
import { UserPlus, Mail, Lock, User, AlertCircle, Briefcase, GraduationCap } from 'lucide-react';

const RegisterPage = () => {
    const { t } = useTranslation(); // 2. Инициализируем t
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        roles: ['CLIENT'],
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleToggle = (role) => {
        setFormData((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirm) {
            setError(t('auth.passwords_dont_match')); // Перевод ошибки
            return;
        }

        if (formData.roles.length === 0) {
            setError(t('auth.select_role_error')); // Перевод ошибки
            return;
        }

        setIsSubmitting(true);
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            const data = err.response?.data;
            const errorMessage = typeof data === 'object'
                ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
                : t('auth.registration_error'); // Общая ошибка
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-xl">
                <div className="premium-card p-10">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <UserPlus size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">{t('auth.create_account')}</h2>
                        <p className="text-slate-500 mt-2">{t('auth.join_community')}</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 whitespace-pre-line">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('auth.first_name')}</label>
                                <div className="relative">
                                    <input
                                        name="first_name"
                                        type="text"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        placeholder={t('auth.placeholder_first_name')}
                                        value={formData.first_name}
                                        onChange={handleChange}
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('auth.last_name')}</label>
                                <div className="relative">
                                    <input
                                        name="last_name"
                                        type="text"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        placeholder={t('auth.placeholder_last_name')}
                                        value={formData.last_name}
                                        onChange={handleChange}
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('auth.email_label')}</label>
                            <div className="relative">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">{t('auth.i_want_to_be')}</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleRoleToggle('CLIENT')}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${formData.roles.includes('CLIENT')
                                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                        }`}
                                >
                                    <Briefcase size={24} />
                                    <span className="font-bold text-sm">{t('auth.role_client')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleToggle('FREELANCER')}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${formData.roles.includes('FREELANCER')
                                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                        }`}
                                >
                                    <GraduationCap size={24} />
                                    <span className="font-bold text-sm">{t('auth.role_freelancer')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('auth.password')}</label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('auth.confirm_password')}</label>
                                <div className="relative">
                                    <input
                                        name="password_confirm"
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                        placeholder="••••••••"
                                        value={formData.password_confirm}
                                        onChange={handleChange}
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary py-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? t('auth.registering') : t('auth.create_account_btn')}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-slate-500">
                        {t('auth.already_have_account')}{' '}
                        <Link to="/login" className="text-primary-600 font-bold hover:underline">
                            {t('auth.login_link')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;