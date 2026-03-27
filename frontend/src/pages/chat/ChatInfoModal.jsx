import React from 'react';
import { X, User, Star, ExternalLink, Briefcase, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ChatInfoModal = ({ isOpen, onClose, partner, thread }) => {
    const { t } = useTranslation();

    if (!isOpen || !partner) return null;

    // Determine profile link based on logic or partner data
    // Usually /freelancers/:id or /client/:id
    // But we might not knwo the role easily from just partner object in thread details sometimes
    // But let's assume standard profile link if possible, or just /profile/:id

    // In this app, profiles seem to be at /freelancers/:id (publicly?)
    // Let's check MainLayout or App.jsx to see routes.
    // For now, I'll use a generic link or assume /profile/public/:id logic if it exists.
    // Actually, earlier files showed `Link to={/jobs/${activeThread.job}}`.

    // Let's assume a generic profile route or disable link if not sure.
    // But users want to see profile.

    const displayName = (partner.first_name || partner.last_name)
        ? `${partner.first_name || ''} ${partner.last_name || ''}`.trim()
        : partner.email;
    const initial = displayName ? displayName[0].toUpperCase() : '?';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0 -z-10" onClick={onClose}></div>
            <div className="bg-white rounded-3xl w-full max-w-sm md:max-w-md shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">

                {/* Header Background */}
                <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-800 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Avatar & Basic Info */}
                <div className="px-6 pb-8 -mt-12 text-center relative">
                    <div className="w-24 h-24 mx-auto bg-white rounded-3xl p-1 shadow-xl mb-4 group ring-4 ring-white transition-all hover:scale-105">
                        <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-3xl font-black overflow-hidden relative">
                            {partner.avatar ? (
                                <img src={partner.avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : initial}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-slate-50 border border-slate-100 rounded-full mb-3">
                        <User size={12} className="text-primary-600" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{t('common.user_info')}</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                        {displayName}
                    </h2>

                    {partner.headline ? (
                        <p className="text-slate-500 font-medium text-sm mb-6 line-clamp-2 px-4">
                            {partner.headline}
                        </p>
                    ) : (
                        <div className="h-6"></div> // Spacer when no headline
                    )}

                    <div className="flex justify-center gap-3 mb-8">
                        {/* Rating if available */}
                        {partner.rating > 0 && (
                            <div className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-amber-100 shadow-sm">
                                <Star size={14} fill="currentColor" />
                                {partner.rating}
                            </div>
                        )}
                        {/* Status Badge */}
                        <div className="px-4 py-1.5 bg-green-50 text-green-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-green-100 shadow-sm">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            {t('common.active')}
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-3 text-left mb-8">
                        {partner.email && !partner.first_name && !partner.last_name && (
                            <div className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl flex items-center gap-4 border border-slate-100 transition-colors">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                    <Mail size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{t('auth.email')}</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{partner.email}</p>
                                </div>
                            </div>
                        )}

                        {thread?.job_title && (
                            <div className="p-4 bg-blue-50/50 hover:bg-blue-50 rounded-2xl flex items-center gap-4 border border-blue-100/50 transition-colors">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <Briefcase size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-blue-400 mb-0.5">{t('common.job')}</p>
                                    <Link to={`/jobs/${thread.job}`} className="text-sm font-bold text-blue-700 truncate hover:underline block" onClick={onClose}>
                                        {thread.job_title}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <Link
                        to={`/talents/${partner.id || partner.user_id || thread?.partner_id}`}
                        onClick={onClose}
                        className="w-full btn-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20 hover:scale-[1.02] transition-all"
                    >
                        <ExternalLink size={20} />
                        {t('buttons.clientProfile')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ChatInfoModal;
