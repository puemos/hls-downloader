import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const paths = [
  'src/core/coverage/coverage-summary.json',
  'src/background/coverage/coverage-summary.json',
  'src/design-system/coverage/coverage-summary.json',
  'src/popup/coverage/coverage-summary.json'
];
const totals = paths.map(p => JSON.parse(readFileSync(p, 'utf8')).total.lines);
const totalLines = totals.reduce((acc, t) => acc + t.total, 0);
const coveredLines = totals.reduce((acc, t) => acc + t.covered, 0);
const pct = totalLines === 0 ? 0 : (coveredLines / totalLines * 100);
mkdirSync('coverage', { recursive: true });
const summary = { total: { lines: { total: totalLines, covered: coveredLines, pct } } };
writeFileSync('coverage/coverage-summary.json', JSON.stringify(summary, null, 2));
