import Display from "./display";

const app: Display = new Display();

async function init(): Promise<void> {
    await app.setup();
}

init();