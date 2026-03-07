import React, { useState, useEffect } from 'react';
import { Shield, UserCog, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import adminService from '../../api/adminService';

const StaffManagementTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [staffRes, rolesRes] = await Promise.all([
                adminService.getStaff(),
                adminService.getAdminRoles()
            ]);
            const staffData = Array.isArray(staffRes) ? staffRes : (staffRes?.data || []);
            const rolesData = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data || []);
            setStaff(staffData);
            setRoles(rolesData);
        } catch (err) {
            showToast(t('admin.failed_to_load'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async (userId, roleId) => {
        try {
            await adminService.assignAdminRole(userId, roleId);
            showToast('Роль успешно назначена', 'success');
            fetchData();
        } catch (err) {
            showToast('Ошибка назначения роли', 'error');
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Загрузка...</div>;
    }

    return (
        <div data-testid="staff-tab" className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    <UserCog className="inline mr-2" size={28} />
                    {t('admin.staff_mgmt')}
                </h2>
                <p className="text-slate-600">Всего сотрудников: {staff.length}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Имя</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Роль</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Статус</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staff.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-900">{user.email}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{user.full_name}</td>
                                <td className="px-6 py-4">
                                    {user.admin_role ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                            <Shield size={14} className="mr-1" />
                                            {user.admin_role.name}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-sm">Нет роли</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_active ? (
                                        <span className="text-green-600 text-sm">●Активен</span>
                                    ) : (
                                        <span className="text-red-600 text-sm">● Заблокирован</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        value={user.admin_role?.id || ''}
                                        onChange={(e) => handleAssignRole(user.id, e.target.value || null)}
                                    >
                                        <option value="">Снять роль</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StaffManagementTab;
