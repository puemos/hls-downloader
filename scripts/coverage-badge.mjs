import { readFileSync, writeFileSync } from 'node:fs';
import { makeBadge } from 'badge-maker';

const summary = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
const pct = Number(summary.total.lines.pct).toFixed(2);
let color = 'red';
if (pct >= 90) color = 'brightgreen';
else if (pct >= 75) color = 'yellow';
else if (pct >= 60) color = 'orange';
const svg = makeBadge({ label: 'coverage', message: `${pct}%`, color });
writeFileSync('coverage-badge.svg', svg);
