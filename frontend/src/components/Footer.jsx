import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. Импортируем хук

const Footer = () => {
    const { t } = useTranslation(); // 2. Подключаем t

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
                            {t('footer.description')}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-6">{t('footer.nav_title')}</h3>
                        <ul className="space-y-4">
                            <li><Link to="/jobs" className="hover:text-white transition-colors">{t('nav.find_job')}</Link></li>
                            <li><Link to="/jobs/create" className="hover:text-white transition-colors">{t('nav.create_order')}</Link></li>
                            <li><Link to="/talents" className="hover:text-white transition-colors">{t('nav.find_talents')}</Link></li>
                            <li><Link to="/" className="hover:text-white transition-colors">{t('footer.how_it_works')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-6">{t('footer.comp_title')}</h3>
                        <ul className="space-y-4">
                            <li><Link to="/" className="hover:text-white transition-colors">{t('footer.about')}</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">{t('footer.help')}</Link></li>
                            <li><Link to="/" className="hover:text-white transition-colors">{t('footer.rules')}</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">{t('nav.contacts')}</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 flex flex-col md:row justify-between items-center gap-4">
                    <p>{t('footer.rights')}</p>
                    <div className="flex gap-6">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
                        <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Telegram</a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;