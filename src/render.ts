import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { MemoryGraph } from './graph.js';
import { TYPE_COLORS, NEUTRAL_COLOR, colorForNode, radiusForDegree, computeDegrees, opacityForNode, mtimeRange, withOpacity } from './style.js';

/**
 * force-graph's package.json "exports" map only exposes force-graph.mjs (ESM) and
 * force-graph.min.js (under a non-standard "umd" condition) as importable specifiers -
 * the plain force-graph.js the CLI is asked to embed isn't reachable through module
 * resolution. Resolving the *allowed* bare specifier still lands us in the same dist/
 * folder, so we can read the sibling file directly from disk, bypassing the exports
 * restriction (which only governs require/import, not fs).
 */
export function loadForceGraphBundle(): string {
  const require = createRequire(import.meta.url);
  const distDir = path.dirname(require.resolve('force-graph'));
  const bundlePath = path.join(distDir, 'force-graph.js');
  const raw = fs.readFileSync(bundlePath, 'utf-8');
  return raw.replace(/\/\/# sourceMappingURL=.*$/m, '').trimEnd();
}

/** Prevents memory-file content containing a literal "</script" from truncating an inlined <script> block. */
function escapeClosingScript(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script');
}

export function renderHtml(graph: MemoryGraph, forceGraphSrc = loadForceGraphBundle()): string {
  const degrees = computeDegrees(graph);
  const { min, max } = mtimeRange(graph);

  const payloadNodes = graph.nodes.map((node) => {
    const baseColor = colorForNode(node);
    const opacity = opacityForNode(node, min, max);
    return {
      id: node.id,
      kind: node.kind,
      description: node.description ?? '',
      bodyHtml: node.bodyHtml ?? '',
      ghost: !!node.ghost,
      isIndex: !!node.isIndex,
      color: withOpacity(baseColor, opacity),
      radius: radiusForDegree(degrees.get(node.id) ?? 0),
    };
  });
  const payloadLinks = graph.edges.map((edge) => ({ source: edge.source, target: edge.target }));

  const dataJson = escapeClosingScript(JSON.stringify({ nodes: payloadNodes, links: payloadLinks }));
  const inlineForceGraph = escapeClosingScript(forceGraphSrc);
  const legendHtml = buildLegendHtml();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude Memory Atlas</title>
<style>${CSS}</style>
</head>
<body>
  <div id="graph"></div>
  <aside id="legend">${legendHtml}</aside>
  <aside id="panel">
    <button id="panel-close" aria-label="Close">&times;</button>
    <div id="panel-type"></div>
    <h2 id="panel-title"></h2>
    <div id="panel-body"></div>
  </aside>
  <script type="application/json" id="memory-atlas-data">${dataJson}</script>
  <script>${inlineForceGraph}</script>
  <script>${CLIENT_JS}</script>
</body>
</html>
`;
}

function buildLegendHtml(): string {
  const swatches = Object.entries(TYPE_COLORS)
    .map(([type, color]) => `<div><span class="dot" style="background:${color}"></span>${type}</div>`)
    .join('');
  return `${swatches}<div><span class="dot" style="background:${NEUTRAL_COLOR}"></span>ghost / index</div>`;
}

const CSS = `
  html, body { margin: 0; padding: 0; height: 100%; background: #0b0d12; color: #e6e6e6;
    font-family: system-ui, -apple-system, Segoe UI, sans-serif; overflow: hidden; }
  #graph { width: 100vw; height: 100vh; }
  #legend { position: fixed; bottom: 16px; left: 16px; font-size: 12px;
    background: rgba(21, 24, 34, 0.85); padding: 10px 14px; border-radius: 8px; }
  #legend div { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  #legend span.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  #panel { position: fixed; top: 0; right: 0; width: 360px; height: 100vh; box-sizing: border-box;
    background: #151822; border-left: 1px solid #2a2f3a; padding: 20px; overflow-y: auto;
    transform: translateX(100%); transition: transform 0.2s ease; }
  #panel.open { transform: translateX(0); }
  #panel-close { position: absolute; top: 12px; right: 12px; background: none; border: none;
    color: #e6e6e6; font-size: 20px; line-height: 1; cursor: pointer; }
  #panel-type { text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; color: #9aa0ab;
    margin-bottom: 6px; }
  #panel-title { margin: 0 0 12px; font-size: 18px; word-break: break-word; }
  #panel-body { font-size: 14px; line-height: 1.5; }
  #panel-body a { color: #4C9AFF; }
`;

const CLIENT_JS = `
(function () {
  var data = JSON.parse(document.getElementById('memory-atlas-data').textContent);

  var panel = document.getElementById('panel');
  var panelType = document.getElementById('panel-type');
  var panelTitle = document.getElementById('panel-title');
  var panelBody = document.getElementById('panel-body');

  function showNode(node) {
    panelType.textContent = node.ghost ? 'unresolved reference' : (node.isIndex ? 'index' : node.kind);
    panelTitle.textContent = node.id;
    panelBody.innerHTML = node.bodyHtml || (node.description ? '<p>' + node.description + '</p>' : '<p><em>No content.</em></p>');
    panel.classList.add('open');
  }

  document.getElementById('panel-close').addEventListener('click', function () {
    panel.classList.remove('open');
  });

  ForceGraph()(document.getElementById('graph'))
    .graphData(data)
    .nodeId('id')
    .nodeLabel(function (n) { return n.description ? (n.id + ' - ' + n.description) : n.id; })
    .nodeColor(function (n) { return n.color; })
    .nodeVal(function (n) { return n.radius; })
    .linkColor(function () { return 'rgba(255, 255, 255, 0.2)'; })
    .linkDirectionalArrowLength(4)
    .linkDirectionalArrowRelPos(1)
    .backgroundColor('#0b0d12')
    .onNodeClick(showNode)
    .onBackgroundClick(function () { panel.classList.remove('open'); });
})();
`;
