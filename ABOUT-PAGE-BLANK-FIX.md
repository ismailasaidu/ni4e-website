# About page blank-screen fix

- Removed the top-level scroll-reveal dependency from the About content section.
- Added a defensive visibility rule so the About page remains visible even if the IntersectionObserver/reveal state fails on a direct URL load.
- Preserved the existing About page content, route, and Supabase setup.

Validation: source-level fix applied. Run `npm ci` and `npm run build` locally before deployment.
