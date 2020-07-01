export const SILENCE = {
    AMELIE: {
        MIN: 2000,
        MAX: 2000
    }
};

export const $AMELIE_PREFIX: string = "+";

// General talk sequence
export const GENERAL_WORDS: string[] = [
    "help",
    "info",
    "ping"
];

// Help talk sequence
export const HELP_WORDS: string[] = [
    "help help",
    "help info",
    "help ping",
    "help nazar",
    "help sally"
];

// Nazar talk sequence
export const NAZAR_WORDS: string[] = [
    "nazar",
    "nazar wya",
    "nazar weekly",
    "nazar weekly all",
    "nazar weekly current",
    "nazar weekly guarma"
];

// Sally talk sequence
export const SALLY_WORDS: string[] = [
    "sally",
    "sally events",
    "sally events general",
    "sally events role"
];

// Amelie talk sequence
export const AMELIE_WORDS: string[] = [].concat(
    GENERAL_WORDS,
    HELP_WORDS,
    NAZAR_WORDS,
    SALLY_WORDS
);

// Discord Servers
export const DISCORD_SERVERS = {
  $ATLAS: {
      GUILD: "695323071526994051",
      CHANNEL: "neo-so-corpos"
  }
};