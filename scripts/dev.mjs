/**
 * Development Orchestrator Script
 * Boots frontend, backend, and AI service concurrently with health checks and log formatting.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MONGO_PORT = 27017;
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 3000;
const AI_SERVICE_PORT = 5001;

const MONGOD_CANDIDATES = [
  process.env.MONGOD_BIN,
  "C:\\Users\\nnith\\AppData\\Local\\Temp\\opencode\\mongodb\\mongodb-win32-x86_64-windows-8.0.9\\bin\\mongod.exe",
  "mongod",
].filter(Boolean);

const DB_PATH =
  process.env.MONGO_DB_PATH || path.join(os.tmpdir(), "opencode", "mongodb-data");

const npmCli =
  process.env.npm_execpath ||
  path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");

function isPortOpen(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: "127.0.0.1" });
    sock.once("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.once("error", () => resolve(false));
  });
}

async function waitForMongo(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(MONGO_PORT)) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("MongoDB did not start within timeout");
}

async function ensureMongo() {
  if (await isPortOpen(MONGO_PORT)) {
    console.log("[db]   MongoDB already running on 27017");
    return;
  }
  const exe = MONGOD_CANDIDATES.find((c) => fs.existsSync(c));
  if (!exe) {
    throw new Error(
      "mongod not found. Set MONGOD_BIN to the mongod.exe path and retry.",
    );
  }
  fs.mkdirSync(DB_PATH, { recursive: true });
  console.log(`[db]   Starting MongoDB from ${exe}`);
  const child = spawn(exe, ["--dbpath", DB_PATH, "--port", String(MONGO_PORT)], {
    stdio: "inherit",
  });
  child.on("error", (err) => {
    console.error("[db]   Failed to start mongod:", err.message);
  });
  await waitForMongo();
  console.log("[db]   MongoDB is ready");
}

const children = [];

function makePrefixed(name, color) {
  const prefix = `${color}[${name}]\x1b[0m `;
  return (data) => {
    String(data)
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => console.log(prefix + line));
  };
}

function spawnChild(name, color, args) {
  const child = spawn(process.execPath, [npmCli, "run", ...args], {
    cwd: path.join(projectRoot, name),
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", makePrefixed(name, color));
  child.stderr.on("data", makePrefixed(name, color));
  child.on("error", (err) => {
    console.error(`[${name}] failed to start:`, err.message);
    shutdown(1);
  });
  child.on("exit", (code) => {
    if (code !== 0 && !shuttingDown) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(1);
    }
  });
  children.push(child);
}

function findPythonExecutable(serviceDir) {
  const venvCandidates = [
    path.join(serviceDir, "venv", "Scripts", "python.exe"),
    path.join(serviceDir, ".venv", "Scripts", "python.exe"),
    path.join(serviceDir, "venv", "bin", "python"),
    path.join(serviceDir, ".venv", "bin", "python"),
    path.join(projectRoot, "venv", "Scripts", "python.exe"),
    path.join(projectRoot, ".venv", "Scripts", "python.exe"),
    path.join(projectRoot, "venv", "bin", "python"),
    path.join(projectRoot, ".venv", "bin", "python"),
  ];

  for (const candidate of venvCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return process.platform === "win32" ? "python" : "python3";
}

function spawnPython(name, color, script) {
  const serviceDir = path.join(projectRoot, name);
  const pythonCmd = findPythonExecutable(serviceDir);
  const child = spawn(pythonCmd, [script], {
    cwd: serviceDir,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", makePrefixed(name, color));
  child.stderr.on("data", makePrefixed(name, color));
  child.on("error", (err) => {
    console.warn(`[${name}] Python ML service not available (${err.message}) - Node.js will use Cloud LLM fallback.`);
  });
  child.on("exit", (code) => {
    if (code !== 0 && !shuttingDown) {
      console.warn(`[${name}] exited with code ${code}`);
    }
  });
  children.push(child);
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\nStopping all services...");
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  await ensureMongo();

  if (await isPortOpen(BACKEND_PORT)) {
    console.log("[api]   Port 5000 already in use - skipping backend (already running?)");
  } else {
    spawnChild("backend", "\x1b[36m", ["dev"]);
  }

  if (await isPortOpen(AI_SERVICE_PORT)) {
    console.log("[ai]    Port 5001 already in use - ML service ready");
  } else {
    spawnPython("ai-service", "\x1b[33m", "app.py");
  }

  if (await isPortOpen(FRONTEND_PORT)) {
    console.log("[web]   Port 3000 already in use - skipping frontend (already running?)");
  } else {
    spawnChild("frontend", "\x1b[35m", ["dev"]);
  }

  if (children.length === 0) {
    console.log("\nEverything already running. Open http://localhost:3000");
    process.exit(0);
  }

  console.log("\n------------------------------------------------------------");
  console.log("  Frontend:   http://localhost:3000");
  console.log("  Backend:    http://localhost:5000/api/health");
  console.log("  AI ML Svc:  http://localhost:5001/api/health");
  console.log("  Press Ctrl+C to stop everything");
  console.log("------------------------------------------------------------\n");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
