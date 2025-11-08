## UX / UI Standards

### Visual Theme

| Element          | Color                  | Notes                 |
| ---------------- | ---------------------- | --------------------- |
| Background       | `#F5F5F5` (light gray) | Neutral tone          |
| Cards & Modals   | `#FFFFFF`              | Elevation with shadow |
| Primary Button   | `#D32F2F` (red)        | Use for main CTAs     |
| Secondary Button | `#757575` (gray)       | Non-primary actions   |
| Text             | `#212121`              | Dark gray             |
| Border / Divider | `#E0E0E0`              | Light gray lines      |

### Typography

* **Font:** Inter / Roboto (sans-serif)
* **Base font size:** 16px
* **Heading sizes:** H1 24px, H2 20px, H3 18px
* **Line height:** 1.5

### Layout

* Responsive grid (mobile-first).
* Use Tailwind or CSS modules — avoid inline styles.
* Maximum page width: 1280px.
* Minimum tap target: 44px x 44px.

### UX Principles

1. **Minimal input** — prefer selects, defaults, and smart autofill.
2. **Immediate feedback** — every action (add/edit/delete) gives visible success/failure toast.
3. **Consistency** — same button placement across screens.
4. **Accessibility** — keyboard-friendly, proper contrast, and ARIA labels.
5. **Loading states** — skeleton loaders for all API-driven components.
6. **Error states** — clear message + retry option; no blank screens.
7. **Mobile-first** — all layouts verified at 360px, 768px, and 1280px.

### Bilingual Readiness

* All UI text via translation keys (e.g., `t('garage.addVehicle')`).
* Default English; Nepali toggle stored in user profile.

### Logo
* Small red rounded rectangle with the words MG inside it.
---