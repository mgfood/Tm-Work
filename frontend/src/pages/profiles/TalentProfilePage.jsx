import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Добавьте импорт
import {
    User, MapPin, Star, Mail, Briefcase, Clock,
    ArrowLeft, MessageSquare, ShieldCheck,
    Send, Instagram, Github, Linkedin, Eye as View,
    Image as ImageIcon, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import profilesService from '../../api/profilesService';
import chatService from '../../api/chatService';
import reviewsService from '../../api/reviewsService';
import ReviewCard from '../../components/reviews/ReviewCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TalentProfilePage = () => {
    const { t } = useTranslation(); // Инициализация хука
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
        <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse">
            <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="h-10 w-1/3 bg-slate-100 rounded mx-auto mb-4"></div>
            <div className="h-64 bg-slate-50 rounded-2xl"></div>
        </div>
    );

    if (error || !profile) return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <div className="premium-card p-12">
                <User size={48} className="mx-auto text-slate-200 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900">{t('profile.notFoundTitle')}</h2>
                <Link to="/talents" className="btn-primary mt-8 inline-block">{t('profile.backToList')}</Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors font-medium">
                <ArrowLeft size={18} /> {t('common.back')}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-12 md:border-r-0 lg:border-r">
                    <div className="text-center mb-8">
                        <div className="w-32 h-32 bg-slate-100 rounded-3xl mx-auto mb-6 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white rotate-3 group hover:rotate-0 transition-transform duration-500">
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
                        <h1 className="text-3xl font-black text-slate-900 mb-2">
                            {profile.user.first_name} {profile.user.last_name}
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-slate-500 font-medium mb-6">
                            <MapPin size={16} className="text-primary-500" />
                            {profile.location || t('profile.defaultLocation')}
                        </div>

                        <div className="flex items-center justify-center gap-1 text-orange-500 text-xl font-black bg-orange-50 py-3 rounded-2xl mb-8">
                            <Star size={20} fill="currentColor" />
                            <span>{profile.freelancer_rating || '5.0'}</span>
                            <span className="text-slate-400 text-sm font-normal ml-1">({profile.freelancer_reviews_count || 0} {t('profile.reviewsCount')})</span>
                        </div>

                        <div className="space-y-3">
                            {user?.id !== profile.user.id ? (
                                <button
                                    onClick={async () => {
                                        if (!user) {
                                            navigate('/login');
                                            return;
                                        }
                                        try {
                                            const thread = await chatService.getOrCreateThread(profile.user.id, 'PERSONAL');
                                            navigate('/chat');
                                        } catch (e) {
                                            showToast(e.response?.data?.error || t('profile.chatError'), 'error');
                                        }
                                    }}
                                    className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                                >
                                    <MessageSquare size={20} /> {t('profile.sendMessage')}
                                </button>
                            ) : (
                                <div className="p-4 bg-slate-50 text-slate-500 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border border-slate-100">
                                    <View size={16} /> {t('profile.isYourProfile')}
                                </div>
                            )}
                            {profile.is_verified && (
                                <div className="flex items-center justify-center gap-2 text-xs text-green-600 font-bold uppercase tracking-widest pt-4">
                                    <ShieldCheck size={16} /> {t('profile.verifiedSpecialist')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-12">
                    {/* About Section */}
                    <section>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <div className="w-8 h-px bg-slate-200"></div> {t('profile.aboutSpecialist')}
                        </h2>
                        <p className="text-xl text-slate-700 leading-relaxed font-medium">
                            {profile.bio || t('profile.emptyBio')}
                        </p>
                    </section>

                    {/* Skills Section */}
                    <section>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <div className="w-8 h-px bg-slate-200"></div> {t('profile.professionalSkills')}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {profile.skills?.length > 0 ? (
                                profile.skills.map(skill => (
                                    <span key={skill.id} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:border-primary-500 hover:text-primary-600 transition-all cursor-default">
                                        {skill.name}
                                    </span>
                                ))
                            ) : (
                                <p className="text-slate-400 italic">{t('profile.noSkills')}</p>
                            )}
                        </div>
                    </section>

                    {/* Portfolio Section */}
                    {portfolioItems.length > 0 && (
                        <section>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <div className="w-8 h-px bg-slate-200"></div> {t('profile.portfolio')} ({portfolioItems.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {portfolioItems.map(item => (
                                    <div key={item.id} className="premium-card overflow-hidden group hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500">
                                        <div className="aspect-video relative overflow-hidden bg-slate-100">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {item.url && (
                                                <div className="absolute inset-0 bg-primary-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-4 bg-white text-primary-600 rounded-full shadow-2xl hover:scale-110 transition-transform"
                                                        title={t('profile.viewProject')}
                                                    >
                                                        <ExternalLink size={24} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <h4 className="text-lg font-bold text-slate-900 mb-2 truncate group-hover:text-primary-600 transition-colors">
                                                {item.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Stats & Details Section */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="premium-card p-8 border-l-4 border-l-primary-600">
                            <div className="flex items-center gap-4 text-slate-400 mb-4">
                                <Briefcase size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest">{t('profile.stats.completedWorks')}</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">{profile.completed_works_count || 0}</div>
                        </div>
                        <div className="premium-card p-8 border-l-4 border-l-green-600">
                            <div className="flex items-center gap-4 text-slate-400 mb-4">
                                <Clock size={20} />
                                <span className="text-xs font-bold uppercase tracking-widest">{t('profile.stats.onPlatform')}</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">
                                {t('profile.stats.since')} {new Date(profile.user.date_joined).getFullYear()}{t('profile.stats.year')}
                            </div>
                        </div>
                        {profile.hourly_rate && (
                            <div className="premium-card p-8 border-l-4 border-l-orange-600">
                                <div className="flex items-center gap-4 text-slate-400 mb-4">
                                    <Star size={20} />
                                    <span className="text-xs font-bold uppercase tracking-widest">{t('profile.stats.rate')}</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900">{profile.hourly_rate} {t('common.currency')}</div>
                            </div>
                        )}
                        {profile.experience_years > 0 && (
                            <div className="premium-card p-8 border-l-4 border-l-blue-600">
                                <div className="flex items-center gap-4 text-slate-400 mb-4">
                                    <View size={20} />
                                    <span className="text-xs font-bold uppercase tracking-widest">{t('profile.stats.experience')}</span>
                                </div>
                                <div className="text-3xl font-black text-slate-900">{profile.experience_years} {t('profile.stats.years')}</div>
                            </div>
                        )}
                    </section>

                    {/* Social Links Section */}
                    {profile.social_links && Object.values(profile.social_links).some(v => v) && (
                        <section>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <div className="w-8 h-px bg-slate-200"></div> {t('profile.socialNetworks')}
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {profile.social_links.telegram && (
                                    <a href={`https://t.me/${profile.social_links.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all font-bold text-sm border border-slate-100">
                                        <Send size={18} /> Telegram
                                    </a>
                                )}
                                {profile.social_links.instagram && (
                                    <a href={`https://instagram.com/${profile.social_links.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition-all font-bold text-sm border border-slate-100">
                                        <Instagram size={18} /> Instagram
                                    </a>
                                )}
                                {profile.social_links.github && (
                                    <a href={`https://github.com/${profile.social_links.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all font-bold text-sm border border-slate-100">
                                        <Github size={18} /> GitHub
                                    </a>
                                )}
                                {profile.social_links.linkedin && (
                                    <a href={`https://linkedin.com/in/${profile.social_links.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-blue-700 hover:text-white transition-all font-bold text-sm border border-slate-100">
                                        <Linkedin size={18} /> LinkedIn
                                    </a>
                                )}
                            </div>
                        </section>
                    )}
                    {/* Reviews Section */}
                    <section>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <div className="w-8 h-px bg-slate-200"></div> {t('profile.reviews')} ({reviews.length})
                        </h2>
                        <div className="space-y-6">
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <ReviewCard key={review.id} review={review} />
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                    <Star size={32} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 italic">{t('profile.noReviews')}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TalentProfilePage;