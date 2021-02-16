const { Vyos } = require('./lib/index');
const repl = require('repl');

require('dotenv').config();
const url = process.env.URL;
const key = process.env.KEY;

if (!url) {
    console.error('Missing URL! Please set URL or add it to .env');
    process.exit(1);
}

if (!key) {
    console.error('Missing API Key! Please set KEY or add it to .env');
    process.exit(1);
}

repl.start('v> ').context.v = new Vyos(url, key);
