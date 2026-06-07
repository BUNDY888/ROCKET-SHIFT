"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const simple_1 = __importDefault(require("vite-plugin-electron/simple"));
const path_1 = __importDefault(require("path"));
exports.default = (0, vite_1.defineConfig)({
    plugins: [
        (0, plugin_react_1.default)(),
        (0, simple_1.default)({
            main: { entry: 'electron/main.ts' },
            preload: { input: 'electron/preload.ts' },
        }),
    ],
    resolve: {
        alias: { '@': path_1.default.resolve(__dirname, 'src') },
    },
    base: './',
});
