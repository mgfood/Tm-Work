import React, { useState, useEffect } from 'react';
import { 
    Shield, UserCog, Search, UserPlus, 
    CheckCircle, XCircle, Info, Trash2,
    Briefcase, DollarSign, Globe, Star, Gavel,
    ChevronDown, MoreHorizontal
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import adminService from '../../api/adminService';
import { useAuth } from '../../context/AuthContext';

const ROLE_ICONS = {
    super_admin: <Star size={14} className="text-amber-500" />,
    moderator: <Shield size={14} className="text-blue-500" />,
    arbiter: <Gavel size={14} className="text-purple-500" />,
    finance_manager: <DollarSign size={14} className="text-green-500" />
};

const StaffManagementTab = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user: currentUser } = useAuth();
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchEmail, setSearchEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);

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
            setStaff(Array.isArray(staffRes) ? staffRes : staffRes?.data || []);
            setRoles(Array.isArray(rolesRes) ? rolesRes : rolesRes?.data || []);
        } catch (err) {
            showToast('Ошибка загрузки данных персонала', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRole = async (userId, roleId) => {
        try {
            await adminService.assignAdminRole(userId, roleId);
            showToast('Роль успешно обновлена', 'success');
            fetchData();
            setSearchEmail('');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Ошибка назначения роли', 'error');
        }
    };

    const handleAddStaffByEmail = async (e) => {
        e.preventDefault();
        if (!searchEmail) return;
        
        try {
            setIsSearching(true);
            // Search for user by email using general user management API
            const users = await adminService.getUsers({ email: searchEmail });
            const user = users.results?.find(u => u.email.toLowerCase() === searchEmail.toLowerCase());
            
            if (!user) {
                showToast('Пользователь с таким Email не найден', 'warning');
                return;
            }

            if (user.is_staff && user.admin_role) {
                showToast('Пользователь уже является сотрудником', 'info');
                return;
            }

            // If found, assign moderator role as default or let user pick from table later
            handleAssignRole(user.id, roles.find(r => r.codename === 'moderator')?.id);
        } catch (err) {
            showToast('Ошибка поиска пользователя', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        Управление персоналом
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Назначайте роли сотрудникам и контролируйте уровни доступа к платформе
                    </p>
                </div>
                
                {/* Quick Add Form */}
                <form onSubmit={handleAddStaffByEmail} className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="email"
                            placeholder="Email нового сотрудника..."
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all w-64"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isSearching}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-primary-200"
                    >
                        <UserPlus size={18} />
                        {isSearching ? 'Поиск...' : 'Добавить'}
                    </button>
                </form>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: 'Всего Staff', value: staff.length, icon: <UserCog className="text-primary-600" /> },
                    { label: 'Модераторы', value: staff.filter(u => u.admin_role?.codename === 'moderator').length, icon: <Shield className="text-blue-600" /> },
                    { label: 'Арбитры', value: staff.filter(u => u.admin_role?.codename === 'arbiter').length, icon: <Gavel className="text-purple-600" /> },
                    { label: 'Финансы', value: staff.filter(u => u.admin_role?.codename === 'finance_manager').length, icon: <DollarSign className="text-green-600" /> },
                    { label: 'Супер-админы', value: staff.filter(u => u.is_superuser || u.admin_role?.codename === 'super_admin').length, icon: <Star className="text-amber-600" /> },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-slate-50 rounded-lg">{stat.icon}</div>
                            <span className="text-xl font-bold text-slate-800">{stat.value}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Staff Table */}
            {/* Staff Table Container */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-visible min-h-[400px]">
                <div className="overflow-visible w-full pb-32">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider">Сотрудник</th>
                                <th className="px-6 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider">Роль</th>
                                <th className="px-6 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider">Доступы</th>
                                <th className="px-6 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider">Статус</th>
                                <th className="px-6 py-5 text-sm font-bold text-slate-600 uppercase tracking-wider text-right px-10">Действие</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {staff.map(user => (
                                <tr key={user.id} className={`group hover:bg-slate-50/80 transition-all ${user.email === currentUser?.email ? 'bg-primary-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm overflow-hidden text-sm">
                                                {user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    {user.full_name || 'Без имени'}
                                                    {user.email === currentUser?.email && (
                                                        <span className="text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full">Вы</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.is_superuser ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold w-fit border border-amber-200 shadow-sm">
                                                <Star size={14} fill="currentColor" />
                                                SuperAdmin
                                            </div>
                                        ) : user.admin_role ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold w-fit border border-slate-200">
                                                {ROLE_ICONS[user.admin_role.codename]}
                                                {user.admin_role.name}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs font-bold italic">Временный доступ</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {(user.is_superuser || user.admin_role?.can_manage_finance) && <DollarSign size={16} className="text-green-500" title="Финансы" />}
                                            {(user.is_superuser || user.admin_role?.can_manage_users) && <UserCog size={16} className="text-blue-500" title="Пользователи" />}
                                            {(user.is_superuser || user.admin_role?.can_manage_jobs) && <Briefcase size={16} className="text-purple-500" title="Задания" />}
                                            {(user.is_superuser || user.admin_role?.can_manage_admins) && <Shield size={16} className="text-amber-500" title="Управление персоналом" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${user.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                            {user.is_active ? 'Активен' : 'Блок'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.email !== currentUser?.email ? (
                                            <div className="flex items-center justify-end gap-3">
                                                {/* Premium Custom Dropdown */}
                                                <Menu as="div" className="relative inline-block text-left">
                                                    {({ open }) => (
                                                        <>
                                                            <Menu.Button 
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-primary-300 transition-all shadow-sm active:scale-95 group"
                                                            >
                                                                {user.admin_role ? (
                                                                    <span className="flex items-center gap-2">
                                                                        {ROLE_ICONS[user.admin_role.codename]}
                                                                        {user.admin_role.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-red-500">Без роли</span>
                                                                )}
                                                                <ChevronDown size={14} className={`text-slate-400 group-hover:text-primary-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                                                            </Menu.Button>

                                                            {/* We use standard Transition, but notice: simple CSS works better for table menus if we avoid too much nesting */}
                                                            <Transition
                                                                as={Fragment}
                                                                enter="transition ease-out duration-200"
                                                                enterFrom="transform opacity-0 scale-95"
                                                                enterTo="transform opacity-100 scale-100"
                                                                leave="transition ease-in duration-75"
                                                                leaveFrom="transform opacity-100 scale-100"
                                                                leaveTo="transform opacity-0 scale-95"
                                                            >
                                                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-slate-100 rounded-2xl bg-white shadow-2xl border border-slate-100 focus:outline-none z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
                                                            <div className="px-1 py-1">
                                                                <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Изменить роль</div>
                                                                {roles.map((role) => (
                                                                    <Menu.Item key={role.id}>
                                                                        {({ active }) => (
                                                                            <button
                                                                                onClick={() => handleAssignRole(user.id, role.id)}
                                                                                className={`${
                                                                                    active ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                                                                                } group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors`}
                                                                            >
                                                                                <div className={`p-1.5 rounded-lg ${active ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                                                                                    {ROLE_ICONS[role.codename]}
                                                                                </div>
                                                                                {role.name}
                                                                                {user.admin_role?.id === role.id && (
                                                                                    <CheckCircle size={14} className="ml-auto text-primary-500" />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </Menu.Item>
                                                                ))}
                                                            </div>
                                                            <div className="px-1 py-1">
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => handleAssignRole(user.id, null)}
                                                                            className={`${
                                                                                active ? 'bg-red-50 text-red-700' : 'text-red-600'
                                                                            } group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors`}
                                                                        >
                                                                            <div className={`p-1.5 rounded-lg ${active ? 'bg-white shadow-sm' : 'bg-red-50'}`}>
                                                                                <XCircle size={14} />
                                                                            </div>
                                                                            Уволить / Снять
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            </div>
                                                        </Menu.Items>
                                                            </Transition>
                                                        </>
                                                    )}
                                                </Menu>
                                                
                                                <button 
                                                    onClick={() => handleAssignRole(user.id, null)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                    title="Удалить из персонала"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end px-4 gap-2 text-slate-400 italic">
                                                <Shield size={14} />
                                                <span className="text-[10px]">Управление заблокировано</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {staff.length === 0 && (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                        <UserCog size={48} className="opacity-20" />
                        <p>Список сотрудников пуст</p>
                    </div>
                )}
            </div>
            
            {/* Info Section */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-primary-600">
                    <Info size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800">Уведомление о правах</h4>
                    <p className="text-sm text-slate-600 mt-1">
                        Главные администраторы имеют полный доступ. Модераторы могут только проверять контент. 
                        Арбитры разрешают споры по заказам. Финансовые менеджеры могут просматривать доходы и <strong>запрашивать</strong> изменения баланса.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffManagementTab;
