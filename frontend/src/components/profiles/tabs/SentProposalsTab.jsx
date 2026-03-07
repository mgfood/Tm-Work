import React from 'react';
import { ExternalLink, X, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const SentProposalsTab = ({ myProposals, handleProposalAction, t }) => {
    if (myProposals.length === 0) {
        return <div className="premium-card p-12 text-center text-slate-400 italic">{t('profile.no_proposals_sent')}</div>;
    }

    return (
        <div className="space-y-4">
            {myProposals.map(proposal => (
                <div key={proposal.id} className={`premium-card p-6 flex justify-between items-center group hover:translate-x-1 transition-all border-l-4 ${proposal.status === 'ACCEPTED' ? 'border-l-green-400' :
                        proposal.status === 'REJECTED' ? 'border-l-red-400' :
                            'border-l-blue-400'
                    }`}>
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold ${proposal.status === 'ACCEPTED' ? 'bg-green-50 text-green-600' :
                                proposal.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                                    'bg-blue-50 text-blue-600'
                            }`}>
                            {proposal.price}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">{t('profile.proposal_for')}: {proposal.job_title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                        proposal.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-500'
                                    }`}>
                                    {proposal.status}
                                </span>
                                <p className="text-xs text-slate-400 line-clamp-1">{proposal.message}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {proposal.status === 'PENDING' && (
                            <button
                                onClick={() => handleProposalAction(proposal.id, 'cancel')}
                                className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                title={t('profile.cancel_proposal_title')}
                            >
                                <X size={18} />
                            </button>
                        )}
                        <Link to={`/jobs/${proposal.job}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                            <ExternalLink size={18} />
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SentProposalsTab;
