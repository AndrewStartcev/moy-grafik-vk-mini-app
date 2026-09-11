import { useEffect, useState } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import { useAppearance, useInsets } from '@vkontakte/vk-bridge-react';
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import { App } from './App';
import './styles/app.css';
import './styles/theme.css';
import './styles/polish.css';

type AppAppearance = 'light' | 'dark';

function getSystemAppearance(): AppAppearance {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppConfig() {
  const vkAppearance = useAppearance();
  const safeAreaInsets = useInsets() || undefined;
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
    document.documentElement.style.colorScheme = appearance;
  }, [appearance]);

  return (
    <ConfigProvider colorScheme={appearance} isWebView={vkBridge.isWebView()}>
      <AdaptivityProvider>
        <AppRoot mode="full" safeAreaInsets={safeAreaInsets}>
          <App />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}
