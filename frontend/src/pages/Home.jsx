import { ArrowRight, Shield, Zap, Search, ChevronRight, LayoutDashboard, Briefcase, Plus, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next'; // Добавили импорт

const Home = () => {
    const { user } = useAuth();
    const { t } = useTranslation(); // Инициализация переводчика

    return (
        <div className="bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-200 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse"></span>
                        <span className="text-sm font-medium text-slate-600">
                            {user ? `${t('home.welcome_user')}, ${user.first_name}!` : t('home.welcome_guest')}
                        </span>
                    </div>

                    <h1 className="text-5xl lg:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[1.1]">
                        {user ? (
                            <>{t('home.hero_title_user_part1')} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">{t('home.hero_title_user_part2')}</span></>
                        ) : (
                            <>{t('home.hero_title_guest_part1')} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">{t('home.hero_title_guest_part2')}</span> {t('home.hero_title_guest_part3')}</>
                        )}
                    </h1>

                    <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                        {user
                            ? t('home.hero_desc_user')
                            : t('home.hero_desc_guest')
                        }
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        {user ? (
                            <Link to="/dashboard" className="btn-primary text-lg px-12 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
                                {t('home.btn_dashboard')} <LayoutDashboard size={20} />
                            </Link>
                        ) : (
                            <Link to="/register" className="btn-primary text-lg px-12 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
                                {t('home.btn_start')} <ArrowRight size={20} />
                            </Link>
                        )}
                        <Link to="/jobs" className="btn-secondary text-lg px-12 py-4 w-full sm:w-auto text-center flex items-center justify-center gap-2">
                            <Briefcase size={20} /> {t('home.btn_view_jobs')}
                        </Link>
                    </div>

                    {/* Stats placeholder */}
                    <div className="mt-20 flex flex-wrap justify-center gap-12 lg:gap-24 grayscale opacity-60">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900">1000+</div>
                            <div className="text-sm uppercase tracking-widest font-semibold">{t('home.stats.talents')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900">500+</div>
                            <div className="text-sm uppercase tracking-widest font-semibold">{t('home.stats.jobs')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900">100%</div>
                            <div className="text-sm uppercase tracking-widest font-semibold">{t('home.stats.safe')}</div>
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

            {/* Recommendations Section for Logged In */}
            {user && (
                <section className="py-24 px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="premium-card p-10 bg-slate-900 text-white overflow-hidden relative">
                            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary-600/30 rounded-full blur-[100px]"></div>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Users className="text-primary-400" /> {t('home.rec.talents_title')}
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {[
                                    { name: 'Арслан Г.', prof: t('home.rec.prof_designer'), rate: '5.0' },
                                    { name: 'Мая Б.', prof: t('home.rec.prof_dev'), rate: '4.9' },
                                    { name: 'Тимур С.', prof: t('home.rec.prof_copy'), rate: '5.0' }
                                ].map((t_item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold">{t_item.name[0]}</div>
                                            <div>
                                                <div className="font-bold">{t_item.name}</div>
                                                <div className="text-xs text-slate-400">{t_item.prof}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary-400 font-bold">
                                            <Star size={14} fill="currentColor" /> {t_item.rate}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/talents" className="mt-8 block text-center py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors font-bold">
                                {t('home.rec.btn_all_talents')}
                            </Link>
                        </div>

                        <div className="premium-card p-10">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                                <Briefcase className="text-primary-600" /> {t('home.rec.jobs_title')}
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { title: t('home.rec.job_logo'), price: '400 TMT' },
                                    { title: t('home.rec.job_landing'), price: '2500 TMT' },
                                    { title: t('home.rec.job_trans'), price: '150 TMT' }
                                ].map((j, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                                        <div className="font-bold text-slate-800">{j.title}</div>
                                        <div className="text-primary-600 font-black">{j.price}</div>
                                    </div>
                                ))}
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
                    {['web_dev', 'design', 'copy', 'marketing', 'translation', 'mobile', 'video', 'seo'].map((catKey, idx) => (
                        <Link key={idx} to={`/jobs?category=${catKey}`} className="premium-card p-6 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                            <div className="font-bold text-lg text-slate-900">{t(`home.categories.items.${catKey}`)}</div>
                            <div className="text-sm text-slate-500 mt-4">120+ {t('home.categories.executors')}</div>
                        </Link>
                    ))}
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