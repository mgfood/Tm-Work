import React, { useState, useEffect } from 'react';
import {
    Loader2
} from 'lucide-react';
import adminService from '../../../api/adminService';
import { useTranslation } from 'react-i18next';

const AuditLogsTab = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await adminService.getLogs().catch(() => []);
            setLogs(data || []);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
    );

    return (
        <div data-testid="audit-logs-tab" className="premium-card overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table data-testid="audit-logs-table" className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Admin</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Target</th>
                            <th className="px-6 py-4">Context</th>
                            <th className="px-6 py-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(!logs || logs.length === 0) ? (
                            <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic">No logs found</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} className="text-sm">
                                <td className="px-6 py-4 font-bold text-slate-700">{log.admin_email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.action_type.includes('RELEASE') ? 'bg-green-100 text-green-700' :
                                        log.action_type.includes('REFUND') || log.action_type.includes('BLOCK') ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {log.action_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.target_info}</td>
                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{log.comment}</td>
                                <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogsTab;
