const { spawn } = require('child_process');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const processes = [];
let shuttingDown = false;

const runProcess = (name, args, cwd) => {
  const child = spawn(npmCmd, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.log(`\n[${name}] exited with code ${code ?? 0}`);
    shutdown(code ?? 0);
  });

  child.on('error', (err) => {
    if (shuttingDown) return;
    console.error(`\n[${name}] failed to start: ${err.message}`);
    shutdown(1);
  });

  processes.push(child);
};

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }

  setTimeout(() => process.exit(code), 250);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

runProcess('frontend', ['run', 'dev:frontend'], process.cwd());
runProcess('backend', ['run', 'dev', '--prefix', 'backend'], process.cwd());
