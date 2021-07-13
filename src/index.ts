import { program } from 'commander';
import fs from 'fs';
import globby from "globby";
import { homedir } from 'os';
import { resolve } from 'path/posix';
import pug from 'pug';
import { stringify } from 'querystring';

program
    .version('0.0.1')
    .option('-t', '--template <template>', 'template file')
    .option('-o', '--output <path>', 'output file');

const extensions = `${homedir}/.vscode/extensions/*/package.json`

type Options = { template: string, output: string };

function keybindingToHtml(binding: string): Array<string> {
    if (binding.indexOf(' ') >= 0) {
        return binding.split(' ').flatMap(keybindingToHtml);
    }
    const modifierSymbols: Record<string, string> = {
        "alt": "⌥",
        "cmd": "⌘",
        "ctrl": "^",
        "shift": "⇧",
    };
    const keySymbols: Record<string, string> = {
        "left": "←",
        "right": "→",
        "up": "↑",
        "down": "↓",
        "page up": "⇞",
        "page down": "⇟",
        "backspace": "⌫",
        "enter": "↩",
        "escape": "⎋",
        "home": "↖",
        "end": "↘",
        "return": "↩",
        "space": "␣",
        "tab": "⇥",
    };
    const modifiers = [];
    let key = binding;
    while (true) {
        let m = key.match(/^(alt|cmd|ctrl|shift)\+(.+)/i);
        if (!m) break;
        modifiers.push(modifierSymbols[m[1].toLowerCase()]);
        key = m[2];
    }

    return [modifiers.join('') + (keySymbols[key] || key.toUpperCase())];
}

async function main(options: Options) {
    const templatePath = options.template || './templates/packages.pug';
    const outputPath = options.output || './packages.html';

    // load packages
    const packagePaths = await globby([extensions]);
    const packages = await Promise.all(packagePaths.map(async (path) => {
        const contents = fs.readFileSync(path, 'utf8');
        const json = JSON.parse(contents);

        let nlsObject = null;
        const nlsPath = path.replace(/\.json$/, '.nls.json');
        try {
            const nlsData = fs.readFileSync(nlsPath, 'utf8');
            nlsObject = JSON.parse(nlsData);
        } catch (e) { };

        for (let k of ['name', 'displayName', 'description']) {
            if (!(k in json)) continue;
            const m = json[k].match(/^%(.+)%$/);
            if (m && nlsObject) {
                // console.info('replace',
                json[k] = nlsObject[m[1]];
            }
        }
        return json;
    }));


    // Rewrite keybindings
    packages.forEach(({ contributes, commands }) => {
        if (contributes && contributes.keybindings) {
            const commandTitles = new Map((commands || []).map((cmd: { command: string, title: string }) => [cmd.command, cmd.title]));
            for (const binding of contributes.keybindings) {
                binding.keyHtml = keybindingToHtml(binding.key);
                binding.commandTitle = commandTitles.get(binding.command) || binding.command;
            }
        }
    });


    // remove Other from categories
    packages.forEach(({ categories }) => {
        const ix = categories && categories.indexOf("Other");
        if (ix >= 0) { categories.splice(ix, 1); }
    });

    // sort by name
    packages.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));

    const html = pug.renderFile(templatePath, { packages });
    fs.writeFileSync(outputPath, html);
}

const options = <Options><unknown>program.parse(process.argv);
main(options);
