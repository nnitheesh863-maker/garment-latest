# Changelog

All notable changes to the Garment ERP platform will be documented in this file.

## [1.5.0] - 2026-09-19

### Added
- Comprehensive JSDoc annotations across all backend controllers and models.
- Python ML model boundary protections and anomaly confidence intervals.
- Accessible ARIA properties and interactive UI components.
- Unit test suites for backend auth, response helpers, and AI preprocessor.
- Complete REST API specification in `API_SPECIFICATION.md`.
- Architecture and system design overview in `ARCHITECTURE.md`.
- Standardized `.editorconfig` and `.prettierrc` configuration files.

### Refactored
- State machine validations for production order lifecycles and machine telemetry.
- Defect reporting workflows with categorized severity distributions.
- Frontend navigation and modal focus management for enhanced accessibility.
- Socket.IO connection recovery with exponential backoff.

### Fixed
- Defensive field sanitization on user registration and login endpoints.
- Machine maintenance schedule calculations against sensor thresholds.
- Low stock calculation edge cases in inventory tracking.
