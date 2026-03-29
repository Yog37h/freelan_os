/**
 * scripts/start-tunnel.js
 *
 * Automatically starts an ngrok tunnel alongside the Next.js dev server.
 * - Waits for ngrok to be ready
 * - Fetches the live public URL from ngrok's local API
 * - Logs the webhook-ready URL
 * - Keeps running as long as ngrok is alive
 *
 * Usage: Called automatically via `npm run dev` through concurrently.
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = 3000;
const NGROK_API = 'http://127.0.0.1:4040/api/tunnels';
const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 1500;

// ── Colors for terminal output ──────────────────────────────────────
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function log(msg) {
    console.log(`${cyan('[tunnel]')} ${msg}`);
}

// ── Fetch ngrok public URL ──────────────────────────────────────────
function fetchTunnelUrl() {
    return new Promise((resolve, reject) => {
        http.get(NGROK_API, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const tunnel = parsed.tunnels.find(t => t.proto === 'https') || parsed.tunnels[0];
                    if (tunnel) {
                        resolve(tunnel.public_url);
                    } else {
                        reject(new Error('No tunnels found'));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

// ── Wait for ngrok to be ready ──────────────────────────────────────
async function waitForNgrok() {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const url = await fetchTunnelUrl();
            return url;
        } catch {
            // ngrok not ready yet
            await new Promise(r => setTimeout(r, RETRY_INTERVAL_MS));
        }
    }
    throw new Error('ngrok did not start within timeout');
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
    log('Starting ngrok tunnel...');

    // Start ngrok as a child process
    const ngrok = spawn('ngrok', ['http', String(PORT)], {
        stdio: 'ignore',
        detached: false,
        // On Windows, use shell to find ngrok in PATH
        shell: process.platform === 'win32',
    });

    ngrok.on('error', (err) => {
        console.error(`${cyan('[tunnel]')} ${yellow('Failed to start ngrok:')} ${err.message}`);
        console.error(`${cyan('[tunnel]')} Make sure ngrok is installed: ${dim('https://ngrok.com/download')}`);
        process.exit(1);
    });

    ngrok.on('exit', (code) => {
        if (code !== null && code !== 0) {
            log(`${yellow('ngrok exited with code:')} ${code}`);
        }
    });

    try {
        const publicUrl = await waitForNgrok();
        const webhookUrl = `${publicUrl}/api/webhooks/aisensy`;

        console.log('');
        console.log(green('  ╔══════════════════════════════════════════════════════════╗'));
        console.log(green('  ║') + bold('  🌐 NGROK TUNNEL ACTIVE                                 ') + green('║'));
        console.log(green('  ╠══════════════════════════════════════════════════════════╣'));
        console.log(green('  ║') + `  Public URL:  ${bold(publicUrl)}` + ' '.repeat(Math.max(0, 43 - publicUrl.length)) + green('║'));
        console.log(green('  ║') + `  Webhook:     ${bold(webhookUrl)}` + ' '.repeat(Math.max(0, 43 - webhookUrl.length)) + green('║'));
        console.log(green('  ║') + `  Local:       ${dim(`http://localhost:${PORT}`)}` + ' '.repeat(22) + green('║'));
        console.log(green('  ╠══════════════════════════════════════════════════════════╣'));
        console.log(green('  ║') + `  ${dim('AiSensy calls go to:')}                                   ` + green('║'));
        console.log(green('  ║') + `  ${dim('POST https://backend.aisensy.com/campaign/t1/api/v2')}    ` + green('║'));
        console.log(green('  ║') + `  ${dim('(your server → AiSensy, not the other way around)')}     ` + green('║'));
        console.log(green('  ╚══════════════════════════════════════════════════════════╝'));
        console.log('');

        // Store the URL in an environment variable for the running process
        // Other parts of the app can read this at runtime
        process.env.NGROK_PUBLIC_URL = publicUrl;

        // Write the URL to a temp file so the Next.js process can read it
        const fs = require('fs');
        const path = require('path');
        const tunnelInfoPath = path.join(__dirname, '..', '.tunnel-url');
        fs.writeFileSync(tunnelInfoPath, JSON.stringify({
            publicUrl,
            webhookUrl,
            startedAt: new Date().toISOString(),
        }));
        log(`Tunnel info saved to ${dim('.tunnel-url')}`);

        // Keep alive — wait for ngrok process to exit
        await new Promise((resolve) => {
            ngrok.on('exit', resolve);
            // Also handle parent process signals
            process.on('SIGINT', () => {
                log('Shutting down ngrok...');
                ngrok.kill();
                resolve();
            });
            process.on('SIGTERM', () => {
                log('Shutting down ngrok...');
                ngrok.kill();
                resolve();
            });
        });

    } catch (err) {
        console.error(`${cyan('[tunnel]')} ${yellow('Error:')} ${err.message}`);
        ngrok.kill();
        process.exit(1);
    }
}

main();
