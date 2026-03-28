const express = require('express');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env file. Copy .env.example to .env and fill in your credentials.');
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();

const required = ['SVIX_API_URL', 'SVIX_AUTH_TOKEN', 'SVIX_APP_UID'];
const missing = required.filter(k => !env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}. Check your .env file.`);
  process.exit(1);
}

const app = express();

app.use(
  '/vendor/svix-ui',
  express.static(path.join(__dirname, '..', 'dist'))
);

app.get('/', (_req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  html = html
    .replace('__SVIX_API_URL__', env.SVIX_API_URL)
    .replace('__SVIX_AUTH_TOKEN__', env.SVIX_AUTH_TOKEN)
    .replace('__SVIX_APP_UID__', env.SVIX_APP_UID);
  res.type('html').send(html);
});

app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`Test harness running at http://localhost:${port}`));
