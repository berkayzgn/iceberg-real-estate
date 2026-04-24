import type { Config } from 'tailwindcss';
import { estateColors } from './tailwind.estate-theme';

export default {
  theme: {
    extend: {
      colors: {
        ...estateColors,
        brand: {
          amber: 'var(--color-brand-amber)',
          navy: 'var(--color-brand-navy)',
        },
        app: {
          bg: 'var(--app-bg)',
          card: 'var(--app-card-bg)',
          border: 'var(--app-border)',
          muted: 'var(--app-muted)',
          muted2: 'var(--app-muted-2)',
        },
      },
      borderRadius: {
        app: 'var(--radius)',
      },
    },
  },
} satisfies Config;

