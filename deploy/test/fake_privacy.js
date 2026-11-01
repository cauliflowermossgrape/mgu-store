'use strict';
// app-privacy's patch_mainapp.js for the deploy tests: apply and check
// report the patch in effect, with nothing changed. Each file's entry
// names its sha256 and whether it is the stock reference: the content of
// $FAKE_PRIVACY_STOCK_MAIN or $FAKE_PRIVACY_STOCK_APPMANAGEMENT. Without
// --main/--appmanagement, check reports $FAKE_PRIVACY_STATE when set and
// apply exits $FAKE_PRIVACY_APPLY_EXIT when set. Each command is appended
// to $FAKE_PRIVACY_LOG when it is set. With $FAKE_PRIVACY_CHANGED_ONCE
// naming a file that does not exist, apply reports changed and makes it.
// With $FAKE_PRIVACY_WRITES_MAIN_AT "<file>:<n>", the n-th apply (counted
// in that file) writes main.js, as a patch it applies there.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const env = process.env;
const argv = process.argv.slice(2);
if (env.FAKE_PRIVACY_LOG) {
    fs.appendFileSync(env.FAKE_PRIVACY_LOG, argv[0] + '\n');
}
const sha = (p) => {
    try {
        return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    } catch (e) {
        return null;
    }
};
const src = path.join(env.MGU_DEPLOY_MAINAPP || '/usr/lib/oap-mainapp', 'src');
const bundle = (f) => { const b = f.replace(/\.js$/, '.bundle.js'); return fs.existsSync(b) ? b : f; };
const paths = { main: bundle(path.join(src, 'main.js')), appmanagement: bundle(path.join(src, 'AppManagement', 'AppManagement.js')) };
const stock = { main: env.FAKE_PRIVACY_STOCK_MAIN, appmanagement: env.FAKE_PRIVACY_STOCK_APPMANAGEMENT };
let explicit = false;
for (let i = 1; i < argv.length; i += 1) {
    if ((argv[i] === '--main' || argv[i] === '--appmanagement') && i + 1 < argv.length) {
        paths[argv[i].slice(2)] = argv[i + 1];
        explicit = true;
        i += 1;
    }
}
const files = Object.keys(paths).map((kind) => {
    const s = sha(paths[kind]);
    return { kind, path: paths[kind], sha256: s, reference: !!(s && stock[kind] && s === sha(stock[kind])),
        state: 'patched', patchedBy: null, problems: [] };
});
const state = argv[0] === 'check' && !explicit && env.FAKE_PRIVACY_STATE ? env.FAKE_PRIVACY_STATE : 'patched';
let changed = false;
if (argv[0] === 'apply' && !explicit && env.FAKE_PRIVACY_CHANGED_ONCE && !fs.existsSync(env.FAKE_PRIVACY_CHANGED_ONCE)) {
    fs.writeFileSync(env.FAKE_PRIVACY_CHANGED_ONCE, '');
    changed = true;
}
if (argv[0] === 'apply' && !explicit && env.FAKE_PRIVACY_WRITES_MAIN_AT) {
    const [count, at] = env.FAKE_PRIVACY_WRITES_MAIN_AT.split(':');
    const n = (Number(fs.existsSync(count) ? fs.readFileSync(count, 'utf8') : 0) || 0) + 1;
    fs.writeFileSync(count, String(n));
    if (n === Number(at)) {
        const now = Date.now() / 1000;
        fs.utimesSync(paths.main, now, now);
    }
}
console.log(JSON.stringify({ version: 'fake', command: argv[0], state, changed, files, restartNeeded: false }));
if (argv[0] === 'apply' && !explicit && env.FAKE_PRIVACY_APPLY_EXIT) {
    process.exitCode = Number(env.FAKE_PRIVACY_APPLY_EXIT);
}
