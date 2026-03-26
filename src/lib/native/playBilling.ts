import { Capacitor, registerPlugin } from '@capacitor/core';

export type PlayBillingProductType = 'inapp' | 'subs';

export type PlayBillingProduct = {
  productId: string;
  productType: PlayBillingProductType;
  title?: string;
  description?: string;
  formattedPrice?: string;
  currencyCode?: string;
  priceAmountMicros?: string;
  offerToken?: string | null;
};

export type PlayBillingPurchase = {
  orderId?: string | null;
  packageName?: string | null;
  products: string[];
  purchaseToken: string;
  purchaseState?: string | null;
  acknowledged: boolean;
};

interface PlayBillingPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  getProducts(options: { productIds: string[]; productType: PlayBillingProductType }): Promise<{ products: PlayBillingProduct[] }>;
  purchase(options: {
    productId: string;
    productType: PlayBillingProductType;
    offerToken?: string | null;
    obfuscatedAccountId?: string;
  }): Promise<PlayBillingPurchase>;
  consumePurchase(options: { purchaseToken: string }): Promise<{ consumed: boolean }>;
  acknowledgePurchase(options: { purchaseToken: string }): Promise<{ acknowledged: boolean }>;
}

const PlayBilling = registerPlugin<PlayBillingPlugin>('PlayBilling');

export const isNativeAndroidApp = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const isPlayBillingAvailable = async (): Promise<boolean> => {
  if (!isNativeAndroidApp()) {
    return false;
  }

  try {
    const result = await PlayBilling.isAvailable();
    return result.available === true;
  } catch {
    return false;
  }
};

export const getPlayBillingProducts = async (
  productIds: string[],
  productType: PlayBillingProductType,
): Promise<PlayBillingProduct[]> => {
  const result = await PlayBilling.getProducts({ productIds, productType });
  return Array.isArray(result.products) ? result.products : [];
};

export const launchPlayBillingPurchase = async (options: {
  productId: string;
  productType: PlayBillingProductType;
  offerToken?: string | null;
  obfuscatedAccountId?: string;
}): Promise<PlayBillingPurchase> =>
  await PlayBilling.purchase(options);

export const consumePlayBillingPurchase = async (purchaseToken: string): Promise<void> => {
  await PlayBilling.consumePurchase({ purchaseToken });
};

export const acknowledgePlayBillingPurchase = async (purchaseToken: string): Promise<void> => {
  await PlayBilling.acknowledgePurchase({ purchaseToken });
};
