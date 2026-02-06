import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import adminService from '../../api/adminService';

const UserEditModal = ({ user, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });
    const [roles, setRoles] = useState({
        CLIENT: false,
        FREELANCER: false
    });
    const [groups, setGroups] = useState({
        Support: false,
        Moderator: false,
        FinancialAdmin: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuperuser, setIsSuperuser] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || ''
            });

            // Set current roles
            const userRoles = user.roles || [];
            setRoles({
                CLIENT: userRoles.includes('CLIENT'),
                FREELANCER: userRoles.includes('FREELANCER')
            });

            // Set current groups
            const userGroups = user.groups || [];
            setGroups({
                Support: userGroups.includes('Support'),
                Moderator: userGroups.includes('Moderator'),
                FinancialAdmin: userGroups.includes('FinancialAdmin')
            });

            // Check if current user is superuser (from localStorage or context)
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            setIsSuperuser(currentUser.is_superuser || false);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Update basic info
            await adminService.updateUser(user.id, formData);

            // Update roles
            const originalRoles = user.roles || [];
            for (const [role, isChecked] of Object.entries(roles)) {
                const hadRole = originalRoles.includes(role);
                if (isChecked && !hadRole) {
                    await adminService.assignRole(user.id, role);
                } else if (!isChecked && hadRole) {
                    await adminService.removeRole(user.id, role);
                }
            }

            // Update groups (only if superuser)
            if (isSuperuser) {
                const originalGroups = user.groups || [];
                for (const [group, isChecked] of Object.entries(groups)) {
                    const hadGroup = originalGroups.includes(group);
                    if (isChecked && !hadGroup) {
                        await adminService.assignGroup(user.id, group);
                    } else if (!isChecked && hadGroup) {
                        await adminService.removeGroup(user.id, group);
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto premium-card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Edit User</h2>
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
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Basic Information</h3>

                        <div>
                            <label className="block text-sm font-medium mb-2">First Name</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Last Name</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Roles */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">User Roles</h3>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={roles.CLIENT}
                                onChange={(e) => setRoles({ ...roles, CLIENT: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Client</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={roles.FREELANCER}
                                onChange={(e) => setRoles({ ...roles, FREELANCER: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Freelancer</span>
                        </label>
                    </div>

                    {/* Admin Groups (only for superuser) */}
                    {isSuperuser && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Admin Groups</h3>
                            <p className="text-sm text-gray-600">Only superusers can assign admin groups</p>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={groups.Support}
                                    onChange={(e) => setGroups({ ...groups, Support: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>Support</span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={groups.Moderator}
                                    onChange={(e) => setGroups({ ...groups, Moderator: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>Moderator</span>
                            </label>

                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={groups.FinancialAdmin}
                                    onChange={(e) => setGroups({ ...groups, FinancialAdmin: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>Financial Admin</span>
                            </label>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
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

export default UserEditModal;
