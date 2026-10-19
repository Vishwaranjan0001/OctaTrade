import { spawn, fork } from "node:child_process";

// 1. Keep Ubuntu (WSL) running, so Redis inside it stays on while the app runs.
//    Only on Windows: on a Linux server (Render) there is no WSL, and Redis is in the cloud.
if (process.platform === "win32") {
  spawn("wsl", ["-d", "Ubuntu", "-e", "sleep", "infinity"], {
    stdio: "ignore"
  });
}

// 2. The API server and the worker pool, as two separate processes.
fork(new URL("./index.js", import.meta.url));
fork(new URL("./workerPool.js", import.meta.url));
