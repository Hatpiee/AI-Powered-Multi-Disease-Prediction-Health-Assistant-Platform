import { spawn, execSync } from "child_process";
import path from "path";

const rootDir = path.join(process.cwd(), "..");
const uvicorn = path.join(rootDir, ".venv", "Scripts", "uvicorn.exe");

let alreadyRunning = false;
try {
  execSync(`netstat -ano | findstr ":8000 " | findstr "LISTENING"`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  alreadyRunning = true;
} catch {
  // port is free
}

if (alreadyRunning) {
  console.log("[backend] Already running on port 8000.");
} else {
  console.log("[backend] Starting FastAPI on port 8000...");

  const backend = spawn(
    uvicorn,
    ["app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    {
      cwd: path.join(rootDir, "backend"),
      stdio: "inherit",
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    }
  );

  backend.on("error", (err: Error) =>
    console.error("[backend] Failed to start:", err.message)
  );

  const kill = () => {
    try {
      backend.kill();
    } catch {}
  };
  process.on("exit", kill);
  process.on("SIGINT", () => {
    kill();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    kill();
    process.exit(0);
  });
}
