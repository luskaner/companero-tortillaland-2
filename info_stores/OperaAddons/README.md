# Requirements

* Node LTS (v18) or higher.
* Package manager compatible with NPM included in Node.

# Getting Started

1. Clone the repo **including submodules**: `git clone --recursive https://github.com/luskaner/companero-tortillaland-2.git`
2. Install dependencies: `npm install`.
3. Copy `assets/data/env.template.json` as `assets/data/env.json` writing the `twitchClientId`.
4. Copy `webpack/data/env.template.json` as `webpack/data/env.json` modifying as necessary:
    * `browserPaths` ➡️ `opera`: Path to the executable (variables accepted).
    * `store` ➡️ `operaDeveloper`: Public key of the Opera Developer. Used for publishing.

# Building

`npm run build:opera`

# Debugging

`npm run watch:opera`
