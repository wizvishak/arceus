import Talk from "./core";
import * as SequenceUtil from "./utils";

const {
    pickRandomRange,
    pickRandom
} = SequenceUtil

const SILENCE = {
    MEMER: {
        MIN: 3000,
        MAX: 5000
    },
    SCREAM: {
        MIN: 1000,
        MAX: 3000
    },
    SHIRO: {
        MIN: 1000,
        MAX: 3000
    },
    POKEMON: {
        MIN: 1000,
        MAX: 3000
    },
    MIXED: {
        MIN: 3000,
        MAX: 5000
    }
};

// Memer Talk Generation
const $MEMER_PREFIX: string = "pls ";
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

export const MemerTalk: Talk = new Talk({
    prefix: $MEMER_PREFIX,
    words: memerWords,
    silence: memerSilence()
});

// Scream generation
const $SCREAM_PREFIX = '';
const screamers: string[] = [
    "aaaaa",
    "aaaaaaaaaaaaaaaaaa",
    "aaaaaaaaaa",
    "aaaaaaaaaaaaaaa",
    "aaaaaaaaaaa",
];
const screamInterval = () => pickRandomRange(SILENCE.SCREAM.MIN, SILENCE.SCREAM.MAX);

export const Scream: Talk = new Talk({
    prefix: $SCREAM_PREFIX,
    words: screamers,
    silence: screamInterval()
});

// Shiro talk generation
const $SHIRO_PREFIX = 's!';
const shiroWords: string[] = [
    "serverinfo",
    "userinfo",
    "perms",
    "ping",
    "avatar",
    "stats",
    "help",
    "invite",
    "poke",
    "bite",
    "hug",
    "shibe",
    "cutedog",
    "meme"
];
const shiroSilence = () => pickRandomRange(SILENCE.SHIRO.MIN, SILENCE.SHIRO.MAX);

export const ShiroTalk: Talk = new Talk({
    prefix: $SHIRO_PREFIX,
    words: shiroWords,
    silence: shiroSilence()
});

// Pokemon talk generation
const $POKEMON_PREFIX = 'p!';
const pokemonWords: string[] = [
    "info",
    "market search --price 2 --order iv d --showiv",
    "market search --price 3 --order iv d --showiv",
    "market search --price 4 --order iv d --showiv",
    "market search --price 5 --order iv d --showiv",
    "pokemon"
]
const pokemonSilence = () => pickRandomRange(SILENCE.POKEMON.MIN, SILENCE.POKEMON.MAX);

export const PokemonTalk: Talk = new Talk({
    prefix: $POKEMON_PREFIX,
    words: pokemonWords,
    silence: pokemonSilence()
});

// Mixed talk generation
const $NO_PREFIX = '';
const mixedWords: string[] = [].concat(
    MemerTalk.words,
    Scream.words,
    ShiroTalk.words,
    PokemonTalk.words
);
const mixedSilence = () => pickRandomRange(SILENCE.MIXED.MIN, SILENCE.MIXED.MAX);

export const MixedTalk: Talk = new Talk({
    prefix: $NO_PREFIX,
    words: mixedWords,
    silence: mixedSilence()
});

// Export constants
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