import React from 'react';
import {
    CheckCircle, XCircle, AlertTriangle,
    Info, X
} from 'lucide-react';

const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-primary-500" size={20} />
};

const bgColors = {
    success: 'bg-green-50 border-green-100',
    error: 'bg-red-50 border-red-100',
    warning: 'bg-amber-50 border-amber-100',
    info: 'bg-primary-50 border-primary-100'
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        flex items-center gap-3 p-4 rounded-2xl border shadow-xl 
                        ${bgColors[toast.type]} 
                        animate-in slide-in-from-right fade-in duration-300
                    `}
                >
                    <div className="flex-shrink-0">
                        {icons[toast.type] || icons.info}
                    </div>
                    <div className="flex-grow text-sm font-bold text-slate-800">
                        {toast.message}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={16} />
                    </button>

                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 h-1 bg-black/5 rounded-full overflow-hidden w-full">
                        <div
                            className={`h-full opacity-30 ${toast.type === 'success' ? 'bg-green-600' :
                                    toast.type === 'error' ? 'bg-red-600' :
                                        toast.type === 'warning' ? 'bg-amber-600' : 'bg-primary-600'
                                }`}
                            style={{
                                animation: 'toast-progress 5s linear forwards'
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};
