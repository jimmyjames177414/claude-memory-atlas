import { describe, it, expect, vi, beforeEach } from 'vitest';

const spawnMock = vi.fn();
vi.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

const { openInBrowser } = await import('../src/openInBrowser.js');

function makeWorkingChild() {
  return { on: vi.fn(), unref: vi.fn() };
}

function makeFailingChild() {
  return {
    on: (event: string, handler: (err: Error) => void) => {
      if (event === 'error') handler(new Error('ENOENT'));
    },
    unref: vi.fn(),
  };
}

describe('openInBrowser', () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  it('spawns the first candidate detached, with stdio ignored, and unrefs it', () => {
    const working = makeWorkingChild();
    spawnMock.mockReturnValue(working);

    openInBrowser('/tmp/test.html');

    expect(spawnMock).toHaveBeenCalledWith(
      'wslview',
      ['/tmp/test.html'],
      expect.objectContaining({ detached: true, stdio: 'ignore' }),
    );
    expect(working.unref).toHaveBeenCalledTimes(1);
  });

  it('falls through to the next candidate when spawning the previous one errors', () => {
    const working = makeWorkingChild();
    spawnMock.mockImplementationOnce(() => makeFailingChild()).mockImplementationOnce(() => working);

    openInBrowser('/tmp/test.html');

    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(spawnMock).toHaveBeenNthCalledWith(1, 'wslview', ['/tmp/test.html'], expect.anything());
    expect(spawnMock).toHaveBeenNthCalledWith(2, 'explorer.exe', ['/tmp/test.html'], expect.anything());
    expect(working.unref).toHaveBeenCalledTimes(1);
  });

  it('prints a manual-open message when every candidate fails to spawn', () => {
    spawnMock.mockImplementation(() => makeFailingChild());
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    openInBrowser('/tmp/test.html');

    expect(spawnMock).toHaveBeenCalledTimes(4);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Could not auto-open'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('/tmp/test.html'));
    logSpy.mockRestore();
  });
});
