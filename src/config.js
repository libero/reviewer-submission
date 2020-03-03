'use strict';
exports.__esModule = true;
const configPath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';
const thisConfig = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
exports['default'] = thisConfig;
