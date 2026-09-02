import { spawn } from 'node:child_process';

// wslview first (WSL -> Windows default browser), then the native openers.
const CANDIDATES = ['wslview', 'explorer.exe', 'xdg-open', 'open'];

/**
 * Best-effort open, never throws and never signals failure to the caller. Spawned
 * detached and unref'd because launching a GUI app has no bounded completion time -
 * some openers don't return until the browser itself closes, and a synchronous spawn
 * would hang the CLI for as long as that browser stays open.
 */
export function openInBrowser(filePath: string): void {
  tryNext(CANDIDATES, filePath);
}

function tryNext(remaining: string[], filePath: string): void {
  const [cmd, ...rest] = remaining;
  if (!cmd) {
    console.log(`Could not auto-open a browser. Open this file manually: ${filePath}`);
    return;
  }
  const child = spawn(cmd, [filePath], { stdio: 'ignore', detached: true });
  child.on('error', () => tryNext(rest, filePath));
  child.unref();
}
