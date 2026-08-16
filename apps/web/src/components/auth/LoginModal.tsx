'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Path to return to after successful login */
  returnTo?: string;
}

export function LoginModal({ open, onClose, returnTo }: LoginModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="login-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Вход"
    >
      <div className="login-modal">
        <button
          type="button"
          className="login-modal__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="login-modal__header">
          <h2 className="login-modal__title">Войдите, чтобы сохранить</h2>
          <p className="login-modal__subtitle">
            После входа ваши изменения будут сохранены автоматически
          </p>
        </div>

        <div className="login-modal__actions">
          <GoogleLoginButton
            returnTo={returnTo ?? '/dashboard'}
            className="login-modal__google-btn"
          />
        </div>

        <p className="login-modal__footnote">
          Продолжая, вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  );
}
