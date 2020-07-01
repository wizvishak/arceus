import App from "../app";

export function pickRandomRange(min, max): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

export function changeChannel(channelName: string, app: App): void {
    app.message.system(`And now, {bold}${app.client.user.tag}{/bold}, we switch channels...`);
    app.commands.get("c")([channelName], this);
}

export function changeGuild(guildSnowflake: string, app: App): void {
    app.message.system(`Hold up, {bold}${app.client.user.tag}{/bold}! Shifting guilds...`);
    app.commands.get("g")([guildSnowflake], this);
}

