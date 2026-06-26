const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHARACTERS_DIR = path.join(ROOT, "characters");
const MUSIC_DIR = path.join(ROOT, "music");
const GENERATED_FILE = path.join(ROOT, "data", "generated-characters.js");
const GENERATED_MUSIC_FILE = path.join(ROOT, "data", "generated-music.js");
const IMAGE_NAMES = ["normal", "happy", "sad", "shy"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
const MUSIC_EXTENSIONS = [".mp3", ".ogg", ".wav", ".m4a", ".aac", ".flac"];

function safeId(value) {
  const id = String(value || "")
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return id || `character-${Date.now()}`;
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function findImage(folder, mood) {
  for (const extension of IMAGE_EXTENSIONS) {
    const candidate = path.join(folder, "images", `${mood}${extension}`);
    if (fs.existsSync(candidate)) return `./characters/${path.basename(folder)}/images/${mood}${extension}`;
  }
  return null;
}

function readProfile(folder) {
  const file = path.join(folder, "character.md");
  if (fs.existsSync(file)) return { content: fs.readFileSync(file, "utf8"), source: path.relative(ROOT, file).replaceAll("\\", "/") };
  return null;
}

function normalizeCharacter(folder, config) {
  if (!config || typeof config !== "object") return null;
  const folderName = path.basename(folder);
  const images = {};
  for (const mood of IMAGE_NAMES) {
    images[mood] = findImage(folder, mood);
    if (!images[mood]) return null;
  }
  return {
    id: safeId(config.id || folderName),
    custom: true,
    diskCharacter: true,
    displayName: String(config.displayName || config.name || folderName).slice(0, 40),
    description: String(config.description || config.basicProfile || "").slice(0, 240),
    profilePath: `./characters/${folderName}/character.md`,
    aiProfile: {
      characterization: String(config.characterization || `你是${config.displayName || config.name || folderName}，负责陪伴用户学习词汇。`).slice(0, 1000),
      personality: String(config.basicProfile || config.personality || "").slice(0, 6000)
    },
    images,
    affectionLevels: [
      { min: 0, name: "初次见面" },
      { min: 20, name: "逐渐熟悉" },
      { min: 45, name: "亲近" },
      { min: 70, name: "信赖" },
      { min: 90, name: "重要伙伴" }
    ],
    lines: null
  };
}

function scanCharacters() {
  const generatedCharacters = {};
  const profiles = {};
  if (!fs.existsSync(CHARACTERS_DIR)) fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
  for (const entry of fs.readdirSync(CHARACTERS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folder = path.join(CHARACTERS_DIR, entry.name);
    const profile = readProfile(folder);
    if (profile) profiles[entry.name] = profile;
    const config = readJson(path.join(folder, "character.json"));
    const character = normalizeCharacter(folder, config);
    if (character) generatedCharacters[character.id] = character;
  }
  return { generatedCharacters, profiles };
}

function writeGeneratedCharacters() {
  const { generatedCharacters, profiles } = scanCharacters();
  const source = [
    `const GENERATED_CHARACTERS = ${JSON.stringify(generatedCharacters, null, 2)};`,
    `const GENERATED_CHARACTER_PROFILES = ${JSON.stringify(profiles, null, 2)};`,
    "",
    "for (const character of Object.values(GENERATED_CHARACTERS)) {",
    "  if (!character.lines) character.lines = DEFAULT_TEACHER_LINES;",
    "}",
    "Object.assign(CHARACTERS, GENERATED_CHARACTERS);",
    ""
  ].join("\n");
  fs.writeFileSync(GENERATED_FILE, source, "utf8");
  return { characterCount: Object.keys(generatedCharacters).length, profileCount: Object.keys(profiles).length };
}

function scanMusic() {
  const tracks = [];
  if (!fs.existsSync(MUSIC_DIR)) fs.mkdirSync(MUSIC_DIR, { recursive: true });
  for (const entry of fs.readdirSync(MUSIC_DIR, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!MUSIC_EXTENSIONS.includes(extension)) continue;
    const name = path.basename(entry.name, extension);
    tracks.push({
      id: safeId(`music-${entry.name}`),
      title: name,
      file: entry.name,
      src: `./music/${encodeURIComponent(entry.name)}`
    });
  }
  tracks.sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"));
  return tracks;
}

function writeGeneratedMusic() {
  const tracks = scanMusic();
  const source = [
    `const GENERATED_MUSIC_TRACKS = ${JSON.stringify(tracks, null, 2)};`,
    ""
  ].join("\n");
  fs.writeFileSync(GENERATED_MUSIC_FILE, source, "utf8");
  return { trackCount: tracks.length };
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Invalid image data");
  return { extension: match[1] === "jpeg" ? "jpg" : match[1], buffer: Buffer.from(match[2], "base64") };
}

function createDiskCharacter(payload) {
  const name = String(payload.name || "").trim();
  const basicProfile = String(payload.basicProfile || "").trim();
  if (!name || !basicProfile) throw new Error("Missing character fields");
  const id = safeId(payload.id || name);
  const folder = path.resolve(CHARACTERS_DIR, id);
  if (!folder.startsWith(`${CHARACTERS_DIR}${path.sep}`)) throw new Error("Invalid character path");
  if (fs.existsSync(folder)) throw new Error("Character already exists");
  fs.mkdirSync(path.join(folder, "images"), { recursive: true });
  const images = payload.images || {};
  for (const mood of IMAGE_NAMES) {
    const decoded = dataUrlToBuffer(images[mood]);
    fs.writeFileSync(path.join(folder, "images", `${mood}.${decoded.extension}`), decoded.buffer);
  }
  const characterMd = [
    `# ${name}`,
    "",
    basicProfile,
    "",
    "## 内容边界",
    "",
    "严禁讨论政治、色情、暴力等话题。遇到这些内容时礼貌拒绝，并引导回词汇学习或安全的日常交流。",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(folder, "character.md"), characterMd, "utf8");
  fs.writeFileSync(path.join(folder, "character.json"), JSON.stringify({
    id,
    displayName: name,
    description: basicProfile.slice(0, 160),
    basicProfile
  }, null, 2), "utf8");
  writeGeneratedCharacters();
  const config = readJson(path.join(folder, "character.json"));
  const character = normalizeCharacter(folder, config);
  return { character, profile: readProfile(folder) };
}

module.exports = {
  ROOT,
  createDiskCharacter,
  writeGeneratedCharacters,
  writeGeneratedMusic
};
