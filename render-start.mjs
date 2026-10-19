// Render's free plan gives one web service, so this starts the three parts that
// Docker Compose runs as separate containers:
//   1. the API (server/), on port 3000 inside the service only
//   2. the worker pool (server/workerPool.js)
//   3. the website (server.mjs), on Render's PORT, proxying /api and /socket.io to the API
// MongoDB is Atlas and Redis is a Render Key Value instance (see render.yaml).
import { fork } from "node:child_process";

const API_PORT = "3000";
const children = [];
let shuttingDown = false;

function start(file, env) {
  const child = fork(new URL(file, import.meta.url), {
    env: { ...process.env, ...env }
  });

  // If any part stops, stop everything so Render restarts the whole service.
  child.on("exit", (code) => {
    if (shuttingDown) {
      return;
    }

    console.log(`${file} stopped (code ${code}). Exiting so Render restarts the service.`);
    shutdown(1);
  });

  children.push(child);
}

function shutdown(exitCode) {
  shuttingDown = true;

  for (const child of children) {
    child.kill("SIGTERM");
  }

  setTimeout(() => process.exit(exitCode), 5000).unref();
}

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));

start("./server/container-entrypoint.mjs", { PORT: API_PORT });
start("./server/workerPool.js", {});
start("./server.mjs", { API: `http://127.0.0.1:${API_PORT}` });
