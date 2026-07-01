import type { Preview } from '@storybook/nextjs-vite';
import '../app/globals.css';

/* El DS es dark-first: fondo Midnight (bg-root) y clase dark fija, igual que
   el ThemeProvider forzado de la app. */
const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'urnight',
      values: [
        { name: 'urnight', value: '#05050a' },
        { name: 'surface', value: '#11111a' },
      ],
    },
  },
  decorators: [
    (Story) => {
      document.documentElement.classList.add('dark');
      return Story();
    },
  ],
};

export default preview;
