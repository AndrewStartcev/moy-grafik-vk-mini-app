import vkBridge from '@vkontakte/vk-bridge';
import { useAppearance, useInsets } from '@vkontakte/vk-bridge-react';
import { AdaptivityProvider, AppRoot, ConfigProvider } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import { App } from './App';
import './styles/app.css';

export function AppConfig() {
  const appearance = useAppearance() || undefined;
  const safeAreaInsets = useInsets() || undefined;

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
