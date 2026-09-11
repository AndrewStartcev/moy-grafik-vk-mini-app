import {
  type AdaptivityProps,
  getViewHeightByViewportHeight,
  getViewWidthByViewportWidth,
  ViewWidth,
} from '@vkontakte/vkui';
import type { UseAdaptivity } from '@vkontakte/vk-bridge-react';

export function transformVKBridgeAdaptivity({
  type,
  viewportWidth,
  viewportHeight,
}: UseAdaptivity): AdaptivityProps {
  switch (type) {
    case 'adaptive':
      return {
        viewWidth: getViewWidthByViewportWidth(viewportWidth),
        viewHeight: getViewHeightByViewportHeight(viewportHeight),
      };
    case 'force_mobile':
    case 'force_mobile_compact':
      return {
        viewWidth: ViewWidth.MOBILE,
        density: type === 'force_mobile_compact' ? 'compact' : 'regular',
      };
    default:
      return {};
  }
}
