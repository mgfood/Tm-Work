import React from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ThreadSidebar = ({
    threads,
    activeThreadId,
    onSelectThread,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    loading,
    getPartner
}) => {
    const { t } = useTranslation();

    const filteredThreads = threads.filter(t => {
        const matchesTab = activeTab === 'ALL' || t.type === activeTab;
        if (!matchesTab) return false;
        if (!searchTerm) return true;

        const partner = getPartner(t);
        const searchLower = searchTerm.toLowerCase();
        return (
            partner?.first_name?.toLowerCase().includes(searchLower) ||
            partner?.last_name?.toLowerCase().includes(searchLower) ||
            t.last_message?.content?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-[400px] border-r border-slate-100 flex-col bg-slate-50/30 shrink-0 h-full`}>
            <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex-none">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4 md:mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                        <MessageSquare className="text-primary-600" size={22} />
                    </div>
                    {t('chat.title')}
                </h2>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide mb-4">
                    {['ALL', 'SYSTEM', 'JOB', 'PERSONAL', 'SUPPORT'].map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap px-3 ${activeTab === type
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {t(`chat.tabs.${type.toLowerCase()}`)}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        data-testid="chat-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('chat.search_placeholder')}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                    />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-sm border border-slate-50"></div>
                    ))
                ) : filteredThreads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <MessageSquare size={48} className="opacity-10 mb-4" />
                        <p className="text-sm font-medium">{t('chat.no_threads')}</p>
                    </div>
                ) : (
                    filteredThreads.map(thread => {
                        const partner = getPartner(thread);
                        const isActive = activeThreadId === String(thread.id);
                        return (
                            <button
                                key={thread.id}
                                onClick={() => onSelectThread(thread)}
                                data-testid="chat-thread"
                                className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 text-left group border ${isActive
                                    ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-600/20 md:translate-x-2'
                                    : 'bg-white border-transparent hover:border-slate-200 hover:bg-white shadow-sm'
                                    }`}
                            >
                                <div className="relative shrink-0">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {partner?.first_name?.[0] || '?'}
                                    </div>
                                    {thread.unread_count > 0 && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-black border-4 border-white">
                                            {thread.unread_count}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-black truncate text-base ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                            {partner?.first_name} {partner?.last_name}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold tracking-tighter shrink-0 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                                            {thread.last_message ? new Date(thread.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-xs truncate font-medium ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                                            {thread.last_message?.content || (
                                                <span className="italic opacity-60">{t('chat.start_conversation')}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ThreadSidebar;
