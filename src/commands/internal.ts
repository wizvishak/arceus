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
        if (display.state.get().guild && display.state.get().channel) {
            display.message.system(`Currently on guild '{bold}${display.state.get().guild.name}{/bold}' # '{bold}${display.state.get().channel.name}{/bold}'`)
        }
        else if (display.state.get().guild) {
            display.message.system(`Currently on guild '{bold}${display.state.get().guild.name}{/bold}`);
        }
        else {
            display.message.system("No active guild");
        }
    });

    display.commands.set("mute", () => {
        display.state.update({
            muted: !display.state.get().muted
        });

        if (display.state.get().muted) {
            display.message.system("Muted mode activated");
        }
        else {
            display.message.system("Muted mode is no longer activated");
        }
    });

    display.commands.set("ignore", (args: string[]) => {
        if (!args[0]) {
            if (display.state.get().ignoredUsers.length === 0) {
                display.message.system("Not ignoring anyone");

                return;
            }

            const usersString: string = display.state.get().ignoredUsers.map((userId: Snowflake) => `@{bold}${userId}{/bold}`).join(", ");

            display.message.system(`Currently ignoring messages from: ${usersString}`);
        }
        else if (display.client.user && display.client.user.id === args[0]) {
            display.message.system("You can't ignore yourself, silly");
        }
        else if (display.state.get().ignoredUsers.includes(args[0])) {
            display.state.get().ignoredUsers.splice(display.state.get().ignoredUsers.indexOf(args[0]), 1);
            display.message.system(`Removed user @{bold}${args[0]}{/bold} from the ignore list`);
        }
        else {
            if (display.state.get().trackList.includes(args[0])) {
                display.state.get().trackList.splice(display.state.get().trackList.indexOf(args[0]), 1);
                display.message.system(`No longer tracking @{bold}${args[0]}{/bold}`);
            }

            display.state.get().ignoredUsers.push(args[0]);
            display.message.system(`Added user @{bold}${args[0]}{/bold} to the ignore list`);
        }
    });

    display.commands.set("edit", async (args: string[]) => {
        // TODO: Display message.
        if (!args[0] || !args[1] || !display.state.get().channel) {
            return;
        }

        const message: Message = await display.state.get().channel.fetchMessage(args[0]) as Message;

        if (message && message.editable) {
            await message.edit(args.slice(1).join(" "));
        }
        else {
            display.message.system("That message doesn't exist or it is not editable");
        }
    });

    display.commands.set("save", () => {
        display.saveStateSync();
    });

    display.commands.set("format", (args: string[]) => {
        display.state.update({
            messageFormat: args.join(" ")
        });

        display.message.system(`Successfully changed format to '${display.state.get().messageFormat}'`);
    });

    display.commands.set("forget", () => {
        if (display.state.get().token) {
            display.state.update({
                token: undefined
            });

            display.saveStateSync();
        }
    });

    display.commands.set("encrypt", (args: string[]) => {
        if (!args[0]) {
            display.message.system("You must provide a password");

            return;
        }

        display.state.update({
            decriptionKey: args[0]
        });

        display.message.system(`Using decryption key '{bold}${args[0]}{/bold}'`);
    });

    display.commands.set("doencrypt", () => {
        display.state.update({
            encrypt: !display.state.get().encrypt
        });

        if (display.state.get().encrypt) {
            display.message.system("Now encrypting messages");
        }
        else {
            display.message.system("No longer encrypting messages");
        }
    });

    display.commands.set("theme", (args: string[]) => {
        if (!args[0]) {
            display.message.system(`The current theme is '{bold}${display.state.get().theme}{/bold}'`)

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

            display.message.system(themesString);
        }
        else {
            display.message.system("Themes directory does not exist");
        }
    });

    display.commands.set("tag", (args: string[]) => {
        if (!args[0]) {
            const tags: string[] = display.getTags();

            if (tags.length === 0) {
                display.message.system("No tags have been set");

                return;
            }

            const tagsString: string = tags.map((tag: string) => `{bold}${tag}{/bold}`).join(", ");

            display.message.system(`Tags: ${tagsString}`);
        }
        else if (args.length === 2) {
            display.setTag(args[0], args[1]);
            display.message.system(`Successfully saved tag '{bold}${args[0]}{/bold}'`);
        }
        else if (args.length === 1 && display.hasTag(args[0])) {
            display.deleteTag(args[0]);
            display.message.system(`Successfully deleted tag '{bold}${args[0]}{/bold}'`);
        }
        else {
            display.message.system("Such tag does not exist");
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
            display.message.system("Expecting both recipient and message arguments");

            return;
        }

        if (display.client.users.has(args[0])) {
            const recipient: User = display.client.users.get(args[0]) as User;

            (await recipient.createDM()).send(args.slice(1).join(" ")).catch((error: Error) => {
                display.message.system(`Unable to send message: ${error.message}`);
            });
        }
        else {
            display.message.system("Such user does not exist or has not been cached");
        }
    });

    display.commands.set("fullscreen", () => {
        display.toggleChannels();
    });

    display.commands.set("me", () => {
        // TODO: Add valid method to check if logged in.
        if (display.client.user) {
            display.message.system(`Logged in as {bold}${display.client.user.tag}{/bold} | {bold}${Math.round(display.client.ping)}{/bold}ms`);
        }
        else {
            display.message.system("Not logged in");
        }
    });

    display.commands.set("sync", () => {
        display.state.sync();
    });

    display.commands.set("pin", (args: string[]) => {
        if (!args[0]) {
            if (display.state.get().wordPins.length === 0) {
                display.message.system("No set word pins");

                return;
            }

            const wordPinsString: string = display.state.get().wordPins.map((pin: string) => `{bold}${pin}{/bold}`).join(", ");

            display.message.system(`Word pins: ${wordPinsString}`);
        }
        else if (display.state.get().wordPins.includes(args[0])) {
            display.state.get().wordPins.splice(display.state.get().wordPins.indexOf(args[0]), 1);
            display.message.system(`Removed word '{bold}${args[0]}{/bold}' from pins`);
        }
        else {
            display.state.get().wordPins.push(args[0]);
            display.message.system(`Added word '{bold}${args[0]}{/bold}' to pins`);
        }
    });

    display.commands.set("track", (args: string[]) => {
        if (!args[0]) {
            if (display.state.get().trackList.length === 0) {
                display.message.system("Not tracking anyone");

                return;
            }

            const usersString: string = display.state.get().trackList.map((userId: Snowflake) => `@{bold}${userId}{/bold}`).join(", ");

            display.message.system(`Tracking users: ${usersString}`);
        }
        else if (display.client.user && display.client.user.id === args[0]) {
            display.message.system("You can't track yourself, silly");
        }
        else if (display.state.get().trackList.includes(args[0])) {
            display.state.get().trackList.splice(display.state.get().trackList.indexOf(args[0]), 1);
            display.message.system(`No longer tracking @{bold}${args[0]}{/bold}`);
        }
        else if (display.client.users.has(args[0])) {
            if (display.state.get().ignoredUsers.includes(args[0])) {
                display.message.system("You must first stop ignoring that user");

                return;
            }

            display.state.get().trackList.push(args[0]);
            display.message.system(`Now tracking @{bold}${args[0]}{/bold}`);
        }
        else {
            display.message.system("No such user cached");
        }
    });

    display.commands.set("help", () => {
        let helpString: string = "";

        for (let [name, handler] of display.commands) {
            helpString += `\n\t${name}`;
        }

        display.message.system(`Commands available: \n${helpString}\n`);
    });

    display.commands.set("global", () => {
        display.state.update({
            globalMessages: !display.state.get().globalMessages
        });

        if (display.state.get().globalMessages) {
            display.message.system("Displaying global messages");
        }
        else {
            display.message.system("No longer displaying global messages");
        }
    });

    display.commands.set("bots", () => {
        display.state.update({
            ignoreBots: !display.state.get().ignoreBots
        });

        if (display.state.get().ignoreBots) {
            display.message.system("No longer displaying bot messages");
        }
        else {
            display.message.system("Displaying bot messages");
        }
    });

    display.commands.set("clear", () => {
        display.options.nodes.messages.setContent("");
        display.render();
    });

    display.commands.set("c", (args: string[]) => {
        if (!display.state.get().guild) {
            display.message.system("No active guild");
        }
        else if (display.state.get().guild.channels.has(args[0])) {
            // TODO: Verify that it's a text channel.
            display.setActiveChannel(display.state.get().guild.channels.get(args[0]) as TextChannel);
        }
        else {
            const channel: TextChannel = display.state.get().guild.channels.array().find((channel) => channel.type === "text" && (channel.name === args[0] || "#" + channel.name === args[0])) as TextChannel;

            if (channel) {
                display.setActiveChannel(channel as TextChannel);
            }
            else {
                display.message.system(`Such channel does not exist in guild '${display.state.get().guild.name}'`);
            }
        }
    });

    display.commands.set("g", (args: string[]) => {
        if (display.client.guilds.has(args[0])) {
            display.setActiveGuild(display.client.guilds.get(args[0]) as Guild);
        }
        else {
            display.message.system("Such guild does not exist");
        }
    });

    display.commands.set("reset", () => {
        display.render(true);
    });
}
