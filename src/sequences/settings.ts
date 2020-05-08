import Talk from "./core";
import * as SequenceUtil from "./utils";

const {
    pickRandomRange,
    pickRandom
} = SequenceUtil;

// Memer Talk Generation
const $MEMER_PREFIX: string = "pls ";
const SILENCE = {
    MEMER: {
        MIN: 3000,
        MAX: 10000
    }
};
const memerWords: string[] = [
    "beg",
    "slots all",
    "dep all",
    "bal",
    "rankthot",
    "waifu",
    "foodporn",
    "roast"
];
const memerSilence = () => pickRandomRange(SILENCE.MEMER.MIN, SILENCE.MEMER.MAX);

// TODO: Shiro Talk Generation

// Exports
export const MemerTalk: Talk = new Talk({
    prefix: $MEMER_PREFIX,
    words: memerWords,
    silence: memerSilence()
});

export const EXIT_CODE: number = 0;

export const SERVERS = {
    $ATLAS: {
        GUILD: "695323071526994051",
        CHANNEL: "spam"
    },
    $ECHO: {
        GUILD: "546619551903907861",
        CHANNEL: "spam"
    }
}