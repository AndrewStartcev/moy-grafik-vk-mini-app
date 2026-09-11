# Analytics specification

## Задача

Понять, создаёт ли приложение регулярную полезность и может ли рекламная модель приносить доход без разрушения retention.

## Product funnel

```text
app_open
↓
onboarding_open
↓
preset_selected / custom_cycle_created
↓
schedule_created
↓
calendar_used
↓
return_session
```

## События MVP

### Application

- `app_open`
- `app_ready`
- `app_error`
- `storage_fallback_used`

### Onboarding

- `onboarding_open`
- `preset_selected`
  - preset
- `custom_cycle_open`
- `custom_cycle_created`
  - cycle_length
- `schedule_created`
  - preset
  - cycle_length

### Calendar

- `calendar_month_changed`
  - direction
- `day_opened`
  - shift_type
- `day_overridden`
  - from_type
  - to_type
- `day_override_removed`
- `today_card_seen`

### Settings

- `settings_open`
- `schedule_change_started`
- `schedule_changed`
- `shift_time_changed`
  - shift_type
- `schedule_reset`

### Ads

См. `ADS.md`:

- `ad_request`
- `ad_available`
- `ad_unavailable`
- `ad_shown`
- `ad_closed`
- `ad_failed`

Параметры:

- format;
- placement;
- reason/error_code без чувствительных данных.

## Главные продуктовые метрики

- activation = `schedule_created / onboarding_open`;
- DAU;
- WAU;
- MAU;
- D1;
- D7;
- sessions per active user;
- month navigation per active user;
- day opens per active user;
- overrides created;
- ad impressions per DAU;
- ad fill / availability rate;
- revenue / DAU, когда финансовая метрика станет доступна.

## Privacy

Не отправлять:

- ФИО;
- VK display name;
- телефон;
- email;
- текстовые пользовательские заметки;
- полный календарь пользователя.

Для аналитики графика достаточно агрегатов `preset`, `cycle_length`, `shift_type`.

## Dev mode

До подключения production analytics сервис работает как type-safe logger/no-op.

Это позволяет внедрить события в код сразу и позже заменить transport без переписывания features.

## Post-release review

Первый продуктовый review после накопления достаточного количества реальных пользователей должен ответить:

1. Какой % завершает настройку?
2. Возвращаются ли на следующий день/неделю?
3. Какие пресеты популярнее?
4. Используют ли ручные исключения?
5. Сколько рекламных показов приходится на активного пользователя?
6. Есть ли ошибки, влияющие на activation/retention?
