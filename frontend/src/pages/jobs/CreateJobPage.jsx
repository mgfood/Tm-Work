import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Calendar, DollarSign, AlignLeft, AlertCircle, Save, Send } from 'lucide-react';
import jobsService from '../../api/jobsService';

const CreateJobPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e, shouldPublish = false) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const job = await jobsService.createJob({
                ...formData,
                status: shouldPublish ? 'PUBLISHED' : 'DRAFT'
            });

            if (shouldPublish) {
                await jobsService.publishJob(job.id);
            }

            navigate(`/jobs/${job.id}`);
        } catch (err) {
            console.error(err);
            setError('Не удалось создать заказ. Проверьте правильность заполнения полей.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Создать новый заказ</h1>
                <p className="text-slate-500">Опишите задачу максимально подробно, чтобы найти лучших исполнителей</p>
            </div>

            <div className="premium-card p-10">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8 flex items-start gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form className="space-y-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Заголовок заказа</label>
                        <div className="relative">
                            <input
                                name="title"
                                type="text"
                                required
                                placeholder="Например: Создать логотип для интернет-магазина"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-lg font-medium"
                                value={formData.title}
                                onChange={handleChange}
                            />
                            <FilePlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Кратко и емко опишите суть проекта</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Подробное описание</label>
                        <div className="relative">
                            <textarea
                                name="description"
                                rows="8"
                                required
                                placeholder="Опишите требования, условия и ожидания от результата..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                            <AlignLeft className="absolute left-4 top-5 text-slate-400" size={20} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Бюджет (TMT)</label>
                            <div className="relative">
                                <input
                                    name="budget"
                                    type="number"
                                    required
                                    placeholder="500"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={formData.budget}
                                    onChange={handleChange}
                                />
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Дедлайн (до какой даты)</label>
                            <div className="relative">
                                <input
                                    name="deadline"
                                    type="datetime-local"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                />
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 flex flex-col md:row justify-end gap-4">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, false)}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Сохранить как черновик
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
                        >
                            <Send size={18} /> Опубликовать заказ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateJobPage;
