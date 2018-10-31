import Display from "./display";

const app: Display = new Display({
    messageFormat: "{sender} ~> {message}"
});

async function init(): Promise<void> {
    await app.setup();
}

init();