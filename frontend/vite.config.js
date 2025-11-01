import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwind from "tailwindcss"
import autoprefixer from "autoprefixer"

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  css: { postcss: { plugins: [tailwind(), autoprefixer()] } }
})
