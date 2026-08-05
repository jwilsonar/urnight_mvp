import type { StorybookConfig } from '@storybook/nextjs-vite';

/**
 * Storybook del frontend UrNight. Renderiza los componentes compartidos
 * (@urnight/ui) y piezas de marca con los tokens reales del design system
 * (app/globals.css se carga en preview.ts).
 */
const config: StorybookConfig = {
  framework: { name: '@storybook/nextjs-vite', options: {} },
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  staticDirs: ['../public'],
};

export default config;
