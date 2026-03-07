import React from 'react';
import { Archive, Send, Edit3, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const DraftsTab = ({ draftJobs, handlePublishDraft, handleDeleteJob, t, i18n }) => {
    if (draftJobs.length === 0) {
        return <div className="premium-card p-12 text-center text-slate-400 italic">{t('profile.no_drafts')}</div>;
    }

    return (
        <div className="space-y-4">
            {draftJobs.map(job => (
                <div key={job.id} className="premium-card p-6 flex justify-between items-center group hover:translate-x-1 transition-all border-l-4 border-l-amber-400">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Archive size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{job.title}</h4>
                            <span className="text-xs text-slate-400 font-medium">
                                {t('jobs.draft_from', {
                                    date: new Date(job.created_at).toLocaleDateString(i18n.language === 'tk' ? 'tk-TM' : 'ru-RU')
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePublishDraft(job.id)}
                            className="p-3 bg-slate-50 text-green-600 rounded-xl hover:bg-green-50 transition-all font-bold text-xs flex items-center gap-1"
                            title={t('jobs.publish')}
                        >
                            <Send size={18} />
                        </button>
                        <Link to={`/jobs/${job.id}/edit`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all" title={t('common.edit')}>
                            <Edit3 size={18} />
                        </Link>
                        <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                            title={t('common.delete')}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DraftsTab;
