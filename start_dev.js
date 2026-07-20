const { spawn } = require("child_process");
const path = require("path");

const root = __dirname;
const backendDir = path.join(root, "backend");
const frontendDir = path.join(root, "frontend");
const viteBin = path.join(
  frontendDir,
  "node_modules",
  "vite",
  "bin",
  "vite.js",
);
const logDir = root;

function startServer(name, cmd, args, cwd) {
  const logFile = path.join(logDir, `${name}.log`);
  const out = require("fs").openSync(logFile, "a");
  const err = require("fs").openSync(logFile, "a");
  const child = spawn(cmd, args, {
    cwd,
    stdio: ["ignore", out, err],
    detached: true,
    shell: true,
  });
  child.unref();
  console.log(`${name} started (PID: ${child.pid}), log: ${logFile}`);
  return child;
}

startServer("backend", "node", ["src/index.js"], backendDir);
startServer("frontend", "node", [viteBin, "--host"], frontendDir);

console.log("Dev servers starting...");
console.log("Backend: http://localhost:5000");
console.log("Frontend: http://localhost:3000");
