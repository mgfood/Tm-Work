import React, { useState, useEffect } from 'react';
import {
    Briefcase, Edit, Loader2, AlertTriangle
} from 'lucide-react';
import adminService from '../../../api/adminService';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../context/ToastContext';
import { formatDate } from '../../../utils/formatters';
import JobEditModal from '../JobEditModal';

const JobsTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingJob, setEditingJob] = useState(null);
    const [isJobEditModalOpen, setIsJobEditModalOpen] = useState(false);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllJobs();
            const jobsArray = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setJobs(jobsArray);
        } catch (err) {
            setError(t('admin.load_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );

    return (
        <div data-testid="jobs-tab" className="space-y-6">
            <div className="premium-card overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                    <table data-testid="jobs-table" className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">{t('admin.jobs_table.title')}</th>
                                <th className="px-6 py-4">{t('admin.jobs_table.budget')}</th>
                                <th className="px-6 py-4">{t('admin.jobs_table.status')}</th>
                                <th className="px-6 py-4">{t('admin.jobs_table.date')}</th>
                                <th className="px-6 py-4 text-right">{t('admin.jobs_table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {jobs.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">{t('admin.jobs_table.not_found')}</td></tr>
                            ) : jobs.map(j => (
                                <tr key={j.id} data-testid={`job-row-${j.id}`} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 truncate max-w-xs">{j.title}</div>
                                        <div className="text-xs text-slate-400">{t('admin.jobs_table.id')}: {j.id} | {t('admin.jobs_table.client_id')}: {j.client}</div>
                                    </td>
                                    <td className="px-6 py-4 font-black text-primary-600">{j.budget} <span className="text-[10px]">TMT</span></td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${j.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {j.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{formatDate(j.created_at)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => { setEditingJob(j); setIsJobEditModalOpen(true); }}
                                            className="p-2 hover:bg-slate-100 rounded-lg group/edit"
                                        >
                                            <Edit size={16} className="text-slate-400 group-hover/edit:text-primary-600 transition-colors" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <JobEditModal
                isOpen={isJobEditModalOpen}
                onClose={() => setIsJobEditModalOpen(false)}
                job={editingJob}
                onSuccess={() => {
                    setIsJobEditModalOpen(false);
                    fetchJobs();
                }}
            />
        </div>
    );
};

export default JobsTab;
