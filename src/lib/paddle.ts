type PaddleEnvironment = 'sandbox' | 'production';
type PaddleTheme = 'light' | 'dark';

type PaddleCheckoutEvent = {
  name?: string;
  data?: Record<string, unknown>;
};

type PaddleCheckoutOpenOptions = {
  transactionId: string;
  successUrl: string;
  locale?: string;
  theme?: PaddleTheme;
};

type PaddleInstance = {
  Environment?: {
    set: (environment: PaddleEnvironment) => void;
  };
  Initialize: (options: {
    token: string;
    eventCallback?: (event: PaddleCheckoutEvent) => void;
  }) => void;
  Checkout: {
    open: (options: {
      transactionId: string;
      settings: {
        displayMode: 'overlay';
        theme: PaddleTheme;
        locale?: string;
        successUrl: string;
      };
    }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleInstance;
  }
}

const PADDLE_JS_URL = 'https://cdn.paddle.com/paddle/v2/paddle.js';

let paddleScriptPromise: Promise<void> | null = null;
let paddleInitKey = '';

const loadPaddleScript = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PADDLE_UNAVAILABLE'));
  }

  if (window.Paddle) {
    return Promise.resolve();
  }

  if (paddleScriptPromise) {
    return paddleScriptPromise;
  }

  paddleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${PADDLE_JS_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('PADDLE_SCRIPT_LOAD_FAILED')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PADDLE_JS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PADDLE_SCRIPT_LOAD_FAILED'));
    document.head.appendChild(script);
  });

  return paddleScriptPromise;
};

const normalizePaddleLocale = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'ko' || normalized === 'ja' || normalized === 'zh' || normalized === 'en') {
    return normalized;
  }

  return 'en';
};

export const openPaddleOverlayCheckout = async (params: {
  clientToken: string;
  environment: PaddleEnvironment;
  transactionId: string;
  successUrl: string;
  locale?: string;
  theme?: PaddleTheme;
}): Promise<void> => {
  if (!params.clientToken.trim() || !params.transactionId.trim()) {
    throw new Error('PAYMENT_NOT_CONFIGURED');
  }

  await loadPaddleScript();

  if (!window.Paddle) {
    throw new Error('PADDLE_UNAVAILABLE');
  }

  const initKey = `${params.environment}:${params.clientToken}`;
  if (paddleInitKey !== initKey) {
    if (params.environment === 'sandbox') {
      window.Paddle.Environment?.set('sandbox');
    }
    window.Paddle.Initialize({
      token: params.clientToken,
    });
    paddleInitKey = initKey;
  }

  window.Paddle.Checkout.open({
    transactionId: params.transactionId,
    settings: {
      displayMode: 'overlay',
      theme: params.theme ?? 'light',
      locale: normalizePaddleLocale(params.locale),
      successUrl: params.successUrl,
    },
  });
};
