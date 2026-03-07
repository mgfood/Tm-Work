import React from 'react';
import { FileText, Users, Briefcase, AlertTriangle } from 'lucide-react';

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-white py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText size={32} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                        Условия использования
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                        Пожалуйста, внимательно ознакомьтесь с правилами работы на платформе TmWork.
                    </p>
                </div>

                <div className="space-y-12">
                    <Section
                        icon={<Users size={24} />}
                        title="1. Аккаунты пользователей"
                    >
                        <p>
                            Вы несете ответственность за безопасность своего аккаунта и пароля.
                            Запрещено создавать несколько аккаунтов для одного лица или использовать чужие данные.
                            Мы оставляем за собой право заблокировать аккаунт при нарушении правил.
                        </p>
                    </Section>

                    <Section
                        icon={<Briefcase size={24} />}
                        title="2. Правила работы"
                    >
                        <p>
                            Фрилансеры обязуются выполнять работу качественно и в срок. Заказчики обязуются своевременно оплачивать принятую работу.
                            Запрещено обмениваться контактами для проведения оплаты вне платформы (обход комиссии).
                        </p>
                    </Section>

                    <Section
                        icon={<AlertTriangle size={24} />}
                        title="3. Ограничение ответственности"
                    >
                        <p>
                            TmWork является посредником и не несет ответственности за качество услуг, предоставляемых фрилансерами,
                            или за платежеспособность заказчиков, за исключением гарантий в рамках сервиса "Безопасная сделка" (Escrow).
                        </p>
                    </Section>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-8">
                        <h3 className="font-bold text-slate-900 mb-2">Изменения условий</h3>
                        <p className="text-slate-600 mb-0">
                            Мы можем обновлять эти условия время от времени. Продолжая использовать сайт, вы соглашаетесь с обновленными правилами.
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

export default TermsPage;
