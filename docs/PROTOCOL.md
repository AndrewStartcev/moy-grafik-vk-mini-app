# VK Apps production protocol

Этот документ — первый рабочий регламент отдела VK Apps. Всё повторяемое из проекта «Мой график» должно использоваться в следующих приложениях.

## 1. Pipeline

```text
idea
↓
market sanity check
↓
MVP scope
↓
product spec
↓
UI/UX contract
↓
architecture
↓
domain logic
↓
functional browser MVP
↓
VK integration
↓
storage
↓
ads
↓
analytics
↓
QA
↓
owner acceptance
↓
VK moderation
↓
release
↓
metrics review
```

## 2. Product gate

Перед кодом ответить:

- какую одну проблему решает приложение;
- зачем пользователь вернётся;
- можно ли получить ценность менее чем за минуту;
- нужен ли backend на самом деле;
- можно ли монетизировать без разрушения UX;
- можно ли выпустить MVP за 1–2 дня разработки после готового starter kit.

Если ответ требует большого продукта, идея не подходит под fast-utility pipeline.

## 3. Scope freeze

После согласования MVP новые идеи складываются в `Later`, но не реализуются до релиза.

Исключение: критическая функциональность без которой основной сценарий не работает.

## 4. Technical baseline

Каждый VK utility app должен иметь:

- TypeScript;
- строгую типизацию домена;
- VK integration layer;
- browser fallback;
- Storage abstraction;
- Ad abstraction;
- Analytics abstraction;
- error boundary;
- light/dark support;
- mobile/desktop layout;
- typecheck/lint/test/build scripts.

## 5. VK isolation rule

Запрещено вызывать `bridge.send(...)` непосредственно из бизнес-компонентов.

Правильно:

```text
feature → service interface → VK implementation
```

Это обязательно для тестируемости и переноса кода.

## 6. Storage rule

- local-first UX;
- ошибки облачного/VK storage не блокируют продукт;
- данные имеют версию;
- миграции последовательные;
- не хранить генерируемые производные данные;
- хранить только минимальную модель пользователя.

## 7. Ad rule

До первой полезной ценности рекламу не показывать.

Interstitial запрещён:

- при каждом запуске;
- при каждом tap;
- при листании экранов/месяцев;
- в onboarding;
- сразу после ошибки.

Frequency cap хранится локально и управляется централизованно.

## 8. Analytics rule

Минимум событий:

```text
app_open
primary_action_started
primary_action_completed
return_usage_action
ad_request
ad_shown
ad_failed
fatal_error
```

Каждый продукт добавляет свои domain events.

Не собирать лишние персональные данные.

## 9. QA gate

Перед передачей владельцу:

```text
typecheck = pass
lint = pass
tests = pass
build = pass
```

Плюс ручные сценарии:

- первый запуск;
- повторный запуск;
- light/dark;
- mobile;
- desktop;
- запуск вне VK;
- storage failure fallback;
- ad failure does not break UI.

## 10. Owner acceptance

Владелец продукта не должен проверять технические детали. Ему передаётся короткий сценарный checklist.

Все найденные проблемы исправляет разработчик.

## 11. Release gate

До публикации подготовить:

- название;
- короткое и полное описание;
- иконки;
- скриншоты;
- privacy/legal pages, если требуются;
- production URL;
- VK app settings checklist;
- moderation checklist.

## 12. Post-release

Не добавлять новые функции сразу после релиза «на ощущениях».

Сначала накопить данные:

- activation;
- D1/D7;
- DAU/MAU;
- sessions per user;
- ad impressions per active user;
- revenue;
- crashes/errors;
- qualitative feedback.

После этого выбрать:

- scale;
- improve retention;
- improve monetization;
- freeze;
- sunset.

## 13. Что вынести в общий starter после «Моего графика»

После первого релиза выделить переиспользуемые части:

- app shell;
- VK init;
- theme/appearance;
- browser mock;
- storage provider;
- analytics provider;
- ads provider;
- error handling;
- CI;
- base styling;
- release docs template.

Следующее приложение должно стартовать с готового starter kit, а не с пустого Vite.
