import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Send, MessageSquare, Clock, AlertCircle, User, MessageCircle } from 'lucide-react';
import contactService from '../api/contactService';
import { useAuth } from '../context/AuthContext';

const ContactPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    
    // Auto-fill and lock inputs if user is logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь Платформы',
                email: user.email || ''
            }));
        }
    }, [user]);

    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            // Even if API is just a mock for now, this logic will process the form properly
            const response = await contactService.sendMessage(formData);
            setStatus({ 
                type: 'success', 
                message: response.detail || 'Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.' 
            });
            // Clear only subject and message; keep name and email if logged in
            setFormData(prev => ({ ...prev, subject: '', message: '' }));
        } catch (err) {
            setStatus({ 
                type: 'error', 
                message: err.response?.data?.detail || 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactItems = [
        { icon: Mail, label: 'Email Поддержки', value: 'support@tmwork.com' },
        { icon: Phone, label: 'Телефон', value: '+993 61426142' },
        { icon: Clock, label: 'Режим работы', value: 'Пн-Пт: 10:00 - 17:00' }
    ];

    return (
        <div className="bg-slate-50 min-h-screen pt-24 pb-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative">
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl -z-10 animate-pulse-slow delay-1000"></div>

                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter">
                        Свяжитесь с <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">Нами</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        У вас есть вопросы или предложения? Наша команда экспертов всегда готова поддержать ваш проект.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Contact Info Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="premium-card p-10 bg-white/70 backdrop-blur-xl border-white shadow-2xl relative group">
                            <h3 className="text-2xl font-black mb-10 text-slate-900 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-primary-600 rounded-full"></span> 
                                Основные контакты
                            </h3>

                            <div className="space-y-10">
                                {contactItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-6 group/item cursor-default">
                                        <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-600 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 border border-slate-100 group-hover/item:rotate-6 shadow-sm">
                                            <item.icon size={26} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">
                                                {item.label}
                                            </div>
                                            <div className="text-slate-900 font-black text-lg group-hover/item:text-primary-600 transition-colors">
                                                {item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Social Media Support Box */}
                        <div className="premium-card p-8 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 border border-slate-100">
                            <div className="absolute top-[-40%] right-[-20%] w-60 h-60 bg-blue-50 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                                        <MessageCircle size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Мы в соцсетях</h3>
                                </div>
                                <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                                    Напишите нам в удобный мессенджер на номер <strong>+993 61426142</strong>. Мы всегда на связи:
                                </p>
                                <div className="flex flex-col gap-3">
                                    <a href="tel:+99361426142" className="w-full py-4 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5 text-[15px] tracking-wide" style={{ backgroundColor: '#1A5BAC', boxShadow: '0 8px 20px rgba(26,91,172,0.25)' }}>
                                        Imo
                                    </a>
                                    <a href="tel:+99361426142" className="w-full py-4 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5 text-[15px] tracking-wide" style={{ backgroundColor: '#003B8E', boxShadow: '0 8px 20px rgba(0,59,142,0.25)' }}>
                                        Link Messenger
                                    </a>
                                    <a href="tel:+99361426142" className="w-full py-4 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5 text-[15px] tracking-wide" style={{ backgroundColor: '#00C898', boxShadow: '0 8px 20px rgba(0,200,152,0.25)' }}>
                                        Start
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form Container */}
                    <div className="lg:col-span-8">
                        <div className="premium-card p-10 md:p-16 bg-white shadow-2xl relative border-white">
                            <div className="mb-12">
                                <h3 className="text-3xl font-black text-slate-900 mb-2">Отправить сообщение</h3>
                                <p className="text-slate-400 font-medium">Заполните форму и мы свяжемся с вами максимально быстро</p>
                            </div>

                            {status.message && (
                                <div className={`p-6 rounded-2xl mb-10 flex items-start gap-4 transition-all animate-in slide-in-from-top-4 duration-500 ${status.type === 'success' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
                                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${status.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {status.type === 'success' ? <Send size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <p className="font-bold py-2">{status.message}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Hide name/email explicitly if user is logged in, auto-bound in state */}
                                {!user && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors">
                                                Ваше имя
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 focus:bg-white transition-all outline-none font-medium placeholder:text-slate-300"
                                                placeholder="Имя / Название компании"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3 group">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors">
                                                Email адрес
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 focus:bg-white transition-all outline-none font-medium placeholder:text-slate-300"
                                                placeholder="example@mail.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {user && (
                                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Отправка от имени: {formData.name}</p>
                                            <p className="text-xs text-slate-500">{formData.email}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 group">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors">
                                        Тема обращения
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 focus:bg-white transition-all outline-none font-medium placeholder:text-slate-300"
                                        placeholder="С чем мы можем вам помочь?"
                                        required
                                    />
                                </div>

                                <div className="space-y-3 group">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors">
                                        Сообщение
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="5"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary-500 focus:bg-white transition-all outline-none font-medium resize-none placeholder:text-slate-300"
                                        placeholder="Опишите детали вашего вопроса..."
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-black text-lg rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group/btn"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">Отправка...</span>
                                    ) : (
                                        <>
                                            Отправить заявку
                                            <Send size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;