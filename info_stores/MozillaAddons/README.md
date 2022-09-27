# Requirements

* Node LTS (v16) or higher.
* Package manager compatible with NPM included in Node.

# Getting Started

1. Clone the repo **including submodules**: `git clone --recursive https://github.com/luskaner/companero-tortillaland-2.git`
1. Install dependencies: `npm install`.
1. Copy `assets/data/env.template.json` as `assets/data/env.json` writing the `twitchClientId`.
1. Copy `webpack/data/env.template.json` as `webpack/data/env.json` modifying as necessary:
    * `browserPaths` ➡️ `firefox`: Path to the executable (variables accepted) or name as per `web-ext` plugin.
    * `store` ➡️ `mozillaAddons`: Public key of the Mozilla Addons Store. Used for publishing and having an estable ID for developing.

# Building

`npm run build:firefox`

# Debugging

`npm run watch:firefox`