#!/usr/bin/env node

import App from "./app";

const app: App = new App();

async function init(): Promise<void> {
    await app.setup();
}

init();
