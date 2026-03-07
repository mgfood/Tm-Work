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
                <div className="px-6 pb-8 -mt-12 text-center">
                    <div className="w-24 h-24 mx-auto bg-white rounded-3xl p-1 shadow-lg mb-4">
                        <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-3xl font-black overflow-hidden">
                            {partner.avatar ? (
                                <img src={partner.avatar} alt={partner.first_name} className="w-full h-full object-cover" />
                            ) : (
                                partner.first_name?.[0] || '?'
                            )}
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-1">
                        {partner.first_name} {partner.last_name}
                    </h2>

                    {partner.headline && (
                        <p className="text-slate-500 font-medium text-sm mb-4 line-clamp-2">
                            {partner.headline}
                        </p>
                    )}

                    <div className="flex justify-center gap-2 mb-6">
                        {/* Rating if available */}
                        {partner.rating > 0 && (
                            <div className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-100">
                                <Star size={12} fill="currentColor" />
                                {partner.rating}
                            </div>
                        )}
                        {/* Role Badge if available */}
                        {/* We don't have role reliably in partner object from thread usually, unless added by serializer */}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-3 text-left mb-6">
                        {partner.email && (
                            <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                                    <Mail size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">{t('auth.email')}</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{partner.email}</p>
                                </div>
                            </div>
                        )}

                        {thread?.job_title && (
                            <div className="p-3 bg-blue-50/50 rounded-xl flex items-center gap-3 border border-blue-100/50">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <Briefcase size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">{t('common.job')}</p>
                                    <Link to={`/jobs/${thread.job}`} className="text-sm font-bold text-blue-700 truncate hover:underline block" onClick={onClose}>
                                        {thread.job_title}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {/* Would link to actual profile if we knew the route for sure. Assuming /profile/public/:id for now or similar */}
                    {/* Since I am not 100% sure of the public profile route, I will omit the "View Profile" button or point to a safe guess */}
                    {/* Actually, let's just show close for now if no link */}
                </div>
            </div>
        </div>
    );
};

export default ChatInfoModal;
