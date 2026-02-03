import { ArrowRight, Shield, Zap, Search, ChevronRight, LayoutDashboard, Briefcase, Plus, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user } = useAuth();

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
                            {user ? `Добро пожаловать, ${user.first_name}!` : 'Теперь в Туркменистане'}
                        </span>
                    </div>

                    <h1 className="text-5xl lg:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[1.1]">
                        {user ? (
                            <>Управляйте своими <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">работами</span></>
                        ) : (
                            <>Найдите идеального <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">исполнителя</span> прямо сейчас</>
                        )}
                    </h1>

                    <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                        {user
                            ? 'Ваш центр управления заказами и откликами. Все инструменты для эффективной работы в одном месте.'
                            : 'Первая современная платформа для фриланса. Мы соединяем талантливых специалистов и амбициозных заказчиков в безопасной цифровой среде.'
                        }
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        {user ? (
                            <Link to="/dashboard" className="btn-primary text-lg px-12 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
                                Панель управления <LayoutDashboard size={20} />
                            </Link>
                        ) : (
                            <Link to="/register" className="btn-primary text-lg px-12 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
                                Начать работу <ArrowRight size={20} />
                            </Link>
                        )}
                        <Link to="/jobs" className="btn-secondary text-lg px-12 py-4 w-full sm:w-auto text-center flex items-center justify-center gap-2">
                            <Briefcase size={20} /> Посмотреть заказы
                        </Link>
                    </div>

                    {/* Stats placeholder */}
                    <div className="mt-20 flex flex-wrap justify-center gap-12 lg:gap-24 grayscale opacity-60">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900">1000+</div>
                            <div className="text-sm uppercase tracking-widest font-semibold">Специалистов</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900">500+</div>
                            <div className="text-sm uppercase tracking-widest font-semibold">Работ</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900">100%</div>
                            <div className="text-sm uppercase tracking-widest font-semibold">Безопасно</div>
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
                                <Plus size={20} /> Опубликовать новый заказ
                            </Link>
                            <Link to="/jobs" className="flex items-center gap-3 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-900 hover:text-white transition-all">
                                <Search size={20} /> Найти подходящую работу
                            </Link>
                            <Link to="/talents" className="flex items-center gap-3 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-900 hover:text-white transition-all">
                                <Users size={20} /> Поиск специалистов
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="py-24 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Почему выбирают нас</h2>
                        <p className="text-slate-600 max-w-xl mx-auto">Мы сделали процесс взаимодействия простым, понятным и максимально защищенным.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            {
                                icon: Shield,
                                title: 'Безопасные сделки',
                                desc: 'Деньги холдируются системой и выплачиваются только после того, как вы подтвердите качество работы.'
                            },
                            {
                                icon: Zap,
                                title: 'Удобство и скорость',
                                desc: 'Интуитивно понятный интерфейс позволяет создать проект или найти работу за считанные минуты.'
                            },
                            {
                                icon: Search,
                                title: 'Проверенные таланты',
                                desc: 'Мы следим за репутацией исполнителей через открытую систему отзывов и рейтингов.'
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
                                <Users className="text-primary-400" /> Рекомендуемые исполнители
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {[
                                    { name: 'Арслан Г.', prof: 'UI/UX Дизайнер', rate: '5.0' },
                                    { name: 'Мая Б.', prof: 'Python Разработчик', rate: '4.9' },
                                    { name: 'Тимур С.', prof: 'Копирайтер', rate: '5.0' }
                                ].map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold">{t.name[0]}</div>
                                            <div>
                                                <div className="font-bold">{t.name}</div>
                                                <div className="text-xs text-slate-400">{t.prof}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary-400 font-bold">
                                            <Star size={14} fill="currentColor" /> {t.rate}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/talents" className="mt-8 block text-center py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors font-bold">
                                Посмотреть всех талантов
                            </Link>
                        </div>

                        <div className="premium-card p-10">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                                <Briefcase className="text-primary-600" /> Свежие заказы
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { title: 'Создать логотип', price: '400 TMT' },
                                    { title: 'Разработка лендинга', price: '2500 TMT' },
                                    { title: 'Перевод текста', price: '150 TMT' }
                                ].map((j, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                                        <div className="font-bold text-slate-800">{j.title}</div>
                                        <div className="text-primary-600 font-black">{j.price}</div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/jobs" className="mt-8 block text-center py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors font-bold text-slate-600">
                                Посмотреть все заказы
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Categories / Jobs Preview */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Популярные категории</h2>
                        <p className="text-slate-600">Найдите лучших специалистов в своем деле</p>
                    </div>
                    <Link to="/categories" className="text-primary-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                        Все категории <ChevronRight size={20} />
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {['Веб-разработка', 'Графический дизайн', 'Копирайтинг', 'Маркетинг', 'Переводы', 'Мобильные приложения', 'Видеомонтаж', 'SEO'].map((cat, idx) => (
                        <Link key={idx} to={`/jobs?category=${cat}`} className="premium-card p-6 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                            <div className="font-bold text-lg text-slate-900">{cat}</div>
                            <div className="text-sm text-slate-500 mt-4">120+ исполнителей</div>
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
                                <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">Готовы опубликовать <br />первую работу?</h2>
                                <p className="text-slate-400 text-lg max-w-md mx-auto lg:mx-0">Присоединяйтесь к тысячам компаний и специалистов уже сегодня.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
                                <Link to="/register" className="btn-primary text-lg px-12 py-4">Регистрация</Link>
                                <Link to="/contact" className="px-12 py-4 text-white font-medium hover:bg-white/5 rounded-xl transition-all">Связаться с нами</Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Home;
