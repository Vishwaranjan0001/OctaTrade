import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/*
  Build configuration.

  Chunking is deliberately left to Rolldown's default splitting. An earlier
  version declared explicit `advancedChunks` groups for three/recharts/etc; that
  measured WORSE (911 kB preloaded on first paint versus 520 kB), because
  forcing modules into named chunks let a single shared helper create a static
  edge from the entry to a heavy chunk — which pulled all of Three.js and
  Recharts onto routes that render neither.

  What actually guarantees the heavy libraries stay off the critical path is the
  dynamic import boundaries in the source:
    - every route is React.lazy (src/App.jsx)
    - the WebGL scene is imported on demand, and only when motion is enabled and
      it is near the viewport (src/components/scene/SceneHost.jsx)
    - Recharts and Lightweight Charts sit behind React.lazy wrappers
      (src/components/charts/LazyCharts.jsx)

  Verified: no three, recharts, lightweight-charts or react-slick chunk appears
  in dist/index.html's modulepreload list.
*/

// The Express backend from `server/` listens on :3000 and has no CORS layer.
// Proxying /api keeps the backend untouched while letting the client call
// same-origin relative URLs. In production VITE_API_BASE_URL can point the
// client at a separately deployed API origin instead.
const apiProxy = {
  "/api": {
    target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:3000",
    changeOrigin: true
  }
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiProxy
  },
  // `npm run preview` serves the production build and needs the same proxy so
  // the built client can be smoke-tested against a running API.
  preview: {
    port: 4173,
    proxy: apiProxy
  },
  build: {
    target: "es2020",
    // three.js is unavoidably large. It is isolated in a chunk that is only
    // fetched when the hero scene actually mounts, so the default 500 kB
    // warning is not actionable here.
    chunkSizeWarningLimit: 1000
  }
});
