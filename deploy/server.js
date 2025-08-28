const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 8080;

console.log('Starting Rust application wrapper...');

// Start the Rust binary
const rustApp = spawn('./login-app', [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
});

rustApp.stdout.on('data', (data) => {
    console.log(`Rust app: ${data}`);
});

rustApp.stderr.on('data', (data) => {
    console.error(`Rust app error: ${data}`);
});

rustApp.on('close', (code) => {
    console.log(`Rust application exited with code ${code}`);
    process.exit(code);
});

rustApp.on('error', (err) => {
    console.error('Failed to start Rust application:', err);
    process.exit(1);
});

console.log(`Wrapper started, Rust app should be running on port ${PORT}`);

// Keep the wrapper alive
setInterval(() => {}, 1000);