#!/usr/bin/env node
/**
 * Reads Playwright JSON results and produces a human-readable markdown report.
 * Output: test-results/REPORT.md
 */
const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '..', 'test-results', 'results.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'test-results', 'REPORT.md');

if (!fs.existsSync(RESULTS_FILE)) {
  console.error('No results.json found. Run tests first: npm test');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
const suites = results.suites || [];
const lines = [];

const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
lines.push(`# Svix React UI Dashboard — Test Report`);
lines.push(`Generated: ${now}\n`);

let totalPassed = 0;
let totalFailed = 0;
let totalSkipped = 0;
let totalDuration = 0;
const failures = [];

function processSuite(suite, depth = 0) {
  const indent = '  '.repeat(depth);
  if (suite.title) {
    lines.push(`${indent}## ${suite.title}\n`);
  }

  for (const spec of (suite.specs || [])) {
    for (const test of (spec.tests || [])) {
      const result = test.results?.[0];
      const status = result?.status || test.status || 'unknown';
      const duration = result?.duration || 0;
      totalDuration += duration;

      let icon = '?';
      if (status === 'passed' || status === 'expected') { icon = '✅'; totalPassed++; }
      else if (status === 'failed' || status === 'unexpected') { icon = '❌'; totalFailed++; }
      else if (status === 'skipped') { icon = '⏭️'; totalSkipped++; }

      const durationStr = duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`;
      lines.push(`${indent}- ${icon} **${spec.title}** (${durationStr})`);

      if (status === 'failed' || status === 'unexpected') {
        const errorMsg = result?.error?.message || result?.errors?.[0]?.message || 'Unknown error';
        const snippet = errorMsg.split('\n').slice(0, 8).map(l => `${indent}  > ${l}`).join('\n');
        lines.push(snippet);
        failures.push({ suite: suite.title, test: spec.title, error: errorMsg });
      }
    }
  }

  for (const child of (suite.suites || [])) {
    processSuite(child, depth + 1);
  }
}

for (const suite of suites) {
  processSuite(suite);
}

lines.push('');
lines.push(`---`);
lines.push(`## Summary\n`);
lines.push(`| Metric | Value |`);
lines.push(`|--------|-------|`);
lines.push(`| Total tests | ${totalPassed + totalFailed + totalSkipped} |`);
lines.push(`| ✅ Passed | ${totalPassed} |`);
lines.push(`| ❌ Failed | ${totalFailed} |`);
lines.push(`| ⏭️ Skipped | ${totalSkipped} |`);
lines.push(`| Duration | ${(totalDuration / 1000).toFixed(1)}s |`);
lines.push('');

if (failures.length > 0) {
  lines.push(`## Failures\n`);
  for (const f of failures) {
    lines.push(`### ${f.suite} > ${f.test}\n`);
    lines.push('```');
    lines.push(f.error.slice(0, 2000));
    lines.push('```\n');
  }
}

const pct = totalPassed + totalFailed > 0
  ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
  : '0.0';
lines.push(`**Pass rate: ${pct}%**`);

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');
console.log(`Report written to ${OUTPUT_FILE}`);
console.log(`  ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped (${(totalDuration / 1000).toFixed(1)}s)`);
