import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import adminService from '../../api/adminService';

const JobEditModal = ({ job, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (job) {
            setFormData({
                title: job.title || '',
                description: job.description || '',
                budget: job.budget || '',
                deadline: job.deadline || ''
            });
        }
    }, [job]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await adminService.updateJob(job.id, formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update job');
        } finally {
            setLoading(false);
        }
    };

    const handleForceStatus = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        setLoading(true);
        setError('');

        try {
            const reason = prompt('Enter reason for status change:');
            if (!reason) return;

            await adminService.forceJobStatus(job.id, newStatus, reason);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change status');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;

        setLoading(true);
        setError('');

        try {
            await adminService.deleteJob(job.id);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete job');
        } finally {
            setLoading(false);
        }
    };

    const statuses = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'DISPUTE', 'CANCELLED'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto premium-card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Edit Job</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Budget (TMT)</label>
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Deadline</label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Status Management */}
                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-3">Status Management</h3>
                        <p className="text-sm text-gray-600 mb-3">Current Status: <span className="font-semibold">{job?.status}</span></p>
                        <div className="flex flex-wrap gap-2">
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleForceStatus(status)}
                                    className={`px-4 py-2 rounded-xl text-sm transition-colors ${job?.status === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                    disabled={loading}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-6 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            Delete Job
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-2xl border border-gray-300 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobEditModal;
