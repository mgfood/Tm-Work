import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Info, CheckCircle, X, HelpCircle } from 'lucide-react';

const GlobalConfirmModal = ({
    title,
    message,
    confirmText,
    cancelText,
    type, // 'confirm', 'prompt', 'alert'
    inputPlaceholder,
    inputValue: initialInputValue,
    variant, // 'danger', 'info', 'success', 'warning'
    onConfirm,
    onCancel
}) => {
    const [inputValue, setInputValue] = useState(initialInputValue || '');
    const inputRef = useRef(null);

    useEffect(() => {
        if (type === 'prompt' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [type]);

    const handleConfirmClick = () => {
        if (type === 'prompt') {
            onConfirm(inputValue);
        } else {
            onConfirm();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleConfirmClick();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertTriangle className="text-red-500" size={32} />;
            case 'success': return <CheckCircle className="text-green-500" size={32} />;
            case 'info': return <Info className="text-blue-500" size={32} />;
            case 'warning': return <HelpCircle className="text-yellow-500" size={32} />;
            default: return <AlertTriangle className="text-slate-500" size={32} />;
        }
    };

    const getConfirmBtnClasses = () => {
        const base = "px-6 py-2 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg";
        switch (variant) {
            case 'danger': return `${base} bg-red-600 hover:bg-red-700 shadow-red-200`;
            case 'success': return `${base} bg-green-600 hover:bg-green-700 shadow-green-200`;
            case 'info': return `${base} bg-blue-600 hover:bg-blue-700 shadow-blue-200`;
            default: return `${base} bg-primary-600 hover:bg-primary-700 shadow-primary-200`;
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 relative animate-in zoom-in-95 duration-200 border border-white/20"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${variant === 'danger' ? 'bg-red-50' :
                        variant === 'success' ? 'bg-green-50' :
                            variant === 'info' ? 'bg-blue-50' : 'bg-yellow-50'
                        }`}>
                        {getIcon()}
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        {message}
                    </p>

                    {type === 'prompt' && (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={inputPlaceholder}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 mb-8 outline-none focus:border-primary-500 focus:bg-white transition-all font-bold text-slate-700"
                        />
                    )}

                    <div className="flex gap-3 w-full">
                        {type !== 'alert' && (
                            <button
                                onClick={onCancel}
                                data-testid="modal-cancel-button"
                                className="flex-1 px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirmClick}
                            data-testid="modal-confirm-button"
                            className={`flex-1 ${getConfirmBtnClasses()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalConfirmModal;
