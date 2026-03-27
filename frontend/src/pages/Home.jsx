import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, Search, ChevronRight, LayoutDashboard, Briefcase, Plus, Users, Star, HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import jobsService from '../api/jobsService';
import profilesService from '../api/profilesService';

const Home = () => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_freelancers: null, total_jobs: null, total_completed: null });
    const [freelancers, setFreelancers] = useState([]);
    const [recentJobs, setRecentJobs] = useState([]);

    const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/v1\/?$/, '');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catData, statsData, profilesData, jobsData] = await Promise.all([
                    jobsService.getCategories(),
                    jobsService.getGlobalStats(),
                    profilesService.getProfiles({ page_size: 3, role: 'FREELANCER' }),
                    jobsService.getJobs({ status: 'PUBLISHED', page_size: 3, ordering: '-created_at' }),
                ]);
                const categoriesArray = Array.isArray(catData.results) ? catData.results : (Array.isArray(catData) ? catData : []);
                setCategories(categoriesArray.slice(0, 8));
                setStats(statsData);
                const profilesArray = Array.isArray(profilesData.results) ? profilesData.results : (Array.isArray(profilesData) ? profilesData : []);
                setFreelancers(profilesArray.slice(0, 3));
                const jobsArray = Array.isArray(jobsData.results) ? jobsData.results : (Array.isArray(jobsData) ? jobsData : []);
                setRecentJobs(jobsArray.slice(0, 3));
            } catch (err) {
                console.error("Failed to load home data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getCategoryName = (cat) => {
        const lang = i18n.language;
        if (lang === 'tk' && cat.name_tk) return cat.name_tk;
        if (lang === 'ru' && cat.name_ru) return cat.name_ru;
        return cat.name; // Fallback to core name
    };

    return (
        <div className="bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-200 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-3 bg-white rounded-full shadow-sm border border-slate-100 mb-10">
                        <span className="flex h-3 w-3 rounded-full bg-primary-600 animate-pulse"></span>
                        <span className="text-base md:text-lg font-semibold text-slate-700">
                            {user ? `${t('home.welcome_user')}, ${user.first_name}!` : t('home.welcome_guest')}
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-10 leading-tight">
                        {user ? (
                            <>{t('home.hero_title_user_part1')} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">{t('home.hero_title_user_part2')}</span></>
                        ) : (
                            <>{t('home.hero_title_guest_part1')} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">{t('home.hero_title_guest_part2')}</span> {t('home.hero_title_guest_part3')}</>
                        )}
                    </h1>

                    <p className="text-lg md:text-xl lg:text-2xl text-slate-600 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
                        {user
                            ? t('home.hero_desc_user')
                            : t('home.hero_desc_guest')
                        }
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
                        {user ? (
                            <Link to="/dashboard" className="btn-primary text-base md:text-lg px-10 py-5 flex items-center gap-3 w-full sm:w-auto justify-center">
                                {t('home.btn_dashboard')} <LayoutDashboard size={22} />
                            </Link>
                        ) : (
                            <Link to="/register" className="btn-primary text-base md:text-lg px-10 py-5 flex items-center gap-3 w-full sm:w-auto justify-center">
                                {t('home.btn_start')} <ArrowRight size={22} />
                            </Link>
                        )}
                        <Link to="/jobs" className="btn-secondary text-base md:text-lg px-10 py-5 w-full sm:w-auto text-center flex items-center justify-center gap-3">
                            <Briefcase size={22} /> {t('home.btn_view_jobs')}
                        </Link>
                    </div>

                    {/* Real Stats */}
                    <div className="mt-24 flex flex-wrap justify-center gap-16 lg:gap-24">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
                                {stats.total_freelancers !== null ? stats.total_freelancers : (
                                    <span className="inline-block w-20 h-10 bg-slate-200 rounded-xl animate-pulse" />
                                )}
                            </div>
                            <div className="text-sm md:text-base uppercase tracking-wider font-semibold text-slate-500">{t('home.stats.talents')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
                                {stats.total_jobs !== null ? stats.total_jobs : (
                                    <span className="inline-block w-20 h-10 bg-slate-200 rounded-xl animate-pulse" />
                                )}
                            </div>
                            <div className="text-sm md:text-base uppercase tracking-wider font-semibold text-slate-500">{t('home.stats.jobs')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
                                {stats.total_completed !== null && stats.total_completed !== undefined ? stats.total_completed : (
                                    <span className="inline-block w-20 h-10 bg-slate-200 rounded-xl animate-pulse" />
                                )}
                            </div>
                            <div className="text-sm md:text-base uppercase tracking-wider font-semibold text-slate-500">{t('home.stats.completed')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Logged In Quick Actions */}
            {user && (
                <section className="py-12 bg-white border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link to="/jobs/create" className="flex items-center gap-3 px-8 py-4 bg-primary-50 text-primary-600 rounded-2xl font-bold hover:bg-primary-600 hover:text-white transition-all">
                                <Plus size={20} /> {t('home.actions.post_job')}
                            </Link>
                            <Link to="/jobs" className="flex items-center gap-3 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-900 hover:text-white transition-all">
                                <Search size={20} /> {t('home.actions.find_job')}
                            </Link>
                            <Link to="/talents" className="flex items-center gap-3 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-900 hover:text-white transition-all">
                                <Users size={20} /> {t('home.actions.find_talents')}
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="py-24 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">{t('home.features.title')}</h2>
                        <p className="text-slate-600 max-w-xl mx-auto">{t('home.features.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            {
                                icon: Shield,
                                title: t('home.features.shield_title'),
                                desc: t('home.features.shield_desc')
                            },
                            {
                                icon: Zap,
                                title: t('home.features.zap_title'),
                                desc: t('home.features.zap_desc')
                            },
                            {
                                icon: Search,
                                title: t('home.features.search_title'),
                                desc: t('home.features.search_desc')
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="premium-card p-10 group">
                                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recommendations Section */}
            {user && (
                <section className="py-24 px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* Freelancers */}
                        <div className="premium-card p-10 relative overflow-hidden">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                                <Users className="text-primary-600" /> {t('home.rec.talents_title')}
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                                    ))
                                ) : freelancers.length > 0 ? freelancers.map((profile) => {
                                    const firstName = profile.user?.first_name || '';
                                    const lastName = profile.user?.last_name || '';
                                    const emailPart = profile.user?.email ? profile.user.email.split('@')[0] : '';
                                    const displayName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : emailPart || '?';
                                    
                                    const initial = displayName[0]?.toUpperCase() || '?';
                                    const avatarUrl = profile.avatar
                                        ? (profile.avatar.startsWith('http') ? profile.avatar : `${API_BASE}${profile.avatar}`)
                                        : null;
                                    
                                    return (
                                        <Link key={profile.user?.id} to={`/talents/${profile.user?.id}`}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:border-primary-100 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-3">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold text-sm text-white">{initial}</div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{displayName}</div>
                                                    <div className="text-xs text-slate-500">{profile.profession || t('common.freelancer')}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-primary-600 font-bold">
                                                <Star size={14} fill="currentColor" className="text-primary-500" />
                                                {profile.rating_as_freelancer > 0 ? Number(profile.rating_as_freelancer).toFixed(1) : '—'}
                                            </div>
                                        </Link>
                                    );
                                }) : (
                                    <div className="text-center py-6 text-slate-400 font-medium">
                                        <Users size={32} className="mx-auto mb-2 opacity-20" />
                                        <p>{t('talentList.noTalentsFound')}</p>
                                    </div>
                                )}
                            </div>
                            <Link to="/talents" className="mt-8 block text-center py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors font-bold text-slate-600">
                                {t('home.rec.btn_all_talents')}
                            </Link>
                        </div>

                        {/* Recent Jobs */}
                        <div className="premium-card p-10">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                                <Briefcase className="text-primary-600" /> {t('home.rec.jobs_title')}
                            </h3>
                            <div className="space-y-4">
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                                    ))
                                ) : recentJobs.length > 0 ? recentJobs.map((job) => (
                                    <Link key={job.id} to={`/jobs/${job.id}`}
                                        className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:shadow-md transition-all hover:border-primary-100 group">
                                        <div className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate pr-4">{job.title}</div>
                                        <div className="text-primary-600 font-black shrink-0">{job.budget} TMT</div>
                                    </Link>
                                )) : (
                                    <p className="text-center text-slate-400 py-4">{t('jobs.notFound')}</p>
                                )}
                            </div>
                            <Link to="/jobs" className="mt-8 block text-center py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors font-bold text-slate-600">
                                {t('home.rec.btn_all_jobs')}
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Categories Section */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('home.categories.title')}</h2>
                        <p className="text-slate-600">{t('home.categories.subtitle')}</p>
                    </div>
                    <Link to="/categories" className="text-primary-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                        {t('home.categories.all_link')} <ChevronRight size={20} />
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="premium-card p-6 h-32 animate-pulse bg-slate-100"></div>
                        ))
                    ) : (
                        categories.map((cat) => (
                            <Link key={cat.id} to={`/jobs?category=${cat.id}`} className="premium-card p-6 flex flex-col justify-between hover:bg-slate-50 transition-all hover:scale-[1.02] group">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-lg text-slate-900 leading-tight group-hover:text-primary-600 transition-colors">
                                        {getCategoryName(cat)}
                                    </div>
                                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all overflow-hidden shrink-0">
                                        {cat.custom_icon ? (
                                            <img 
                                                src={cat.custom_icon.startsWith('http') ? cat.custom_icon : `${API_BASE}${cat.custom_icon}`} 
                                                className="w-full h-full object-cover" 
                                                alt="" 
                                            />
                                        ) : (
                                            (() => {
                                                const IconComp = LucideIcons[cat.icon] || HelpCircle;
                                                return <IconComp size={20} />;
                                            })()
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 mt-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {cat.specialists_count} {t('home.categories.executors')}
                                    </div>
                                    <div className="text-sm font-black text-primary-600">
                                        {cat.jobs_count} {t('home.rec.jobs_title').toLowerCase()}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                    {categories.length === 0 && !loading && (
                        <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                            {t('admin.categories_mgmt.no_categories')}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section - Hidden for logged in users */}
            {!user && (
                <section className="py-24 px-6">
                    <div className="max-w-7xl mx-auto bg-slate-900 rounded-[3rem] p-12 lg:p-24 relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[100px]"></div>
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
                            <div>
                                <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">{t('home.cta.title_part1')} <br />{t('home.cta.title_part2')}</h2>
                                <p className="text-slate-400 text-lg max-w-md mx-auto lg:mx-0">{t('home.cta.desc')}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
                                <Link to="/register" className="btn-primary text-lg px-12 py-4">{t('home.cta.btn_reg')}</Link>
                                <Link to="/contact" className="px-12 py-4 text-white font-medium hover:bg-white/5 rounded-xl transition-all">{t('home.cta.btn_contact')}</Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Home;