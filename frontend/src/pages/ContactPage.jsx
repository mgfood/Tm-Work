import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, AlertCircle } from 'lucide-react';

const ContactPage = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus({ 
            type: 'success', 
            message: t('contact.form.success') 
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    const contactItems = [
        { icon: Mail, label: t('contact.labels.email'), value: 'support@tmwork.com' },
        { icon: Phone, label: t('contact.labels.phone'), value: '+993 (61) 12-34-56' },
        { icon: MapPin, label: t('contact.labels.address'), value: t('contact.values.address') },
        { icon: Clock, label: t('contact.labels.hours'), value: t('contact.values.hours') }
    ];

    return (
        <div className="bg-slate-50 min-h-screen pt-24 pb-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative">
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl -z-10 animate-pulse-slow delay-1000"></div>

                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter">
                        {t('contact.title')}{' '}
                        <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                            {t('contact.titleAccent')}
                        </span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        {t('contact.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Contact Info Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="premium-card p-10 bg-white/70 backdrop-blur-xl border-white shadow-2xl relative group">
                            <h3 className="text-2xl font-black mb-10 text-slate-900 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-primary-600 rounded-full"></span> 
                                {t('contact.sidebarTitle')}
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

                        {/* Prominent Support Box */}
                        <div className="premium-card p-8 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 border border-slate-100">
                            <div className="absolute top-[-40%] right-[-20%] w-60 h-60 bg-primary-50 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                                        <MessageSquare size={20} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">{t('contact.support.title')}</h3>
                                </div>
                                <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                                    {t('contact.support.description')}
                                </p>
                                <a
                                    href="https://t.me/tmwork_support_bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20 group/btn"
                                >
                                    {t('contact.support.tgButton')}
                                    <Send size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form Container */}
                    <div className="lg:col-span-8">
                        <div className="premium-card p-10 md:p-16 bg-white shadow-2xl relative border-white">
                            <div className="mb-12">
                                <h3 className="text-3xl font-black text-slate-900 mb-2">{t('contact.form.title')}</h3>
                                <p className="text-slate-400 font-medium">{t('contact.form.subtitle')}</p>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3 group">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors">
                                            {t('contact.form.nameLabel')}
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-slate-900"
                                            placeholder={t('contact.form.namePlaceholder')}
                                        />
                                    </div>
                                    <div className="space-y-3 group">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors">
                                            {t('contact.form.emailLabel')}
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-slate-900"
                                            placeholder={t('contact.form.emailPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 group">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors">
                                        {t('contact.form.subjectLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-slate-900"
                                        placeholder={t('contact.form.subjectPlaceholder')}
                                    />
                                </div>

                                <div className="space-y-3 group">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary-600 transition-colors">
                                        {t('contact.form.messageLabel')}
                                    </label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold text-slate-900 resize-none py-6 leading-relaxed"
                                        placeholder={t('contact.form.messagePlaceholder')}
                                    ></textarea>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        className="group relative overflow-hidden bg-primary-600 text-white px-12 py-5 rounded-2xl font-black text-lg transition-all hover:pr-16 hover:shadow-2xl hover:shadow-primary-600/30 active:scale-[0.98]"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            {t('contact.form.submitButton')}
                                            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </span>
                                        <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-700"></div>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;