const fs = require('node:fs');
const path = require('node:path');

// Backport https://github.com/wwebjs/whatsapp-web.js/pull/201942.
// Chromium can suspend animation frames while WhatsApp loads in headless mode.
const packageDir = path.dirname(require.resolve('whatsapp-web.js/package.json'));
const clientFile = path.join(packageDir, 'src', 'Client.js');
let source = fs.readFileSync(clientFile, 'utf8');
const replacements = [
  ["const version = await this.getWWebVersion();",
    "const version = await this.getWWebVersion();\n\n            // New WhatsApp Web builds expose the connection model separately.\n            // Keep whatsapp-web.js compatibility until its Socket references migrate.\n            await this.pupPage.evaluate(() => {\n                const socketModule = window.require('WAWebSocketModel');\n                socketModule.Socket ||= window.require('WAWebConnModel').Conn;\n            });"],
  ['timeout: authTimeout,\n                    signal: abort.signal,',
    'timeout: authTimeout,\n                    polling: 200,\n                    signal: abort.signal,'],
  ['{ timeout: authTimeout },', '{ timeout: authTimeout, polling: 200 },'],
];

for (const [original, patched] of replacements) {
  if (source.includes(patched)) continue;
  if (!source.includes(original)) {
    throw new Error('WhatsApp authentication polling patch needs review for this version.');
  }
  source = source.replace(original, patched);
}

fs.writeFileSync(clientFile, source);
