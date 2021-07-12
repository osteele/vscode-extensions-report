import fs from 'fs';
import { homedir } from 'os'
import { program } from 'commander';
import globby from "globby";
import pug from 'pug';
program.version('0.0.1');

const extensions = `${homedir}/.vscode/extensions/*/package.json`

async function main() {
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

    const html = pug.renderFile('templates/packages.pug', { packages });
    fs.writeFileSync("packages.html", html);
}

main();
