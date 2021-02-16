# vyos-client

[![npm](https://img.shields.io/npm/v/vyos-client)](https://www.npmjs.com/package/vyos-client)
[![docs](https://img.shields.io/npm/v/vyos-client?label=docs)](https://foltik.github.io/vyos-client-js/)
[![license](https://img.shields.io/github/license/Foltik/vyos-client-js)](https://github.com/Foltik/vyos-client-js/blob/main/LICENSE.md)
[![build](https://img.shields.io/github/workflow/status/Foltik/vyos-client-js/main)](https://github.com/Foltik/vyos-client-js/actions)

A simple to use client for the VyOS HTTP API.

For more information and setup instructions, see 
[docs.vyos.io/HTTP-API](https://docs.vyos.io/en/latest/configuration/service/https.html).

```typescript
import { Vyos } from 'vyos-client';
const client = new Vyos('https://my-vyos.local', 'API-KEY')

/* Modify configuration */
await client.config.get('system host-name') // 'my-vyos'
// 'my-vyos'
await client.config.set('system host-name', 'vyos')

/* Update OS images */
await client.images.add('https://downloads.vyos.io/rolling/current/amd64/vyos-1.4-rolling-202101301326-amd64.iso')
await client.images.remove('1.4-rolling-202101301326')

/* Run operational mode commands */
await client.ops.show('date')
// 'Mon 15 Feb 2021 10:54:54 PM EST\n'
await client.ops.generate('wireguard default-keypair');
```

For local testing, a Node.js repl is included.

Set the URL and KEY environment vars when running, or add them to a `.env` file.

```shell
$ npm install
$ npm run build
$ URL=https://my-vyos.local KEY=API-KEY npm run repl
v> await v.config.show('system host-name')
'my-vyos'
```