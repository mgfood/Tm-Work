const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-400 py-16 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="text-white text-2xl font-bold mb-6 tracking-tight flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-lg">T</div>
                            TmWork
                        </h2>
                        <p className="max-w-md leading-relaxed">
                            Первая современная фриланс-платформа в Туркменистане. Мы создаем удобную экосистему для эффективного сотрудничества лучших специалистов и заказчиков.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-6">Навигация</h3>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-white transition-colors">Поиск работы</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Создать заказ</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Поиск талантов</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Как это работает</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-6">Компания</h3>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Помощь и поддержка</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Правила платформы</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 flex flex-col md:row justify-between items-center gap-4">
                    <p>© 2026 TmWork. Все права защищены.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Instagram</a>
                        <a href="#" className="hover:text-white transition-colors">Telegram</a>
                        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
