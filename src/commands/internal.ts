import fs from "fs";
import path from "path";
import Display from "../display";
import {Snowflake, Message, User, TextChannel, Guild} from "discord.js";
import {tips} from "../constant";
import Utils from "../utils";

export default function setupInternalCommands(display: Display): void {
    display.commands.set("login", (args: string[]) => {
        display.login(args[0]);
    });

    display.commands.set("logout", async () => {
        await display.shutdown();
    });

    display.commands.set("now", () => {
        if (display.getState().guild && display.getState().channel) {
            display.appendSystemMessage(`Currently on guild '{bold}${display.getState().guild.name}{/bold}' # '{bold}${display.getState().channel.name}{/bold}'`)
        }
        else if (display.getState().guild) {
            display.appendSystemMessage(`Currently on guild '{bold}${display.getState().guild.name}{/bold}`);
        }
        else {
            display.appendSystemMessage("No active guild");
        }
    });

    display.commands.set("mute", () => {
        display.updateState({
            muted: !display.getState().muted
        });

        if (display.getState().muted) {
            display.appendSystemMessage("Muted mode activated");
        }
        else {
            display.appendSystemMessage("Muted mode is no longer activated");
        }
    });

    display.commands.set("ignore", (args: string[]) => {
        if (!args[0]) {
            if (display.getState().ignoredUsers.length === 0) {
                display.appendSystemMessage("Not ignoring anyone");

                return;
            }

            const usersString: string = display.getState().ignoredUsers.map((userId: Snowflake) => `@{bold}${userId}{/bold}`).join(", ");

            display.appendSystemMessage(`Currently ignoring messages from: ${usersString}`);
        }
        else if (display.client.user && display.client.user.id === args[0]) {
            display.appendSystemMessage("You can't ignore yourself, silly");
        }
        else if (display.getState().ignoredUsers.includes(args[0])) {
            display.getState().ignoredUsers.splice(display.getState().ignoredUsers.indexOf(args[0]), 1);
            display.appendSystemMessage(`Removed user @{bold}${args[0]}{/bold} from the ignore list`);
        }
        else {
            if (display.getState().trackList.includes(args[0])) {
                display.getState().trackList.splice(display.getState().trackList.indexOf(args[0]), 1);
                display.appendSystemMessage(`No longer tracking @{bold}${args[0]}{/bold}`);
            }

            display.getState().ignoredUsers.push(args[0]);
            display.appendSystemMessage(`Added user @{bold}${args[0]}{/bold} to the ignore list`);
        }
    });

    display.commands.set("edit", async (args: string[]) => {
        // TODO: Display message.
        if (!args[0] || !args[1] || !display.getState().channel) {
            return;
        }

        const message: Message = await display.getState().channel.fetchMessage(args[0]) as Message;

        if (message && message.editable) {
            await message.edit(args.slice(1).join(" "));
        }
        else {
            display.appendSystemMessage("That message doesn't exist or it is not editable");
        }
    });

    display.commands.set("save", () => {
        display.saveStateSync();
    });

    display.commands.set("format", (args: string[]) => {
        display.updateState({
            messageFormat: args.join(" ")
        });

        display.appendSystemMessage(`Successfully changed format to '${display.getState().messageFormat}'`);
    });

    display.commands.set("forget", () => {
        if (display.getState().token) {
            display.updateState({
                token: undefined
            });
            
            display.saveStateSync();
        }
    });

    display.commands.set("encrypt", (args: string[]) => {
        if (!args[0]) {
            display.appendSystemMessage("You must provide a password");

            return;
        }

        display.updateState({
            decriptionKey: args[0]
        });

        display.appendSystemMessage(`Using decryption key '{bold}${args[0]}{/bold}'`);
    });

    display.commands.set("doencrypt", () => {
        display.updateState({
            encrypt: !display.getState().encrypt
        });

        if (display.getState().encrypt) {
            display.appendSystemMessage("Now encrypting messages");
        }
        else {
            display.appendSystemMessage("No longer encrypting messages");
        }
    });

    display.commands.set("theme", (args: string[]) => {
        if (!args[0]) {
            display.appendSystemMessage(`The current theme is '{bold}${display.getState().theme}{/bold}'`)

            return;
        }

        display.loadTheme(args[0]);
    });

    display.commands.set("themes", () => {
        const themesPath: string = path.join(__dirname, "../", "themes");

        if (fs.existsSync(themesPath)) {
            let files: string[] = fs.readdirSync(themesPath);

            for (let i: number = 0; i < files.length; i++) {
                files[i] = files[i].replace(".json", "");
            }

            const themesString: string = files.join("\n");

            display.appendSystemMessage(themesString);
        }
        else {
            display.appendSystemMessage("Themes directory does not exist");
        }
    });

    display.commands.set("tag", (args: string[]) => {
        if (!args[0]) {
            const tags: string[] = display.getTags();

            if (tags.length === 0) {
                display.appendSystemMessage("No tags have been set");

                return;
            }

            const tagsString: string = tags.map((tag: string) => `{bold}${tag}{/bold}`).join(", ");

            display.appendSystemMessage(`Tags: ${tagsString}`);
        }
        else if (args.length === 2) {
            display.setTag(args[0], args[1]);
            display.appendSystemMessage(`Successfully saved tag '{bold}${args[0]}{/bold}'`);
        }
        else if (args.length === 1 && display.hasTag(args[0])) {
            display.deleteTag(args[0]);
            display.appendSystemMessage(`Successfully deleted tag '{bold}${args[0]}{/bold}'`);
        }
        else {
            display.appendSystemMessage("Such tag does not exist");
        }
    });

    display.commands.set("tip", () => {
        // TODO: Replace all.
        const tip: string = tips[Utils.getRandomInt(0, tips.length - 1)]
            .replace("{prefix}", display.options.commandPrefix);

        display.showHeader(tip, true);
    });

    display.commands.set("dm", async (args: string[]) => {
        if (!args[0] || !args[1]) {
            display.appendSystemMessage("Expecting both recipient and message arguments");

            return;
        }

        if (display.client.users.has(args[0])) {
            const recipient: User = display.client.users.get(args[0]) as User;

            (await recipient.createDM()).send(args.slice(1).join(" ")).catch((error: Error) => {
                display.appendSystemMessage(`Unable to send message: ${error.message}`);
            });
        }
        else {
            display.appendSystemMessage("Such user does not exist or has not been cached");
        }
    });

    display.commands.set("fullscreen", () => {
        display.toggleChannels();
    });

    display.commands.set("me", () => {
        // TODO: Add valid method to check if logged in.
        if (display.client.user) {
            display.appendSystemMessage(`Logged in as {bold}${display.client.user.tag}{/bold} | {bold}${Math.round(display.client.ping)}{/bold}ms`);
        }
        else {
            display.appendSystemMessage("Not logged in");
        }
    });

    display.commands.set("sync", () => {
        display.syncState();
    });

    display.commands.set("pin", (args: string[]) => {
        if (!args[0]) {
            if (display.getState().wordPins.length === 0) {
                display.appendSystemMessage("No set word pins");

                return;
            }

            const wordPinsString: string = display.getState().wordPins.map((pin: string) => `{bold}${pin}{/bold}`).join(", ");

            display.appendSystemMessage(`Word pins: ${wordPinsString}`);
        }
        else if (display.getState().wordPins.includes(args[0])) {
            display.getState().wordPins.splice(display.getState().wordPins.indexOf(args[0]), 1);
            display.appendSystemMessage(`Removed word '{bold}${args[0]}{/bold}' from pins`);
        }
        else {
            display.getState().wordPins.push(args[0]);
            display.appendSystemMessage(`Added word '{bold}${args[0]}{/bold}' to pins`);
        }
    });

    display.commands.set("track", (args: string[]) => {
        if (!args[0]) {
            if (display.getState().trackList.length === 0) {
                display.appendSystemMessage("Not tracking anyone");

                return;
            }

            const usersString: string = display.getState().trackList.map((userId: Snowflake) => `@{bold}${userId}{/bold}`).join(", ");

            display.appendSystemMessage(`Tracking users: ${usersString}`);
        }
        else if (display.client.user && display.client.user.id === args[0]) {
            display.appendSystemMessage("You can't track yourself, silly");
        }
        else if (display.getState().trackList.includes(args[0])) {
            display.getState().trackList.splice(display.getState().trackList.indexOf(args[0]), 1);
            display.appendSystemMessage(`No longer tracking @{bold}${args[0]}{/bold}`);
        }
        else if (display.client.users.has(args[0])) {
            if (display.getState().ignoredUsers.includes(args[0])) {
                display.appendSystemMessage("You must first stop ignoring that user");

                return;
            }

            display.getState().trackList.push(args[0]);
            display.appendSystemMessage(`Now tracking @{bold}${args[0]}{/bold}`);
        }
        else {
            display.appendSystemMessage("No such user cached");
        }
    });

    display.commands.set("help", () => {
        let helpString: string = "";

        for (let [name, handler] of display.commands) {
            helpString += `\n\t${name}`;
        }

        display.appendSystemMessage(`Commands available: \n${helpString}\n`);
    });

    display.commands.set("global", () => {
        display.updateState({
            globalMessages: !display.getState().globalMessages
        });

        if (display.getState().globalMessages) {
            display.appendSystemMessage("Displaying global messages");
        }
        else {
            display.appendSystemMessage("No longer displaying global messages");
        }
    });

    display.commands.set("bots", () => {
        display.updateState({
            ignoreBots: !display.getState().ignoreBots
        });

        if (display.getState().ignoreBots) {
            display.appendSystemMessage("No longer displaying bot messages");
        }
        else {
            display.appendSystemMessage("Displaying bot messages");
        }
    });

    display.commands.set("clear", () => {
        display.options.nodes.messages.setContent("");
        display.render();
    });

    display.commands.set("c", (args: string[]) => {
        if (!display.getState().guild) {
            display.appendSystemMessage("No active guild");
        }
        else if (display.getState().guild.channels.has(args[0])) {
            // TODO: Verify that it's a text channel.
            display.setActiveChannel(display.getState().guild.channels.get(args[0]) as TextChannel);
        }
        else {
            const channel: TextChannel = display.getState().guild.channels.array().find((channel) => channel.type === "text" && (channel.name === args[0] || "#" + channel.name === args[0])) as TextChannel;

            if (channel) {
                display.setActiveChannel(channel as TextChannel);
            }
            else {
                display.appendSystemMessage(`Such channel does not exist in guild '${display.getState().guild.name}'`);
            }
        }
    });

    display.commands.set("g", (args: string[]) => {
        if (display.client.guilds.has(args[0])) {
            display.setActiveGuild(display.client.guilds.get(args[0]) as Guild);
        }
        else {
            display.appendSystemMessage("Such guild does not exist");
        }
    });

    display.commands.set("reset", () => {
        display.render(true);
    });
}
