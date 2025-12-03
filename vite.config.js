// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
// })


// vite.config.js
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   base: '/nyraa/', 
//   plugins: [react()],
// })


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/nyraa' : '/nyraa/', 
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", 
        changeOrigin: true,
      },
    },
  },
}));

