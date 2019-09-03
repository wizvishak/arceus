#!/usr/bin/env node

console.log("Initializing interface ...");

import App from "./app";

const app: App = new App();

try {
    app.setup();
}
catch (error) {
    app.message.system(error);
}
