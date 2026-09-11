# VK production layer

Актуально для VK App ID `54765581`.

## Что реализовано в коде

### Инициализация и окружение

- `VKWebAppInit` вызывается при старте приложения.
- launch params разбираются через `parseURLSearchParamsForGetLaunchParams`.
- определяются `vk_app_id`, `vk_user_id`, `vk_language`, `vk_platform`.
- desktop VK получает `platform="vkcom"` в VKUI.
- VK Bridge adaptivity передаётся в `AdaptivityProvider`.
- safe area берётся из VK Bridge.
- light/dark appearance автоматически следует за темой VK; вне VK используется системная тема.
- в mobile WebView синхронизируются status/action/navigation bar с темой приложения.

### Навигация и lifecycle

- внутренние экраны синхронизированы с browser history.
- `VKWebAppSetSwipeSettings` переключается между корневым и вложенным экраном.
- Android/system Back возвращает из настроек в календарь через history.
- обрабатываются `VKWebAppViewHide` и `VKWebAppViewRestore`.
- на hide/pagehide выполняется flush сохранений и аналитики.

### Хранение

- local-first: пользовательские данные мгновенно сохраняются в `localStorage`.
- VK Storage используется как облачная копия.
- запись в VK Storage имеет debounce 600 ms и последовательную очередь.
- JSON разбивается на chunks по 3000 символов, чтобы не упираться в размер одного значения VK Storage.
- поддерживается чтение старого ключа `moy_grafik_schedule` для миграции.
- данные валидируются перед использованием.
- Bridge timeout не может заблокировать запуск приложения.

### Реклама

Реклама интегрирована, но код безопасно работает и пока рекламный кабинет не активирован.

Banner:

- проверяется поддержка Bridge method;
- затем `VKWebAppCheckBannerAd`;
- показывается только на основном календаре;
- onboarding и настройки остаются без рекламы;
- баннер скрывается при уходе с календаря.

Interstitial:

- проверяется поддержка и наличие рекламы;
- не показывается первые 3 открытия;
- не более одного interstitial за JS-сессию;
- cooldown между показами — 6 часов;
- недоступность рекламы или кабинет на проверке не влияют на работу приложения.

Все запросы/показы/ошибки рекламы идут в AnalyticsService.

## Аналитика

События продукта фиксируются через единый `AnalyticsService`.

Пока backend отсутствует:

- локально считаются event counters;
- в development события видны в console;
- никакой внешний запрос не делается.

Для будущего собственного endpoint достаточно указать:

```env
VITE_ANALYTICS_ENDPOINT=https://example.com/events
```

После этого события автоматически отправляются batch-ами через `sendBeacon`/`fetch keepalive`.

## VK Hosting

`vk-hosting-config.json`:

- App ID: `54765581`;
- source directory: `dist`;
- один `index.html` для mobile/mvk/web.

Vite собирает relative assets (`base: './'`).

Deploy package: `@vkontakte/vk-miniapps-deploy >= 1.0`.

Команда:

```bash
npm run deploy
```

Перед deploy автоматически выполняется production build.

## Что зависит от кабинета VK, а не от кода

До отправки на модерацию владелец приложения должен проверить/заполнить в кабинете:

- название, описание, категория;
- иконки и промо-изображения требуемых размеров;
- URL/hosting version;
- тестовую группу/доступ, если используется;
- политику конфиденциальности и иные обязательные ссылки, если их потребует текущая форма публикации;
- рекламную монетизацию после одобрения рекламного кабинета;
- данные для публикации и отправку на модерацию.

Код приложения не запрашивает лишние permissions: профиль, телефон, email, геолокация, платежи и токены сообщества для MVP не используются.
