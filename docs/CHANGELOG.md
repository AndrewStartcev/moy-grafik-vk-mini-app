# Changelog

## 2026-09-11

### Added — documentation

- project overview;
- working rules for the VK Apps department;
- product specification;
- technical architecture;
- UI/UX contract;
- reusable VK Apps production protocol;
- advertising policy;
- analytics specification;
- QA protocol;
- release/moderation checklist.

### Added — implementation

- React + TypeScript + Vite + VKUI application scaffold;
- VK Bridge initialization with browser fallback;
- schedule domain model;
- built-in schedule presets;
- DST-safe calendar date helpers;
- cycle calculation for dates before and after anchor date;
- shift duration calculation including overnight and 24-hour shifts;
- next-work-shift lookup;
- monthly schedule statistics;
- unit tests for engine and statistics;
- schedule onboarding;
- custom cycle editor;
- current-day summary;
- month calendar;
- day override bottom sheet;
- vacation and sick leave overrides;
- shift-time settings;
- VK Storage with localStorage fallback;
- analytics abstraction;
- application error boundary;
- responsive VK-native visual layer;
- GitHub Actions quality gate.

### Decisions

- first release is a utility MVP without backend;
- no AI and no purchases;
- monetization is advertising only;
- schedule is stored as cycle rule + overrides;
- domain logic is isolated from VK Bridge and React;
- browser fallback is mandatory;
- retention has priority over ad density.
