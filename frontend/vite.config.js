import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // මෙන්න මේ කොටස අලුතෙන් එකතු කරන්න
    proxy: {
      // '/api' වලින් පටන් ගන්න ඕනම request එකක්
      '/api': {
        target: 'http://localhost:3001', // ඔයාගේ backend server එකේ address එක
        changeOrigin: true, // CORS වගේ ප්‍රශ්න මගහරවා ගන්න
        secure: false,      // http target එකක් නිසා false තියන්න
      },
    },
  },
})