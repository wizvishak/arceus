import Display from "./display";

const app: Display = new Display(undefined, new Map(), {
    messageFormat: "{sender} ~> {message}"
});

async function init(): Promise<void> {
    await app.setup();
}

init();