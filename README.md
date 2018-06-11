# jsx-quick-loader

> Another webpack jsx loader only transform jsx grammar to React.createElement.

## Install

````bash
npm install --save-dev jsx-quick-loader
````

## Develop

Use [vscode-antlr4](https://github.com/mike-lischke/vscode-antlr4) plugin to watch `g4` file and generate JavaScript code.

````json
"antlr4.generation": {
  "mode": "external",
  "language": "JavaScript",
  "listeners": true,
  "visitors": false
}
````