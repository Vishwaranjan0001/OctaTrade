import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(currentDirectory, "./src")
    }
  },
  server: {
    port: 5173,
    // Lets Cloudflare quick tunnels (*.trycloudflare.com) reach the dev/preview server.
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api": "http://localhost:3000",
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true
      }
    }
  }
});
export {
  vite_config_default as default
};
