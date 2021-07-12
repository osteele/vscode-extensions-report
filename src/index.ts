import { program } from 'commander';
import fs from 'fs';
import globby from "globby";
import { homedir } from 'os';
import pug from 'pug';

program
    .version('0.0.1')
    .option('-t', '--template <template>', 'template file')
    .option('-o', '--output <path>', 'output file');

const extensions = `${homedir}/.vscode/extensions/*/package.json`

type Options = { template: string, output: string };

async function main(options: Options) {
    const templatePath = options.template || './templates/packages.pug';
    const outputPath = options.output || './packages.html';

    const packagePaths = await globby([extensions]);
    const packages = await Promise.all(packagePaths.map(async (path) => {
        const contents = fs.readFileSync(path, 'utf8');
        return JSON.parse(contents);
    }));

    // remove Other from categories
    packages.forEach(({ categories }) => {
        const ix = categories && categories.indexOf("Other");
        if (ix >= 0) { categories.splice(ix, 1); }
    });

    // sort by name
    packages.sort((a, b) => a.name.localeCompare(b.name));

    const html = pug.renderFile(templatePath, { packages });
    fs.writeFileSync(outputPath, html);
}

const options = <Options><unknown>program.parse(process.argv);
main(options);