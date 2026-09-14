#!/usr/bin/env node
/*
  Runs the API and the client together with one command.

  Deliberately dependency-free: it uses child_process rather than a process
  manager so `npm run dev` works straight after `npm run setup`, with nothing
  installed at the repository root.

  Both children inherit stdio, so their logs interleave in this terminal, and a
  Ctrl-C here stops both.
*/
import { spawn } from "node:child_process";
import process from "node:process";

const children = [];

/**
 * Starts one workspace command.
 * Input  : label for logs, npm prefix directory, npm script name.
 * Output : the spawned child process.
 */
function start(label, prefix, script) {
  const child = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["--prefix", prefix, "run", script],
    { stdio: "inherit", env: process.env }
  );

  child.on("exit", (code, signal) => {
    if (signal) return;
    console.log(`\n[${label}] exited with code ${code}`);
    shutdown(code ?? 0);
  });

  children.push(child);
  return child;
}

/** Stops every child, then exits. */
function shutdown(code) {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("OctaTrade: starting API on :3000 and client on :5173\n");
start("server", "server", "start");
start("client", "client", "dev");
