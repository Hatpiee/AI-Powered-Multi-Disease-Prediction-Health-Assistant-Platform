const { spawn, execSync } = require('child_process');
const path = require('path');

function killPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr ":${port} " | findstr "LISTENING"`, { encoding: 'utf8' });
    const pid = result.trim().split(/\s+/).pop();
    if (pid && /^\d+$/.test(pid)) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`[dev] Cleared stale process on port ${port} (PID ${pid})`);
    }
  } catch {
    // nothing on that port
  }
}

console.log('Starting backend (FastAPI) and frontend (Next.js)...\n');

killPort(8000);
killPort(3000);

const backend = spawn(
  path.join(__dirname, '.venv', 'Scripts', 'uvicorn.exe'),
  ['app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
  {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  }
);

const frontend = spawn(
  'node',
  [path.join(__dirname, 'frontend', 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev'],
  {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
  }
);

backend.on('error', (err) => console.error('[backend] failed to start:', err.message));
frontend.on('error', (err) => console.error('[frontend] failed to start:', err.message));

function shutdown() {
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
