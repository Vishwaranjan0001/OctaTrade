# OctaTrade Architecture Decisions

## ADR 001: Keep backend code in `server/`

### Problem

OctaTrade will eventually contain a React frontend and a Node backend with different dependencies and commands.

### Options considered

- Put all files and dependencies in the repository root.
- Keep frontend and backend projects in separate folders.

### Chosen solution

Backend code and backend package metadata live in `server/`. A separate `client/` folder will be introduced when frontend development begins.

### Why

This keeps backend responsibilities and dependencies clear without creating folders before they are needed.

### Trade-offs

Developers must run commands from the correct subfolder. Shared root-level tooling may be added later if repetition justifies it.

## ADR 002: Use Express for the HTTP API

### Problem

The backend needs readable HTTP routing, middleware, request handling, and response handling.

### Options considered

- Node's built-in HTTP module
- Express
- Other frameworks such as Fastify or NestJS

### Chosen solution

Use Express.

### Why

Express exposes request and response fundamentals with little framework ceremony, matches the planned stack, and has a mature ecosystem.

### Trade-offs

Express is an additional dependency and hides some low-level HTTP details. We will explain those details when they affect behavior or design.

## ADR 003: Use ES modules

### Problem

Node supports both CommonJS (`require`) and ES module (`import`) syntax.

### Options considered

- CommonJS
- ES modules

### Chosen solution

Set `"type": "module"` in the backend's `package.json` and use `import` and `export`.

### Why

ES modules are standard JavaScript syntax and align with the module style used by modern React tooling.

### Trade-offs

Some older Node examples use CommonJS, so their module syntax must be translated when reused.
