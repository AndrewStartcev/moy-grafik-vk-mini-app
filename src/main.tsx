import { createRoot } from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig';

void vkBridge.send('VKWebAppInit').catch(() => {
  // Outside VK the application intentionally continues in browser fallback mode.
});

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found');
}

createRoot(root).render(<AppConfig />);
