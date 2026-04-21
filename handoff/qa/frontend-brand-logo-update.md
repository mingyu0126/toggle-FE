# Frontend Brand Logo Update

## Summary
- Replaced the text-based brand labels in the frontend landing, web landing, web login, and signup surfaces with a shared PNG logo mark.

## Scope
- `/`
- `/web`
- `/loginweb`
- `/signupweb`

## Notes
- The shared logo lives in `apps/frontend/src/assets/logo.png`.
- Logo images now use `object-fit: contain` with explicit sizing so the mark preserves its aspect ratio across layouts.
- Existing page content and layout were preserved aside from the brand mark replacement.

## Verification
- Browser preview refreshed on the affected pages.
- `apps/frontend` production build completed successfully.
