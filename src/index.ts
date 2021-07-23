#!/usr/bin/env node
import { program } from 'commander';
import fs from 'fs';
import globby from "globby";
import { homedir } from 'os';
import path from 'path';
import pug from 'pug';
import { keybindingToHtml } from './keynames';

// FIXME: use a different path on Windows
const extensionsPath = `${homedir}/.vscode/extensions/*/package.json`
const defaultOutputPath = './vscode-extensions.html';
const templateDirPath = path.join(__dirname, '../templates');

type ProgramOptions = { template: string, output: string };

program
    .version('0.0.1')
    .option('-t', '--template <template>', 'template file')
    .option('-o', '--output <path>', 'output file');

async function main(options: ProgramOptions) {
    const templatePath = options.template || path.join(templateDirPath, 'extensions.pug');
    const outputPath = options.output || defaultOutputPath;

    // load packages
    const packagePaths = await globby([extensionsPath]);
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
    console.log(`Created ${outputPath}`);
}

const options = <ProgramOptions><unknown>program.parse(process.argv);
main(options);
