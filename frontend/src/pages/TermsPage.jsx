import React from 'react';
import { FileText, Users, Briefcase, Star, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-white py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
                <div className="text-center mb-16">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Heart size={32} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                        Правила Платформы
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                        Мы создали TmWork, чтобы таланты и клиенты могли легко находить друг друга. Вот несколько простых правил, которые делают нашу платформу лучше для всех.
                    </p>
                </div>

                <div className="space-y-12">
                    <Section
                        icon={<Users size={24} />}
                        title="1. Честность и Уважение"
                    >
                        <p>
                            Относитесь к другим пользователям так, как хотели бы, чтобы относились к вам. Мы не терпим грубости, угроз или оскорблений. Будьте профессионалами: общайтесь вежливо и конструктивно.
                        </p>
                    </Section>

                    <Section
                        icon={<Briefcase size={24} />}
                        title="2. Качество работы"
                    >
                        <p>
                            Если вы фрилансер — старайтесь выполнять работу качественно, в срок и в точном соответствии с техническим заданием. 
                            Если вы заказчик — давайте четкие инструкции и своевременно проверяйте результат. Хорошая работа всегда вознаграждается отличными отзывами!
                        </p>
                    </Section>

                    <Section
                        icon={<MessageCircle size={24} />}
                        title="3. Безопасность сделок"
                    >
                        <p>
                            Договаривайтесь и проводите оплату только внутри платформы TmWork — это ваша гарантия того, что деньги не пропадут, а работа будет оплачена. 
                            Обмен личными контактами до заключения сделки запрещен ради вашей же финансовой безопасности.
                        </p>
                    </Section>

                    <Section
                        icon={<Star size={24} />}
                        title="4. Честные отзывы"
                    >
                        <p>
                            Оставляйте правдивые отзывы после завершения каждого заказа. Ваш опыт помогает другим клиентам и фрилансерам принимать правильные решения. Платформа строго запрещает накрутку рейтинга и фиктивные заказы.
                        </p>
                    </Section>

                    <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 mt-12 text-center">
                        <FileText size={24} className="mx-auto text-slate-400 mb-4" />
                        <h3 className="font-bold text-slate-900 mb-2">Юридическая документация</h3>
                        <p className="text-slate-500 mb-4 text-sm max-w-xl mx-auto">
                            Используя платформу, вы также соглашаетесь с нашей детальной юридической Офертой и политикой обработки данных. Мы рекомендуем ознакомиться с ней для полного понимания ваших прав и обязанностей.
                        </p>
                        <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-bold text-sm underline decoration-blue-200 underline-offset-4 transition-colors">
                            Читать Политику Конфиденциальности и Оферту
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Section = ({ icon, title, children }) => (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 group">
        <div className="w-14 h-14 bg-blue-50/50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            {icon}
        </div>
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">{title}</h2>
            <div className="text-slate-600 leading-relaxed font-medium">
                {children}
            </div>
        </div>
    </div>
);

export default TermsPage;
