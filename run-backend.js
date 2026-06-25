const { spawn } = require('child_process');
const path = require('path');

const proc = spawn(
  path.join(__dirname, '.venv', 'Scripts', 'uvicorn.exe'),
  ['app.main:app', '--host', '0.0.0.0', '--port', '8000'],
  { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' }
);

proc.on('exit', (code) => process.exit(code ?? 0));
