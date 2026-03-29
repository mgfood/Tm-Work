import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, AlertTriangle, Settings } from 'lucide-react';
import adminService from '../../../api/adminService';

const SystemSettingsTab = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState({
        auto_delete_enabled: true,
        retention_days: 30,
        delete_name: true,
        delete_email: false,
        delete_bio: true,
        delete_skills: true,
        delete_social_links: true,
        delete_avatar: true,
        delete_portfolio: true,
        delete_messages: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await adminService.getSystemSettings();
            setSettings(prev => ({ ...prev, ...data }));
        } catch (err) {
            console.error("Failed to fetch settings:", err);
            setError(t('errors.general'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            setSuccessMsg('');
            const data = await adminService.updateSystemSettings(settings);
            setSettings(data);
            setSuccessMsg("Настройки успешно сохранены!");
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error("Failed to update settings:", err);
            setError("Не удалось сохранить настройки");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[90rem]">
            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3 text-sm font-medium border border-red-100">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}
            
            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-start gap-3 text-sm font-bold border border-green-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <p>{successMsg}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    
                    {/* General Settings Card */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col h-full hover:shadow-xl transition-shadow duration-500">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                            <div className="p-4 bg-primary-50 rounded-2xl text-primary-600">
                                <Settings size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Основные параметры</h2>
                                <p className="text-sm text-slate-500 font-medium">Глобальные настройки автоматизации</p>
                            </div>
                        </div>

                        <div className="space-y-8 flex-1">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                    Очистка удаленных аккаунтов
                                </h3>

                                <label className="flex items-start gap-4 cursor-pointer p-6 border-2 border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-50 transition-all">
                                    <div className="relative flex items-center mt-1 shrink-0">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.auto_delete_enabled}
                                            onChange={(e) => setSettings({ ...settings, auto_delete_enabled: e.target.checked })}
                                        />
                                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-[24px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 shadow-inner"></div>
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 text-lg">Автоматическая очистка (Анонимизация)</span>
                                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                            Сервер будет автоматически удалять личные данные, фото и переписки скрытых пользователей по истечении заданного срока. Финансовая история сохранится.
                                        </p>
                                        <div className="mt-4 p-4 bg-orange-50 text-orange-700 text-xs rounded-xl font-medium border border-orange-100">
                                            <strong>Внимание:</strong> Если вы включите эту функцию после отключения, дата отсчета для уже удаленных сбросится на сегодня.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className={`transition-all duration-300 bg-slate-50 p-6 rounded-2xl border border-slate-100 ${!settings.auto_delete_enabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                <label className="block text-sm font-black text-slate-800 mb-3 uppercase tracking-widest">
                                    Таймер хранения (Дней)
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        className="w-32 px-5 py-4 border-2 border-slate-200 rounded-2xl focus:border-primary-500 outline-none text-xl font-black text-center shadow-sm"
                                        value={settings.retention_days}
                                        onChange={(e) => setSettings({ ...settings, retention_days: Number(e.target.value) })}
                                        required
                                    />
                                    <span className="text-slate-400 font-medium">дней до полной анонимизации</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-4 italic">
                                    От 14 до 30 дней, чтобы у пользователя была возможность обратиться в поддержку.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Anonymization Policy Card */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 flex flex-col h-full hover:shadow-xl transition-shadow duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                        
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                            <div className="p-4 bg-red-50 rounded-2xl text-red-600">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Политика удаления данных</h2>
                                <p className="text-sm text-slate-500 font-medium">Гранулярный контроль стирания личных данных</p>
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-sm text-slate-600 mb-8 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                Выберите, какие данные будут <strong>необратимо стерты</strong> при удалении. Финансовая история (балансы, транзакции) всегда сохраняется с соблюдением требований безопасности кошелька.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'delete_name', label: 'Удалять Имя и Фамилию', desc: 'Заменять на пустые строки' },
                                    { id: 'delete_email', label: 'Полностью стирать Email', desc: 'Заменять на заглушку (archived.local)' },
                                    { id: 'delete_bio', label: 'Удалять Биографию', desc: 'Очищать описание, профессию, локацию' },
                                    { id: 'delete_skills', label: 'Удалять Навыки', desc: 'Удалять скиллы, языки и опыт' },
                                    { id: 'delete_social_links', label: 'Удалять Соц. сети', desc: 'Очищать привязанные ссылки' },
                                    { id: 'delete_avatar', label: 'Удалять Аватар профиля', desc: 'Физически удалять фото сервера' },
                                    { id: 'delete_portfolio', label: 'Удалять Портфолио', desc: 'Удалять фото примеров работ' },
                                    { id: 'delete_messages', label: 'Очищать переписки Чат', desc: 'Удалять отправленные сообщения' }
                                ].map(item => (
                                    <label key={item.id} className="flex items-start gap-3 cursor-pointer p-4 border-2 border-slate-100 rounded-2xl hover:border-slate-200 hover:bg-slate-50 transition-colors group">
                                        <div className="relative flex items-center mt-1 shrink-0">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings[item.id] || false}
                                                onChange={(e) => setSettings({ ...settings, [item.id]: e.target.checked })}
                                            />
                                            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-[20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600 shadow-inner"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{item.label}</div>
                                            <div className="text-[11px] text-slate-400 mt-1 leading-tight font-medium">{item.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end pt-6 mt-6 pb-20">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-3 px-10 py-5 bg-primary-600 text-white rounded-[24px] hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-black text-lg shadow-2xl shadow-primary-600/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {saving ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <Save size={24} />
                        )}
                        Применить настройки
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SystemSettingsTab;
