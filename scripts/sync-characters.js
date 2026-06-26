const { writeGeneratedCharacters, writeGeneratedMusic } = require("./character-tools");

const result = writeGeneratedCharacters();
const musicResult = writeGeneratedMusic();
console.log(`Synced ${result.profileCount} character profiles and ${result.characterCount} generated characters.`);
console.log(`Synced ${musicResult.trackCount} background music tracks.`);
