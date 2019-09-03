#!/usr/bin/env node

console.log("Initializing interface ...");

import App from "./app";

const app: App = new App();

app.setup().catch((reason: any) => {
    // app.message.system(reason);
});
