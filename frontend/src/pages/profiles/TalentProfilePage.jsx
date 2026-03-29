import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    User, MapPin, Star, Mail, Briefcase, Clock,
    ArrowLeft, MessageSquare, ShieldCheck,
    Send, Instagram, Github, Linkedin, Eye as View,
    Image as ImageIcon, Link as LinkIcon, ExternalLink,
    Award, CheckCircle, Globe, Zap
} from 'lucide-react';
import profilesService from '../../api/profilesService';
import chatService from '../../api/chatService';
import reviewsService from '../../api/reviewsService';
import ReviewCard from '../../components/reviews/ReviewCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TalentProfilePage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [profile, setProfile] = useState(null);
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [profileData, portfolioData, reviewsData] = await Promise.all([
                    profilesService.getProfileByUserId(id),
                    profilesService.getPortfolioItems(id),
                    reviewsService.getReviews(id)
                ]);
                setProfile(profileData);
                setPortfolioItems(portfolioData.results || portfolioData);
                setReviews(reviewsData.results || reviewsData);
            } catch (err) {
                setError(t('profile.notFoundError'));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, t]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="h-64 bg-slate-200 animate-pulse"></div>
            <div className="max-w-7xl mx-auto px-6 -mt-16">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="lg:w-80 h-96 bg-white rounded-[40px] shadow-sm animate-pulse"></div>
                    <div className="flex-grow space-y-8">
                        <div className="h-12 w-1/3 bg-white rounded-2xl animate-pulse"></div>
                        <div className="h-64 bg-white rounded-[40px] animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
            <div className="text-center">
                <div className="w-24 h-24 bg-white rounded-[40px] shadow-xl flex items-center justify-center mx-auto mb-8">
                    <User size={48} className="text-slate-200" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">{t('profile.notFoundTitle')}</h2>
                <button onClick={() => navigate('/talents')} className="btn-primary px-8 py-4 rounded-2xl">
                    {t('profile.backToList')}
                </button>
            </div>
        </div>
    );

    const displayName = (profile.user.first_name || profile.user.last_name)
        ? `${profile.user.first_name || ''} ${profile.user.last_name || ''}`.trim()
        : profile.user.email;

    return (
        <div className="bg-slate-50/50 min-h-screen pb-24">
            {/* Extended Header / Banner */}
            <div className="h-64 md:h-80 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-primary-600 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-blue-600 rounded-full blur-[120px]"></div>
                </div>
                <div className="max-w-7xl mx-auto px-6 h-full flex items-end pb-24">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-all font-bold text-sm border border-white/10 mb-2"
                    >
                        <ArrowLeft size={18} /> {t('common.back')}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-12 -mt-20 relative z-10">
                    
                    {/* Left Sticky Sidebar */}
                    <aside className="lg:w-80 shrink-0">
                        <div className="sticky top-24 space-y-6">
                            {/* Profile Card */}
                            <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 text-center">
                                <div className="relative mb-8 inline-block">
                                    <div className="w-32 h-32 bg-white rounded-[40px] p-1.5 shadow-2xl ring-8 ring-white/10">
                                        <div className="w-full h-full bg-slate-100 rounded-[35px] flex items-center justify-center overflow-hidden">
                                            {profile.avatar ? (
                                                <img
                                                    src={profile.avatar.startsWith('http') ? profile.avatar : (profile.avatar.startsWith('/') ? profile.avatar : `/${profile.avatar}`)}
                                                    alt={profile.user.first_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User size={64} className="text-slate-300" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
                                </div>

                                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                                    {displayName}
                                </h1>
                                
                                <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">
                                    <MapPin size={14} className="text-primary-500" />
                                    {profile.location || t('profile.defaultLocation')}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100/50">
                                        <div className="flex items-center justify-center gap-1 text-amber-700 font-black text-xl mb-0.5">
                                            <Star size={18} fill="currentColor" />
                                            {profile.freelancer_rating || '5.0'}
                                        </div>
                                        <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest">{t('profile.reviews')}</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100/50">
                                        <div className="flex items-center justify-center gap-1 text-blue-700 font-black text-xl mb-0.5">
                                            <Zap size={18} fill="currentColor" />
                                            {profile.completed_works_count || 0}
                                        </div>
                                        <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">{t('talentList.worksCount')}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {user?.id !== profile.user.id ? (
                                        user ? (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const thread = await chatService.getOrCreateThread(profile.user.id, 'PERSONAL');
                                                        navigate(`/chat/${thread.id}`);
                                                    } catch (e) {
                                                        showToast(e.response?.data?.error || t('profile.chatError'), 'error');
                                                    }
                                                }}
                                                className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-600/20 active:scale-95 transition-all text-lg"
                                            >
                                                <MessageSquare size={22} /> {t('profile.sendMessage')}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate('/register')}
                                                className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-600/30 active:scale-95 transition-all text-lg font-bold"
                                            >
                                                <User size={22} /> {t('common.register', 'Регистрация')}
                                            </button>
                                        )
                                    ) : (
                                        <Link to="/settings/profile" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all">
                                            <User size={20} /> {t('profile.editMyProfile')}
                                        </Link>
                                    )}
                                    {profile.is_verified && (
                                        <div className="flex items-center justify-center gap-2 text-[10px] text-green-600 font-black uppercase tracking-[0.2em] pt-4">
                                            <ShieldCheck size={16} /> {t('profile.verifiedSpecialist')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info Card */}
                            {profile.social_links && Object.values(profile.social_links).some(v => v) && (
                                <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-6">{t('profile.socialNetworks')}</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {profile.social_links.telegram && (
                                            <a href={`https://t.me/${profile.social_links.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 hover:bg-sky-50 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 text-slate-400 hover:text-sky-600 transition-all">
                                                <Send size={24} />
                                                <span className="text-[10px] font-black">TELEGRAM</span>
                                            </a>
                                        )}
                                        {profile.social_links.instagram && (
                                            <a href={`https://instagram.com/${profile.social_links.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 hover:bg-pink-50 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 text-slate-400 hover:text-pink-600 transition-all">
                                                <Instagram size={24} />
                                                <span className="text-[10px] font-black">INSTAGRAM</span>
                                            </a>
                                        )}
                                        {profile.social_links.github && (
                                            <a href={`https://github.com/${profile.social_links.github}`} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 hover:bg-slate-900 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 text-slate-400 hover:text-white transition-all">
                                                <Github size={24} />
                                                <span className="text-[10px] font-black">GITHUB</span>
                                            </a>
                                        )}
                                        {profile.social_links.linkedin && (
                                            <a href={`https://linkedin.com/in/${profile.social_links.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 hover:bg-blue-700 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 text-slate-400 hover:text-white transition-all">
                                                <Linkedin size={24} />
                                                <span className="text-[10px] font-black">LINKEDIN</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-grow space-y-12 pb-24">
                        {/* Bio / About */}
                        <section className={`bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden transition-all duration-700 ${!user ? 'blur-[4px] select-none pointer-events-none grayscale-[50%]' : ''}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-bl-[100px] -mr-8 -mt-8"></div>
                            <h2 className="text-sm font-black text-primary-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                                <Award size={20} /> {t('profile.aboutSpecialist')}
                            </h2>
                            <p className="text-xl text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                                {profile.bio || t('profile.emptyBio')}
                            </p>
                        </section>

                        {/* Skills */}
                        <section className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h2 className="text-sm font-black text-primary-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                                <CheckCircle size={20} /> {t('profile.professionalSkills')}
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {profile.skills?.length > 0 ? (
                                    profile.skills.map(skill => (
                                        <div key={skill.id} className="group px-6 py-4 bg-slate-50 hover:bg-primary-600 border border-slate-100 hover:border-primary-600 text-slate-700 hover:text-white font-black text-sm rounded-2xl transition-all flex items-center gap-3 cursor-default">
                                            <div className="w-2 h-2 bg-primary-400 rounded-full group-hover:bg-white transition-colors"></div>
                                            {skill.name}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 italic">{t('profile.noSkills')}</p>
                                )}
                            </div>
                        </section>

                        {/* Stats Detail Grid */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 flex items-center gap-6 group hover:translate-x-2 transition-transform">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[20px] flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('profile.stats.onPlatform')}</p>
                                    <p className="text-2xl font-black text-slate-900">
                                        {t('profile.stats.since')} {new Date(profile.user.date_joined).getFullYear()}
                                    </p>
                                </div>
                            </div>
                            {profile.experience_years > 0 && (
                                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 flex items-center gap-6 group hover:translate-x-2 transition-transform">
                                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[20px] flex items-center justify-center shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <Briefcase size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('profile.stats.experience')}</p>
                                        <p className="text-2xl font-black text-slate-900">{profile.experience_years} {t('profile.stats.years')}</p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Portfolio */}
                        {portfolioItems.length > 0 && (
                            <section className={`relative transition-all duration-700 ${!user ? 'blur-[4px] select-none pointer-events-none grayscale-[50%]' : ''}`}>
                                <div className="flex justify-between items-end mb-8">
                                    <h2 className="text-sm font-black text-primary-600 uppercase tracking-[0.2em] flex items-center gap-4">
                                        <ImageIcon size={20} /> {t('profile.portfolio')}
                                    </h2>
                                    <span className="text-slate-400 text-xs font-black">{portfolioItems.length} {t('profile.projects')}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    {portfolioItems.map(item => (
                                        <div key={item.id} className="bg-white rounded-[40px] overflow-hidden group hover:shadow-2xl hover:shadow-primary-600/10 transition-all duration-500 border border-slate-100">
                                            <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                                                    {item.url && (
                                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="self-end p-4 bg-white text-primary-600 rounded-2xl shadow-2xl hover:scale-110 transition-transform mb-4">
                                                            <ExternalLink size={24} />
                                                        </a>
                                                    )}
                                                    <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                                                    <p className="text-slate-300 text-sm line-clamp-2">{item.description}</p>
                                                </div>
                                            </div>
                                            <div className="p-8 lg:hidden">
                                                <h4 className="text-lg font-bold text-slate-900 mb-2 truncate group-hover:text-primary-600 transition-colors">{item.title}</h4>
                                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Reviews */}
                        <section className={`bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative transition-all duration-700 ${!user ? 'blur-[4px] select-none pointer-events-none grayscale-[50%]' : ''}`}>
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-sm font-black text-primary-600 uppercase tracking-[0.2em] flex items-center gap-4">
                                    <MessageSquare size={20} /> {t('profile.reviews')}
                                </h2>
                                <div className="flex items-center gap-2 text-xl font-black text-slate-900">
                                    <Star size={24} fill="#f59e0b" className="text-amber-500" />
                                    {profile.freelancer_rating || '5.0'}
                                </div>
                            </div>
                            <div className="space-y-8">
                                {reviews.length > 0 ? (
                                    reviews.map(review => (
                                        <ReviewCard key={review.id} review={review} />
                                    ))
                                ) : (
                                    <div className="text-center py-16 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                                        <Star size={48} className="mx-auto text-slate-200 mb-6" />
                                        <p className="text-slate-400 font-bold italic">{t('profile.noReviews')}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                        
                        {/* Teaser Overlay for Guests */}
                        {!user && (
                            <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center p-6">
                                {/* The background is not blurred globally to preserve the top header visibility, just a subtle dark gradient at bottom */}
                                <div className="absolute inset-x-0 bottom-0 top-[40%] bg-gradient-to-t from-slate-50/90 to-transparent pointer-events-auto"></div>
                                <div className="bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl max-w-lg w-full text-center border-2 border-white pointer-events-auto animate-in fade-in slide-in-from-bottom-10 duration-700 relative z-10 m-auto">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-blue-600/5 rounded-[40px]"></div>
                                    <div className="relative">
                                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary-600/20 transform -rotate-6">
                                            <View size={36} className="rotate-3" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{t('profile.teaserTitle', 'Полный доступ')}</h2>
                                        <p className="text-slate-600 font-medium leading-relaxed mb-8">
                                            {t('profile.teaserDesc', 'Зарегистрируйтесь, чтобы увидеть полное портфолио специалиста, прочитать все отзывы клиентов и начать безопасное сотрудничество на платформе.')}
                                        </p>
                                        <div className="space-y-4">
                                            <button onClick={() => navigate('/register')} className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-600/30 font-bold transition-all hover:scale-[1.02] active:scale-95 text-lg">
                                                {t('common.register', 'Регистрация')}
                                            </button>
                                            <button onClick={() => navigate('/login')} className="w-full bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-100 py-4 rounded-2xl font-bold transition-all hover:border-slate-300">
                                                {t('common.login', 'Уже есть аккаунт? Войти')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default TalentProfilePage;