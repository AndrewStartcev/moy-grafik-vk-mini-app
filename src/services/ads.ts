import vkBridge from '@vkontakte/vk-bridge';
import { analytics } from './analytics';

const OPEN_COUNT_KEY = 'moy_grafik_ad_open_count';
const LAST_INTERSTITIAL_KEY = 'moy_grafik_last_interstitial';
const MIN_OPENS_BEFORE_INTERSTITIAL = 4;
const INTERSTITIAL_COOLDOWN_MS = 6 * 60 * 60 * 1000;

let interstitialShownThisSession = false;
let sessionOpenRegistered = false;
let bannerVisible = false;

function readNumber(key: string): number {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeNumber(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ads must never affect the product if storage is unavailable.
  }
}

function currentOpenCount(): number {
  if (!sessionOpenRegistered) {
    sessionOpenRegistered = true;
    const next = readNumber(OPEN_COUNT_KEY) + 1;
    writeNumber(OPEN_COUNT_KEY, next);
    return next;
  }
  return readNumber(OPEN_COUNT_KEY);
}

async function supports(method: Parameters<typeof vkBridge.supportsAsync>[0]): Promise<boolean> {
  if (!vkBridge.isEmbedded()) return false;
  try {
    return await vkBridge.supportsAsync(method);
  } catch {
    return false;
  }
}

async function showBanner(): Promise<boolean> {
  if (bannerVisible || !(await supports('VKWebAppCheckBannerAd'))) return false;

  analytics.track('ad_request', { format: 'banner' });

  try {
    const availability = await vkBridge.send('VKWebAppCheckBannerAd');
    if (!availability.result) return false;

    const result = await vkBridge.send('VKWebAppShowBannerAd', {
      banner_location: 'bottom',
      banner_align: 'center',
      layout_type: 'resize',
      can_close: true,
    });

    bannerVisible = Boolean(result.result);
    if (bannerVisible) analytics.track('ad_shown', { format: 'banner' });
    return bannerVisible;
  } catch (error) {
    analytics.track('ad_failed', {
      format: 'banner',
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return false;
  }
}

async function hideBanner(): Promise<void> {
  if (!bannerVisible || !(await supports('VKWebAppHideBannerAd'))) return;

  try {
    await vkBridge.send('VKWebAppHideBannerAd');
  } catch {
    // Ignore: an unavailable ad must never break navigation.
  } finally {
    bannerVisible = false;
  }
}

async function maybeShowInterstitial(): Promise<boolean> {
  if (interstitialShownThisSession || !(await supports('VKWebAppCheckNativeAds'))) return false;

  const opens = currentOpenCount();
  if (opens < MIN_OPENS_BEFORE_INTERSTITIAL) return false;

  const lastShownAt = readNumber(LAST_INTERSTITIAL_KEY);
  if (Date.now() - lastShownAt < INTERSTITIAL_COOLDOWN_MS) return false;

  analytics.track('ad_request', { format: 'interstitial' });

  try {
    const availability = await vkBridge.send('VKWebAppCheckNativeAds', {
      ad_format: 'interstitial',
    });
    if (!availability.result) return false;

    const result = await vkBridge.send('VKWebAppShowNativeAds', {
      ad_format: 'interstitial',
    });

    if (result.result) {
      interstitialShownThisSession = true;
      writeNumber(LAST_INTERSTITIAL_KEY, Date.now());
      analytics.track('ad_shown', { format: 'interstitial' });
      return true;
    }
  } catch (error) {
    analytics.track('ad_failed', {
      format: 'interstitial',
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }

  return false;
}

export const ads = {
  showBanner,
  hideBanner,
  maybeShowInterstitial,
};
