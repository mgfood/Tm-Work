import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FilePlus, Calendar, DollarSign, AlignLeft, AlertCircle, Save, Send, Upload, FileText, Trash2, List } from 'lucide-react';
import jobsService from '../../api/jobsService';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useTranslation } from 'react-i18next'; // Предполагается использование i18next

const EditJobPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [files, setFiles] = useState([]);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        description: '',
        budget: '',
        deadline: '',
    });

    useEffect(() => {
        jobsService.getCategories().then(data => {
            setCategories(data.results || data);
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const data = await jobsService.getJobById(id);
                setFormData({
                    title: data.title,
                    category_id: data.category?.id || '',
                    description: data.description,
                    budget: data.budget,
                    deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '',
                });
                setFiles(data.files || []);
            } catch (err) {
                console.error(err);
                setError(t('editJob.loadingError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [id, t]);

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
                setError(t('editJob.budgetError'));
                setIsSubmitting(false);
                return;
            }

            await jobsService.updateJob(id, {
                ...formData,
                budget: parseFloat(formData.budget)
            });

            if (shouldPublish) {
                await jobsService.publishJob(id);
            }

            navigate(`/jobs/${id}`, {
                state: {
                    message: shouldPublish ? t('editJob.publishSuccess') : t('editJob.saveSuccess')
                }
            });
        } catch (err) {
            console.error(err);
            const serverError = err.response?.data;
            if (serverError) {
                const msg = Object.entries(serverError).map(([key, value]) => `${key}: ${value}`).join(', ');
                setError(`${t('common.error')}: ${msg}`);
            } else {
                setError(t('editJob.updateError'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const newFile = await jobsService.uploadFile(id, file);
            setFiles(prev => [...prev, newFile]);
            showToast(t('editJob.fileUploadSuccess'), 'success');
        } catch (err) {
            console.error(err);
            showToast(t('editJob.fileUploadError'), 'error');
        } finally {
            e.target.value = null;
        }
    };

    const handleDeleteFile = async (fileId) => {
        const isConfirmed = await confirm({
            title: t('common.confirm_action'),
            message: t('editJob.fileDeleteConfirm'),
            variant: 'danger'
        });

        if (!isConfirmed) return;

        try {
            await jobsService.deleteFile(id, fileId);
            setFiles(prev => prev.filter(f => f.id !== fileId));
            showToast(t('editJob.fileDeleteSuccess'), 'success');
        } catch (err) {
            console.error(err);
            showToast(t('editJob.fileDeleteError'), 'error');
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('editJob.title')}</h1>
                <p className="text-slate-500">{t('editJob.subtitle')}</p>
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('editJob.labelTitle')}</label>
                        <div className="relative">
                            <input
                                name="title"
                                type="text"
                                data-testid="job-title-input"
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-lg font-medium"
                                value={formData.title}
                                onChange={handleChange}
                            />
                            <FilePlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('editJob.labelCategory')}</label>
                        <div className="relative">
                            <select
                                name="category_id"
                                data-testid="job-category-select"
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none appearance-none font-medium text-slate-700"
                                value={formData.category_id}
                                onChange={handleChange}
                            >
                                <option value="">{t('editJob.selectCategory')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <List className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('editJob.labelDescription')}</label>
                        <div className="relative">
                            <textarea
                                name="description"
                                data-testid="job-description-input"
                                rows="8"
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                            <AlignLeft className="absolute left-4 top-5 text-slate-400" size={20} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">{t('editJob.labelBudget')}</label>
                            <div className="relative">
                                <input
                                    name="budget"
                                    type="number"
                                    data-testid="job-budget-input"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={formData.budget}
                                    onChange={handleChange}
                                />
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">{t('editJob.labelDeadline')}</label>
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

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-4">{t('editJob.labelFiles')}</label>

                        <div className="space-y-4 mb-4">
                            {files.map(file => (
                                <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                                            <FileText className="text-primary-500" size={20} />
                                        </div>
                                        <div>
                                            <a
                                                href={file.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-bold text-slate-700 hover:text-primary-600 hover:underline"
                                            >
                                                {file.file.split('/').pop()}
                                            </a>
                                            <p className="text-xs text-slate-400">
                                                {new Date(file.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="relative">
                            <input
                                type="file"
                                id="job-file-upload"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <label
                                htmlFor="job-file-upload"
                                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group"
                            >
                                <Upload className="text-slate-400 group-hover:text-primary-500 mb-2" size={24} />
                                <span className="text-slate-600 font-medium group-hover:text-primary-600">{t('editJob.uploadPlaceholder')}</span>
                                <span className="text-xs text-slate-400 mt-1">{t('editJob.uploadHint')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-4">
                        <button
                            type="button"
                            data-testid="save-job-button"
                            onClick={(e) => handleSubmit(e, false)}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> {t('editJob.btnSave')}
                        </button>
                        <button
                            type="button"
                            data-testid="publish-job-button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
                        >
                            <Send size={18} /> {t('editJob.btnPublish')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditJobPage;