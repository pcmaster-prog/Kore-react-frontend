import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', 
  ],
  theme: {
    extend: {
      colors: {
        // Fondos
        'k-bg-page': 'var(--bg-page)',
        'k-bg-sidebar': 'var(--bg-sidebar)',
        'k-bg-sidebar-hover': 'var(--bg-sidebar-hover)',
        'k-bg-card': 'var(--bg-card)',
        'k-bg-card2': 'var(--bg-card2)',

        // Textos
        'k-text-h': 'var(--text-h)',
        'k-text-b': 'var(--text-b)',
        'k-sb-text': 'var(--sb-text)',
        'k-sb-active': 'var(--sb-active)',

        // Acciones
        'k-accent-btn': 'var(--accent-btn)',
        'k-accent-btn-text': 'var(--accent-btn-text)',
        'k-sb-active-bg': 'var(--sb-active-bg)',

        // Badges
        'k-badge-p-bg': 'var(--badge-p-bg)',
        'k-badge-p-c': 'var(--badge-p-c)',
        'k-badge-a-bg': 'var(--badge-a-bg)',
        'k-badge-a-c': 'var(--badge-a-c)',
        'k-badge-b-bg': 'var(--badge-b-bg)',
        'k-badge-b-c': 'var(--badge-b-c)',

        // Barras / Charts
        'k-bar1': 'var(--bar1)',
        'k-bar2': 'var(--bar2)',
        'k-bar3': 'var(--bar3)',

        // Dots / Indicadores
        'k-dot1': 'var(--dot1)',
        'k-dot2': 'var(--dot2)',
        'k-dot3': 'var(--dot3)',

        // Misc
        'k-border': 'var(--border)',
        
        // Mantener algunos colores hardcodeados básicos que aún se usen
        bone: "#F5F5EB",
        obsidian: "#101010",
        gold: "#FFC840",
      },
      boxShadow: {
        'k-card': 'var(--shadow)',
      },
      transitionTimingFunction: {
        'k-theme': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'k-theme': '400ms',
      },
    },
  },
  plugins: [],
}

export default config