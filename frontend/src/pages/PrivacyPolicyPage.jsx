import React from 'react';
import { Shield, Lock, Eye, Server } from 'lucide-react';

const PrivacyPolicyPage = () => {
    return (
        <div className="min-h-screen bg-white py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                        Политика конфиденциальности
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                        Мы серьезно относимся к безопасности ваших данных. Узнайте, как мы собираем, используем и защищаем вашу информацию.
                    </p>
                </div>

                <div className="space-y-12">
                    <Section
                        icon={<Eye size={24} />}
                        title="1. Сбор информации"
                    >
                        <p>Мы собираем информацию, которую вы предоставляете нам напрямую:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Личные данные (имя, email, телефон) при регистрации.</li>
                            <li>Профессиональные данные (портфолио, навыки) для вашего профиля.</li>
                            <li>Финансовая информация для обработки платежей (обрабатывается защищенно через сторонние сервисы).</li>
                        </ul>
                    </Section>

                    <Section
                        icon={<Server size={24} />}
                        title="2. Использование данных"
                    >
                        <p>Мы используем ваши данные для:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Обеспечения работы платформы и подбора заказов.</li>
                            <li>Связи с вами по поводу обновлений и уведомлений.</li>
                            <li>Улучшения качества наших услуг и аналитики.</li>
                        </ul>
                    </Section>

                    <Section
                        icon={<Lock size={24} />}
                        title="3. Безопасность"
                    >
                        <p>
                            Мы применяем современные технические средства защиты (шифрование, SSL, защищенные сервера) для предотвращения несанкционированного доступа к вашим данным.
                            Доступ к личной информации имеют только сотрудники, которым она необходима для работы.
                        </p>
                    </Section>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-8">
                        <h3 className="font-bold text-slate-900 mb-2">Контакты для связи</h3>
                        <p className="text-slate-600 mb-0">
                            Если у вас есть вопросы по поводу нашей политики конфиденциальности, пожалуйста, свяжитесь с нами:
                            <a href="/contact" className="text-blue-600 hover:underline ml-1 font-bold">Служба поддержки</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Section = ({ icon, title, children }) => (
    <div className="flex gap-4 md:gap-6">
        <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
            {icon}
        </div>
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">{title}</h2>
            <div className="text-slate-600 leading-relaxed font-medium">
                {children}
            </div>
        </div>
    </div>
);

export default PrivacyPolicyPage;
