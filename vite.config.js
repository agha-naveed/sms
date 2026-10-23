import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Anything starting with /api or /uploads is sent to the Express server,
    // so the frontend can just call "/api/students".
    proxy: {
      "/api": "https://sms-backend-production-4398.up.railway.app",
      "/uploads": "https://sms-backend-production-4398.up.railway.app",
    },
  },
});
