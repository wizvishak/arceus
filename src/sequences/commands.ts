import {TextChannel} from "discord.js";
import {Timer} from "./core";
import App from "../app";
import * as SequenceUtil from "./utils";
import * as SequenceSettings from "./settings";
import * as AmelieUtil from "./amelie/utils";
import {DISCORD_SERVERS} from "./amelie/settings";

const {
    EXIT_CODE,
    SERVERS,
    MixedTalk,
    Scream
} = SequenceSettings;

const { AmelieTalk } = AmelieUtil;

export default function setupSpeechCommands(app: App): void {
    // Utils
    const changeChannel = (channelName: string): void => SequenceUtil.changeChannel(channelName, app),
        changeGuild = (guildSnowflake: string): void => SequenceUtil.changeGuild(guildSnowflake, app);

    // Custom speech commands
    app.commands.set("talk", async (args: string[]) => {
        const HOME = (args.length === 0) ? SERVERS.$ATLAS : SERVERS[`$${args[0].toUpperCase()}`];

        // Switch guild
        changeGuild(HOME.GUILD);

        // Switch channel
        changeChannel(HOME.CHANNEL);

        // Start talking
        const channel: TextChannel = app.state.get().channel;
        const mixedChatter = async () => {
            app.stopTyping();
            app.startTyping();
            await channel.send(MixedTalk.talk());
            Timer.active = setTimeout(mixedChatter, MixedTalk.silence);
        }

        app.message.system(`{bold}${app.client.user.tag}{/bold} is talking now...`);
        await channel.send(MixedTalk.talk())
        Timer.active = setTimeout(mixedChatter, MixedTalk.silence);
    });

    app.commands.set("scream", async (args: string[]) => {
        const HOME = (args.length === 0) ? SERVERS.$ATLAS : SERVERS[`$${args[0].toUpperCase()}`];

        // Switch guild
        changeGuild(HOME.GUILD);

        // Switch channel
        changeChannel(HOME.CHANNEL);

        // Start talking
        const channel: TextChannel = app.state.get().channel;
        const scream = async () => {
            app.stopTyping();
            app.startTyping();
            await channel.send(Scream.talk());
            Timer.active = setTimeout(scream, Scream.silence);
        }

        app.message.system(`{bold}${app.client.user.tag}{/bold} is talking now...`);
        await channel.send(Scream.talk())
        Timer.active = setTimeout(scream, Scream.silence);
    });

    app.commands.set('silence', (args: string[]) => {
        clearTimeout(Timer.active);
        app.message.system(`{bold}${app.client.user.tag}{/bold} has been silenced!`);
    });

    app.commands.set('amelie', async (args: string[]) => {
        const HOME = (args.length === 0)
            ? DISCORD_SERVERS.$ATLAS
            : DISCORD_SERVERS[`$${args[0].toUpperCase()}`];

        // Switch guild
        changeGuild(HOME.GUILD);

        // Switch channel
        changeChannel(HOME.CHANNEL);

        // Start talking
        const channel: TextChannel = app.state.get().channel;
        const amelie = async () => {
            app.stopTyping();
            app.startTyping();
            await channel.send(AmelieTalk.talkInOrder());
            if(AmelieTalk.talking()) {
                Timer.active = setTimeout(amelie, AmelieTalk.silence);
            }
        }

        app.message.system(`{bold}${app.client.user.tag}{/bold} is talking to @Amelie now...`);
        await channel.send(AmelieTalk.talkInOrder());
        Timer.active = setTimeout(amelie, AmelieTalk.silence);
    });

    app.commands.set('x', async (args: string[]) => {
        app.stopTyping();
        await app.client.destroy();
        app.state.saveSync();
        process.exit(EXIT_CODE);
    });
}