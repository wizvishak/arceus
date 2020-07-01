import Talk from "../core";
import {pickRandomRange} from "../utils";
import * as SETTINGS from "./settings";

const {
    SILENCE,
    $AMELIE_PREFIX,
    AMELIE_WORDS
} = SETTINGS;

const amelieSilence = () => pickRandomRange(SILENCE.AMELIE.MIN, SILENCE.AMELIE.MAX);

export const AmelieTalk: Talk = new Talk({
    prefix: $AMELIE_PREFIX,
    words: AMELIE_WORDS,
    silence: amelieSilence()
});