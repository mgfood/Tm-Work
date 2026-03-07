import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Добавлено
import { FilePlus, Calendar, DollarSign, AlignLeft, AlertCircle, Save, Send, List } from 'lucide-react';
import jobsService from '../../api/jobsService';
import { useToast } from '../../context/ToastContext';

const CreateJobPage = () => {
    const { t } = useTranslation(); // Инициализация
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        description: '',
        budget: '',
        deadline: '',
    });

    const [categories, setCategories] = useState([]);

    React.useEffect(() => {
        jobsService.getCategories().then(data => {
            setCategories(data.results || data);
        }).catch(err => console.error(err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e, shouldPublish = false) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (!formData.budget || formData.budget <= 0) {
                setError(t('create_job.errors.budget_positive'));
                setIsSubmitting(false);
                return;
            }

            const job = await jobsService.createJob({
                ...formData,
                budget: parseFloat(formData.budget)
            });

            if (shouldPublish) {
                try {
                    await jobsService.publishJob(job.id);
                } catch (publishErr) {
                    console.error('Publishing failed', publishErr);
                    setError(t('create_job.errors.publish_failed'));
                }
            }

            showToast(
                shouldPublish ? t('create_job.success.published') : t('create_job.success.drafted'),
                'success'
            );
            navigate(`/jobs/${job.id}`);
        } catch (err) {
            console.error(err);
            const serverError = err.response?.data;
            if (serverError) {
                const msg = Object.entries(serverError).map(([key, value]) => `${key}: ${value}`).join(', ');
                setError(`${t('create_job.errors.prefix')}: ${msg}`);
            } else {
                setError(t('create_job.errors.default'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('create_job.title')}</h1>
                <p className="text-slate-500">{t('create_job.subtitle')}</p>
            </div>

            <div className="premium-card p-10">
                {error && (
                    <div data-testid="create-job-error" className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8 flex items-start gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form className="space-y-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('create_job.fields.title_label')}</label>
                        <div className="relative">
                            <input
                                name="title"
                                type="text"
                                data-testid="job-title-input"
                                required
                                placeholder={t('create_job.fields.title_placeholder')}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-lg font-medium"
                                value={formData.title}
                                onChange={handleChange}
                            />
                            <FilePlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{t('create_job.fields.title_hint')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('create_job.fields.category_label')}</label>
                        <div className="relative">
                            <select
                                name="category_id"
                                data-testid="job-category-select"
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none appearance-none font-medium text-slate-700"
                                value={formData.category_id}
                                onChange={handleChange}
                            >
                                <option value="">{t('create_job.fields.category_placeholder')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <List className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('create_job.fields.description_label')}</label>
                        <div className="relative">
                            <textarea
                                name="description"
                                data-testid="job-description-input"
                                rows="8"
                                required
                                placeholder={t('create_job.fields.description_placeholder')}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                            <AlignLeft className="absolute left-4 top-5 text-slate-400" size={20} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">{t('create_job.fields.budget_label')}</label>
                            <div className="relative">
                                <input
                                    name="budget"
                                    type="number"
                                    data-testid="job-budget-input"
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">{t('create_job.fields.deadline_label')}</label>
                            <div className="relative">
                                <input
                                    name="deadline"
                                    type="datetime-local"
                                    data-testid="job-deadline-input"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                />
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-4">
                        <button
                            type="button"
                            data-testid="save-draft-button"
                            onClick={(e) => handleSubmit(e, false)}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> {t('create_job.buttons.save_draft')}
                        </button>
                        <button
                            type="button"
                            data-testid="publish-job-button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
                        >
                            <Send size={18} /> {t('create_job.buttons.publish')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateJobPage;