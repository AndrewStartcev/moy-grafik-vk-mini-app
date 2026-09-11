import { useEffect, useState } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import { useAdaptivity, useAppearance, useInsets } from '@vkontakte/vk-bridge-react';
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import { App } from './App';
import { transformVKBridgeAdaptivity } from './helpers/transformVKBridgeAdaptivity';
import { vkPlatform } from './services/vkPlatform';
import './styles/app.css';
import './styles/theme.css';
import './styles/polish.css';
import './styles/story.css';

type AppAppearance = 'light' | 'dark';

function getSystemAppearance(): AppAppearance {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppConfig() {
  const vkAppearance = useAppearance();
  const safeAreaInsets = useInsets() || undefined;
  const adaptivityProps = transformVKBridgeAdaptivity(useAdaptivity());
  const [systemAppearance, setSystemAppearance] = useState<AppAppearance>(getSystemAppearance);
  const appearance: AppAppearance = vkAppearance === 'dark' || vkAppearance === 'light'
    ? vkAppearance
    : systemAppearance;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemAppearance(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.appAppearance = appearance;
    document.documentElement.dataset.vkPlatform = vkPlatform.platform ?? 'browser';
    document.documentElement.style.colorScheme = appearance;

    const background = appearance === 'dark' ? '#19191a' : '#f2f3f5';
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', background);

    if (vkBridge.isWebView()) {
      void vkBridge.send('VKWebAppSetViewSettings', {
        status_bar_style: appearance === 'dark' ? 'light' : 'dark',
        action_bar_color: background,
        navigation_bar_color: background,
      }).catch(() => undefined);
    }
  }, [appearance]);

  return (
    <ConfigProvider
      colorScheme={appearance}
      platform={vkPlatform.isDesktopWeb ? 'vkcom' : undefined}
      isWebView={vkBridge.isWebView()}
      hasCustomPanelHeaderAfter
    >
      <AdaptivityProvider {...adaptivityProps}>
        <AppRoot mode="full" safeAreaInsets={safeAreaInsets}>
          <App />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}
