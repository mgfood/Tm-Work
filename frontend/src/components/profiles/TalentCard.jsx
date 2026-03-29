import React from 'react';
import { MapPin, Star, User, BookOpen, ShieldCheck, Briefcase, MessageSquare, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TalentCard = ({ talent }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const getSkillName = (skill) => {
        if (i18n.language?.startsWith('ru') && skill.name_ru) return skill.name_ru;
        if (i18n.language?.startsWith('tk') && skill.name_tk) return skill.name_tk;
        return skill.name;
    };

    const displayName = (talent.user.first_name || talent.user.last_name)
        ? `${talent.user.first_name || ''} ${talent.user.last_name || ''}`.trim()
        : talent.user.email;
    
    const initial = displayName ? displayName[0].toUpperCase() : '?';

    return (
        <div
            data-testid="talent-card"
            onClick={() => navigate(`/talents/${talent.user.id}`)}
            className="group premium-card p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-2xl hover:shadow-primary-600/10 hover:-translate-y-1 transition-all duration-500 border border-slate-100/50 relative overflow-hidden h-full"
        >
            {/* Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-slate-50 to-white -z-10 group-hover:from-primary-50/50 transition-colors"></div>

            {/* Avatar Section */}
            <div className="relative mb-6">
                <div className="w-24 h-24 bg-white rounded-[32px] p-1 shadow-lg ring-4 ring-white group-hover:ring-primary-50 transition-all duration-500">
                    <div className="w-full h-full bg-slate-100 rounded-[28px] flex items-center justify-center overflow-hidden">
                        {talent.avatar ? (
                            <img
                                src={talent.avatar.startsWith('http') ? talent.avatar : (talent.avatar.startsWith('/') ? talent.avatar : `/${talent.avatar}`)}
                                alt={displayName}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <span className="text-3xl font-black text-slate-300">{initial}</span>
                        )}
                    </div>
                </div>
                {/* Active Indicator */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-sm animate-in zoom-in-0 duration-500"></div>
            </div>

            {/* Title & Verified Badge */}
            <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-primary-600 transition-colors flex items-center justify-center gap-2 px-2">
                <span className="truncate">{displayName}</span>
                {talent.is_verified && (
                    <ShieldCheck size={18} className="text-primary-500 shrink-0" />
                )}
            </h3>

            {/* Headline/Location */}
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                <MapPin size={12} className="text-primary-400" />
                {talent.location || t('talentList.defaultLocation')}
            </div>

            {/* Rating & Works */}
            <div className="flex items-center justify-center gap-4 mb-6 w-full">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-black border border-amber-100/50">
                    <Star size={14} fill="currentColor" />
                    {talent.freelancer_rating || '5.0'}
                    <span className="text-amber-400 font-medium">({talent.freelancer_reviews_count || 0})</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-black border border-blue-100/50">
                    <Briefcase size={14} />
                    {talent.completed_works_count || 0} {t('talentList.worksCount')}
                </div>
            </div>

            {/* Bio Snippet */}
            <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed px-2 italic">
                {talent.bio ? `"${talent.bio}"` : t('talentList.noBio')}
            </p>

            {/* Skills Container */}
            <div className="flex-grow flex flex-wrap justify-center gap-2 mb-8">
                {talent.skills?.slice(0, 3).map(skill => (
                    <span key={skill.id} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100 group-hover:bg-white group-hover:border-primary-100 group-hover:text-primary-600 transition-all">
                        {getSkillName(skill)}
                    </span>
                ))}
                {talent.skills?.length > 3 && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg">
                        +{talent.skills.length - 3}
                    </span>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                <Link
                    to={`/talents/${talent.user.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-primary-600 transition-all shadow-lg shadow-slate-900/10 hover:shadow-primary-600/20"
                >
                    <BookOpen size={14} /> {t('talentList.viewProfile')}
                </Link>
                <Link
                    to={`/chat?user=${talent.user.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:border-primary-500 hover:text-primary-600 transition-all"
                >
                    <MessageSquare size={14} /> {t('profile.sendMessage')}
                </Link>
            </div>
        </div>
    );
};

export default TalentCard;
