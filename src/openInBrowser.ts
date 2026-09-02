import { spawnSync } from 'node:child_process';

// wslview first (WSL -> Windows default browser), then the native openers.
const CANDIDATES = ['wslview', 'explorer.exe', 'xdg-open', 'open'];

/**
 * Best-effort open, never throws and never signals failure to the caller. `explorer.exe`
 * launched from WSL is known to return a non-zero exit status even when it successfully
 * opens the file, so success is judged by "the command was found and ran", not its exit
 * code - checking the exit code would misreport that known-good case as a failure.
 */
export function openInBrowser(filePath: string): void {
  for (const cmd of CANDIDATES) {
    const result = spawnSync(cmd, [filePath], { stdio: 'ignore' });
    if (!result.error) {
      return;
    }
  }
  console.log(`Could not auto-open a browser. Open this file manually: ${filePath}`);
}
