# TODO: Update Analytics.jsx API URL Pattern

## Task
Update the Analytics.jsx file to use `import.meta.env.VITE_API_URL` instead of hardcoded `/api` to match the pattern used in AuthContext.

## Steps:
- [x] 1. Analyze current code in Analytics.jsx
- [x] 2. Analyze AuthContext.jsx for the correct pattern
- [ ] 3. Update Analytics.jsx to use import.meta.env.VITE_API_URL
- [ ] 4. Verify the changes

## Changes to make:
- Replace `const API_URL = '/api';` with `const API_URL = import.meta.env.VITE_API_URL || '/api';`
