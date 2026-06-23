import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // 5174 keeps aria off the admin dashboard's 5173. Run everything on plain
    // localhost (API :8000, marketing :3000, aria :5174) — same host means the
    // session cookies are same-site and sent on every request.
    port: 5174,
  },
})
