import vkBridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge';

export type AppScreen = 'calendar' | 'settings' | 'onboarding';

function parseLaunchParams() {
  try {
    return parseURLSearchParamsForGetLaunchParams(window.location.search);
  } catch {
    return {};
  }
}

export const vkLaunchParams = parseLaunchParams();

export const vkPlatform = {
  appId: vkLaunchParams.vk_app_id ?? null,
  userId: vkLaunchParams.vk_user_id ?? null,
  language: vkLaunchParams.vk_language ?? 'ru',
  platform: vkLaunchParams.vk_platform ?? null,
  isEmbedded: vkBridge.isEmbedded(),
  isDesktopWeb: vkLaunchParams.vk_platform === 'desktop_web',
};

export async function configureVkShell(isRootScreen: boolean): Promise<void> {
  if (!vkBridge.isEmbedded()) return;

  try {
    await vkBridge.send('VKWebAppSetSwipeSettings', { history: isRootScreen });
  } catch {
    // Unsupported clients should not block the application.
  }
}

export function subscribeVkLifecycle(callbacks: {
  onHide?: () => void;
  onRestore?: () => void;
}): () => void {
  const handler: Parameters<typeof vkBridge.subscribe>[0] = (event) => {
    if (!event?.detail) return;

    if (event.detail.type === 'VKWebAppViewHide') {
      callbacks.onHide?.();
    }

    if (event.detail.type === 'VKWebAppViewRestore') {
      callbacks.onRestore?.();
    }
  };

  vkBridge.subscribe(handler);
  return () => vkBridge.unsubscribe(handler);
}

export function pushScreenState(screen: AppScreen): void {
  const current = window.history.state as { screen?: AppScreen } | null;
  if (current?.screen === screen) return;
  window.history.pushState({ screen }, '', window.location.href);
}

export function replaceScreenState(screen: AppScreen): void {
  window.history.replaceState({ screen }, '', window.location.href);
}

export function screenFromHistoryState(value: unknown): AppScreen | null {
  if (!value || typeof value !== 'object') return null;
  const screen = (value as { screen?: unknown }).screen;
  return screen === 'calendar' || screen === 'settings' || screen === 'onboarding' ? screen : null;
}
