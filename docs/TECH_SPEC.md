# Technical specification — «Мой график»

## 1. Архитектурная цель

Приложение должно быть простым в эксплуатации, работать без собственного backend и не связывать календарную бизнес-логику с VK API.

Слои:

```text
UI / React
   ↓
Application state
   ↓
Domain / Schedule Engine
   ↓
Services
   ├── StorageService
   ├── VkService
   ├── AdService
   └── AnalyticsService
```

## 2. Предлагаемая структура

```text
src/
  app/
    App.tsx
    providers/
    router/

  components/
    AppHeader/
    StateView/

  features/
    onboarding/
    schedule/
    calendar/
    statistics/
    settings/

  domain/
    schedule/
      presets.ts
      engine.ts
      statistics.ts
      types.ts
      migrations.ts

  services/
    vk/
    storage/
    ads/
    analytics/

  store/
  styles/
  utils/
  test/
```

## 3. Domain model

```ts
export type ShiftType =
  | 'day'
  | 'night'
  | 'full_day'
  | 'off'
  | 'vacation'
  | 'sick';

export type CycleShiftType = Exclude<ShiftType, 'vacation' | 'sick'>;

export interface ShiftTime {
  start: string;
  end: string;
}

export interface ScheduleConfigV1 {
  version: 1;
  preset: '2x2' | '3x3' | '5x2' | '1x3' | 'day-night-48' | 'custom';
  cycle: CycleShiftType[];
  anchorDate: string; // YYYY-MM-DD, local calendar date
  times: {
    day: ShiftTime;
    night: ShiftTime;
    fullDay: ShiftTime;
  };
  overrides: Record<string, ShiftType>;
}
```

## 4. Важное правило дат

Расписание — календарная логика, а не UTC timestamp logic.

`anchorDate` и ключи `overrides` хранятся как `YYYY-MM-DD`.

Расчёт разницы дней должен быть устойчив к DST и часовым поясам. Нельзя вычислять календарное смещение простым делением локальных миллисекунд на 86400000 без нормализации.

Рекомендуемая реализация домена: перевод календарной даты в UTC day number (`Date.UTC(y, m, d) / 86400000`) и дальнейшая целочисленная математика.

## 5. Алгоритм цикла

```text
offset = requestedDayNumber - anchorDayNumber
index = positiveModulo(offset, cycle.length)
baseShift = cycle[index]
result = override[date] ?? baseShift
```

`positiveModulo` обязан корректно работать для отрицательных offset.

## 6. Presets

```text
2x2:
[day, day, off, off]

3x3:
[day, day, day, off, off, off]

5x2:
[day, day, day, day, day, off, off]

1x3:
[full_day, off, off, off]

day-night-48:
[day, night, off, off]
```

Для пресета `day-night-48` пользователь должен понимать, какую позицию цикла он выбирает anchor date. В MVP anchor date трактуется как первый элемент выбранного шаблона.

## 7. Расчёт часов

Длительность смены определяется только настройкой времени конкретного типа.

Если `end <= start`, смена заканчивается на следующие сутки.

Примеры:

- 08:00–20:00 = 12 ч;
- 20:00–08:00 = 12 ч;
- 08:00–08:00 = 24 ч.

`vacation`, `sick`, `off` = 0 рабочих часов.

## 8. Поиск следующей смены

От сегодняшней даты проверять следующие календарные дни до первого рабочего типа:

- day;
- night;
- full_day.

Защитный лимит поиска: 366 дней. Если рабочая смена не найдена, вернуть `null`.

## 9. Статистика месяца

Для каждого дня видимого месяца применить полный resolved schedule, включая overrides.

Посчитать:

- workShiftCount;
- totalWorkHours;
- offCount;
- dayCount;
- nightCount;
- fullDayCount;
- vacationCount;
- sickCount.

## 10. Storage abstraction

```ts
export interface StorageProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
```

Реализации:

1. `VkStorageProvider`;
2. `LocalStorageProvider`.

Facade выбирает VK при доступном Bridge и fallback на localStorage при ошибке/запуске вне VK.

Ключ v1:

```text
moy_grafik_schedule
```

## 11. Migration strategy

Любое сохранение содержит `version`.

```text
parse
↓
validate
↓
version check
↓
migrate sequentially
↓
current model
```

Повреждённые данные не должны приводить к white screen. Приложение показывает понятное восстановление/сброс.

## 12. VK integration

VK интеграция инкапсулирована.

На старте внутри VK:

```text
VKWebAppInit
```

Storage использует поддерживаемые Bridge storage events.

Официальный VK Bridge API на момент проектирования поддерживает Storage на iOS, Android и Web.

Нельзя импортировать Bridge напрямую во feature-компоненты.

## 13. Browser fallback

Приложение обязано полностью открываться обычным URL в браузере для разработки.

Вне VK:

- init считается успешным;
- storage → localStorage;
- ads → no-op/mock;
- analytics → dev logger/no-op;
- appearance → browser preference.

## 14. Ads abstraction

```ts
export interface AdService {
  init(): Promise<void>;
  showSticky(): Promise<boolean>;
  hideSticky(): Promise<void>;
  canShowInterstitial(): Promise<boolean>;
  showInterstitial(): Promise<boolean>;
}
```

Feature UI не знает конкретных Bridge method names.

Подробная политика в `ADS.md`.

## 15. Analytics abstraction

```ts
export interface AnalyticsService {
  track(event: AnalyticsEvent, payload?: Record<string, unknown>): void;
}
```

Никаких пользовательских ФИО, телефонов или иных лишних персональных данных в событиях.

## 16. State

MVP не требует Redux.

Предпочтение:

- React Context + reducer или небольшой локальный store;
- domain pure functions;
- persisted schedule отдельно от transient UI state.

Не добавлять тяжёлую state library без реальной необходимости.

## 17. Styling

- VKUI для shell и нативных контролов;
- собственный календарь;
- CSS variables/tokens;
- CSS Grid только для сетки календаря;
- Flex для большинства остальных layout;
- отсутствие inline business styling.

## 18. Testing

Unit tests обязательны для:

- positiveModulo;
- даты до/после anchor;
- смены месяца/года;
- leap year;
- presets;
- overrides;
- reset override;
- shift duration;
- monthly statistics;
- next shift;
- migration.

Компонентные тесты — для критического onboarding и календаря, если не увеличивают срок MVP непропорционально.

## 19. Error boundaries

React application должен иметь верхнеуровневый error boundary/fallback.

Ошибки Bridge, рекламы или аналитики не должны ломать календарь.

## 20. Performance

Календарь рассчитывается только для нужного месяца и небольших derived values.

Нельзя генерировать многолетние массивы расписания и хранить их в памяти/storage.

## 21. Accessibility

- кнопки имеют доступные названия;
- touch targets не менее комфортного мобильного размера;
- статус дня определяется не только цветом;
- контраст соответствует здравому минимуму;
- destructive actions требуют подтверждения.

## 22. Definition of Done

Перед передачей этапа:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Все команды должны завершаться успешно.
