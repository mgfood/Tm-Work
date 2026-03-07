import React from 'react';
import { ShieldCheck, User, Star, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReceivedProposalsTab = ({ receivedProposals, handleAcceptProposal, handleProposalAction, user, t }) => {
    if (receivedProposals.length === 0) {
        return <div className="premium-card p-12 text-center text-slate-400 italic">{t('profile.no_received_proposals')}</div>;
    }

    return (
        <div className="space-y-4">
            {receivedProposals.map(proposal => (
                <div key={proposal.id} className={`premium-card p-6 flex flex-col md:row justify-between items-center group hover:shadow-xl transition-all border-l-4 ${proposal.status === 'ACCEPTED' ? 'border-l-green-600' :
                        proposal.status === 'REJECTED' ? 'border-l-red-600' :
                            'border-l-primary-400'
                    }`}>
                    <div className="flex items-center gap-6 w-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold ${proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' :
                                'bg-primary-50 text-primary-600'
                            }`}>
                            {proposal.price}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">{t('profile.proposal_on')} {proposal.job_title}</h4>
                            <p className="text-sm text-slate-600 mt-1">{t('common.from')}: {proposal.freelancer_email}</p>
                            <p className="text-xs text-slate-400 italic mt-2">"{proposal.message}"</p>
                            {proposal.status !== 'PENDING' && (
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {proposal.status}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                        {proposal.status === 'PENDING' ? (
                            <>
                                <button
                                    onClick={() => handleAcceptProposal(proposal.id)}
                                    className="btn-primary py-2 px-4 text-xs flex items-center gap-1"
                                >
                                    <ShieldCheck size={14} /> {t('common.accept')}
                                </button>
                                <button
                                    onClick={() => handleProposalAction(proposal.id, 'reject')}
                                    className="btn-secondary py-2 px-4 text-xs text-red-500 border-red-100 hover:bg-red-50"
                                >
                                    {t('common.reject')}
                                </button>
                            </>
                        ) : proposal.status === 'ACCEPTED' ? (
                            <span className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl flex items-center gap-1">
                                <Star size={14} fill="currentColor" /> {t('profile.in_progress')}
                            </span>
                        ) : (
                            <span className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl">{t('profile.rejected')}</span>
                        )}
                        <Link to={`/talents/${proposal.freelancer}`} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all">
                            <User size={18} />
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReceivedProposalsTab;
