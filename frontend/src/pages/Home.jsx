import { ArrowRight, Shield, Zap, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-200 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-8 animate-bounce">
                        <span className="flex h-2 w-2 rounded-full bg-primary-600"></span>
                        <span className="text-sm font-medium text-slate-600">Теперь в Туркменистане</span>
                    </div>

                    <h1 className="text-5xl lg:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[1.1]">
                        Найдите идеального <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">исполнителя</span> прямо сейчас
                    </h1>

                    <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Первая современная платформа для фриланса. Мы соединяем талантливых специалистов и амбициозных заказчиков в безопасной цифровой среде.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link to="/register" className="btn-primary text-lg px-12 py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
                            Начать работу <ArrowRight size={20} />
                        </Link>
                        <Link to="/jobs" className="btn-secondary text-lg px-12 py-4 w-full sm:w-auto text-center">
                            Посмотреть заказы
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
                            <div className="text-sm uppercase tracking-widest font-semibold">Проектов</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900">100%</div>
                            <div className="text-sm uppercase tracking-widest font-semibold">Безопасно</div>
                        </div>
                    </div>
                </div>
            </section>

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
                        <Link key={idx} to={`/category/${idx}`} className="premium-card p-6 flex flex-col justify-between hover:bg-slate-50">
                            <div className="font-bold text-lg text-slate-900">{cat}</div>
                            <div className="text-sm text-slate-500 mt-4">120+ исполнителей</div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto bg-slate-900 rounded-[3rem] p-12 lg:p-24 relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[100px]"></div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
                        <div>
                            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">Готовы начать <br />свой проект?</h2>
                            <p className="text-slate-400 text-lg max-w-md mx-auto lg:mx-0">Присоединяйтесь к тысячам компаний и специалистов уже сегодня.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
                            <Link to="/register" className="btn-primary text-lg px-12 py-4">Регистрация</Link>
                            <Link to="/contact" className="px-12 py-4 text-white font-medium hover:bg-white/5 rounded-xl transition-all">Связаться с нами</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
