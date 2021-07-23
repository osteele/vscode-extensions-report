# VScode Extensions Report

This is a work in progress.

This project provides a command-line tool that generates a list of [Visual Studio Code extensions](https://code.visualstudio.com/docs/editor/extension-marketplace).

I wrote it in order to snapshot reports of what extensions I'm using; and in
order to quickly scan the descriptions and keybindings of all my installed
extensions.

The report is currently an HTML page. You can provide a
[Pug](https://pugjs.org/api/getting-started.html) template, in order to create
other report formats. (Pug is a template language that is similar to
[Liquid](https://shopify.github.io/liquid/), that is used by Shopify and by
[Jekyll](https://jekyllcodex.org) / [GitHub Pages](https://pages.github.com).)

## Installation

`npm install`

## Usage

`vscode-extensions-report`

Creates a file named `vscode-extensions.html` in the current directory.

Run `vscode-extensions-report --help` to see a list of options.

## License

ISC
