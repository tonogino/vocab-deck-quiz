const { writeGeneratedCharacters } = require("./character-tools");

const result = writeGeneratedCharacters();
console.log(`Synced ${result.profileCount} character profiles and ${result.characterCount} generated characters.`);
