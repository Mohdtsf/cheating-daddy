import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    // Use the renderer folder as Vite root so the dev server serves the React renderer
    root: path.resolve(__dirname, 'src', 'renderer'),
    base: './',
    plugins: [react()],
    build: {
        outDir: path.resolve(__dirname, 'src', 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, 'src', 'renderer', 'index.html'),
        },
    },
});
