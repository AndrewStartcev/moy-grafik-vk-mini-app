# Changelog

## 2026-09-11

### Added

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

### Decisions

- first release is a utility MVP without backend;
- no AI and no purchases;
- monetization is advertising only;
- schedule is stored as cycle rule + overrides;
- domain logic is isolated from VK Bridge and React;
- browser fallback is mandatory;
- retention has priority over ad density.
