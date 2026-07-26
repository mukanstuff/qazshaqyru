'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  getClientCaptchaProvider,
  getClientCaptchaSiteKey,
  isCaptchaRequiredOnClient,
} from '@/lib/shared/captcha-client';

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const HCAPTCHA_SCRIPT = 'https://js.hcaptcha.com/1/api.js?render=explicit';

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

type HCaptchaApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark';
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    hcaptcha?: HCaptchaApi;
  }
}

function loadScript(src: string, id: string): Promise<void> {
  if (document.getElementById(id)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export interface CaptchaWidgetProps {
  onTokenChange: (token: string | null) => void;
  className?: string;
}

export function CaptchaWidget({ onTokenChange, className }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const reactId = useId();
  const containerId = `captcha-${reactId.replace(/:/g, '')}`;

  const required = isCaptchaRequiredOnClient();
  const provider = getClientCaptchaProvider();
  const siteKey = getClientCaptchaSiteKey();

  const handleExpire = useCallback(() => {
    onTokenChange(null);
  }, [onTokenChange]);

  useEffect(() => {
    if (!required || !siteKey || !containerRef.current) return;

    let cancelled = false;

    const mount = async () => {
      try {
        if (provider === 'turnstile') {
          await loadScript(TURNSTILE_SCRIPT, 'turnstile-api');
          if (cancelled || !containerRef.current || !window.turnstile) return;
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => onTokenChange(token),
            'expired-callback': handleExpire,
            'error-callback': handleExpire,
            theme: 'auto',
          });
        } else if (provider === 'hcaptcha') {
          await loadScript(HCAPTCHA_SCRIPT, 'hcaptcha-api');
          if (cancelled || !containerRef.current || !window.hcaptcha) return;
          widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => onTokenChange(token),
            'expired-callback': handleExpire,
            'error-callback': handleExpire,
            theme: 'light',
          });
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    };

    void mount();

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (!widgetId) return;
      if (provider === 'turnstile' && window.turnstile) {
        window.turnstile.remove(widgetId);
      } else if (provider === 'hcaptcha' && window.hcaptcha) {
        window.hcaptcha.remove(widgetId);
      }
    };
  }, [required, siteKey, provider, onTokenChange, handleExpire]);

  if (!required) return null;

  return (
    <div className={className}>
      <div id={containerId} ref={containerRef} data-testid="captcha-widget" />
      {loadError && (
        <p className="mt-1 text-xs text-us-danger" role="alert">
          Не удалось загрузить проверку. Обновите страницу.
        </p>
      )}
    </div>
  );
}
