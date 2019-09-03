#!/usr/bin/env node

console.log("Initializing interface ...");

import App from "./app";

const app: App = new App();

async function init(): Promise<void> {
    await app.setup();
}

init();
