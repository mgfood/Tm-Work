import React from 'react';
import { Briefcase, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActiveJobsTab = ({ activeJobs, handleDeleteJob, t }) => {
    if (activeJobs.length === 0) {
        return <div className="premium-card p-12 text-center text-slate-400 italic">{t('profile.no_active_jobs')}</div>;
    }

    return (
        <div className="space-y-4">
            {activeJobs.map(job => (
                <div key={job.id} className="premium-card p-6 flex justify-between items-center group hover:translate-x-1 transition-all">
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 ${job.status === 'PUBLISHED' ? 'bg-primary-50 text-primary-600' : 'bg-green-50 text-green-600'} rounded-2xl flex items-center justify-center`}>
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase text-sm tracking-wide">{job.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${job.status === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                    {job.status === 'PUBLISHED' ? t('job.published') : t('profile.in_progress')}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{job.budget} TMT</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to={`/jobs/${job.id}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all" title={t('common.view')}>
                            <ExternalLink size={18} />
                        </Link>
                        {job.status === 'PUBLISHED' && (
                            <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                title={t('common.delete')}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActiveJobsTab;
