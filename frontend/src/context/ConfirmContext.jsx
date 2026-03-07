import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import GlobalConfirmModal from '../components/common/GlobalConfirmModal';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'confirm', // 'confirm' | 'prompt' | 'alert'
        inputPlaceholder: '',
        inputValue: '', // Default value for prompt
        variant: 'danger', // 'danger' | 'info' | 'success' | 'warning'
    });

    const resolveRef = useRef(null);

    const confirm = useCallback(({
        title = 'Are you sure?',
        message = '',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        type = 'confirm',
        inputPlaceholder = '',
        defaultValue = '',
        variant = 'danger'
    }) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title,
                message,
                confirmText,
                cancelText,
                type,
                inputPlaceholder,
                inputValue: defaultValue,
                variant
            });
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = (value) => {
        setState(prev => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(state.type === 'prompt' ? value : true);
            resolveRef.current = null;
        }
    };

    const handleCancel = () => {
        setState(prev => ({ ...prev, isOpen: false }));
        if (resolveRef.current) {
            resolveRef.current(state.type === 'prompt' ? null : false);
            resolveRef.current = null;
        }
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {state.isOpen && (
                <GlobalConfirmModal
                    {...state}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmContext.Provider>
    );
};
