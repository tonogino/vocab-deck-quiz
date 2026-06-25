const SAVE_SLOTS_KEY = "sophia_v2_save_slots";
const ACTIVE_SAVE_KEY = "sophia_v2_active_save_id";
const ADVANCED_SAVE_SLOTS_KEY = "sophia_v3_advanced_save_slots";
const ADVANCED_ACTIVE_SAVE_KEY = "sophia_v3_advanced_active_save_id";
const VOCAB_LIBRARIES_KEY = "sophia_v2_vocab_libraries";
const LANGUAGE_KEY = "sophia_v2_language";
const DATA_VERSION_KEY = "sophia_v2_data_version";
const GAME_MODE_KEY = "sophia_v3_game_mode";
const AI_SETTINGS_KEY = "sophia_v3_ai_settings";
const CUSTOM_CHARACTERS_KEY = "sophia_v3_custom_characters";

const state = {
  activeSaveId: null,
  activeEventId: null,
  eventLineIndex: 0,
  words: [],
  language: localStorage.getItem(LANGUAGE_KEY) || "zh",
  mode: localStorage.getItem(GAME_MODE_KEY) === "advanced" ? "advanced" : "normal",
  questionLocked: false,
  advancing: false,
  advanceTimer: null,
  aiBusy: false
};

const $ = id => document.getElementById(id);
const el = {
  startScreen: $("startScreen"), gameScreen: $("gameScreen"), libraryScreen: $("libraryScreen"),
  characterScreen: $("characterScreen"), eventScreen: $("eventScreen"), settingsScreen: $("settingsScreen"),
  languageSelect: $("languageSelect"), gameLanguageSelect: $("gameLanguageSelect"),
  normalModeBtn: $("normalModeBtn"), advancedModeBtn: $("advancedModeBtn"), modeNotice: $("modeNotice"),
  saveSlotList: $("saveSlotList"), createSaveBtn: $("createSaveBtn"),
  currentSaveName: $("currentSaveName"), backToStartBtn: $("backToStartBtn"), libraryBtn: $("libraryBtn"),
  characterBtn: $("characterBtn"), eventBtn: $("eventBtn"), characterName: $("characterName"),
  settingsBtn: $("settingsBtn"),
  affectionValue: $("affectionValue"), affectionLevel: $("affectionLevel"), wordCounter: $("wordCounter"),
  correctRate: $("correctRate"), wordText: $("wordText"), wordHint: $("wordHint"), answerInput: $("answerInput"),
  submitBtn: $("submitBtn"), showAnswerBtn: $("showAnswerBtn"), nextBtn: $("nextBtn"),
  feedbackText: $("feedbackText"), characterImage: $("characterImage"), speakerName: $("speakerName"),
  dialogueText: $("dialogueText"), closeLibraryBtn: $("closeLibraryBtn"), librarySelectList: $("librarySelectList"),
  aiChatPanel: $("aiChatPanel"), aiChatTitle: $("aiChatTitle"), aiChatLog: $("aiChatLog"), aiChatInput: $("aiChatInput"),
  aiSendBtn: $("aiSendBtn"), aiStatusText: $("aiStatusText"),
  libraryHint: $("libraryHint"), newLibraryNameInput: $("newLibraryNameInput"), createLibraryBtn: $("createLibraryBtn"),
  wordLibrarySelect: $("wordLibrarySelect"), newWordInput: $("newWordInput"), newAnswerInput: $("newAnswerInput"),
  newHintInput: $("newHintInput"), addWordBtn: $("addWordBtn"), libraryWordList: $("libraryWordList"),
  exportLibrariesBtn: $("exportLibrariesBtn"), importLibrariesBtn: $("importLibrariesBtn"),
  libraryFileInput: $("libraryFileInput"), libraryTransferStatus: $("libraryTransferStatus"),
  closeCharacterBtn: $("closeCharacterBtn"), selectedCharacterImage: $("selectedCharacterImage"),
  selectedCharacterName: $("selectedCharacterName"), selectedCharacterDescription: $("selectedCharacterDescription"),
  characterSelectList: $("characterSelectList"), personalityFilePanel: $("personalityFilePanel"),
  personalityFileName: $("personalityFileName"), selectPersonalityFileBtn: $("selectPersonalityFileBtn"),
  resetPersonalityFileBtn: $("resetPersonalityFileBtn"), personalityFileInput: $("personalityFileInput"),
  personalityFileStatus: $("personalityFileStatus"),
  closeEventBtn: $("closeEventBtn"), eventList: $("eventList"),
  eventListPanel: $("eventListPanel"), eventPlayPanel: $("eventPlayPanel"),
  eventCharacterImage: $("eventCharacterImage"), eventSpeakerName: $("eventSpeakerName"),
  eventProgressText: $("eventProgressText"), eventDialogueText: $("eventDialogueText"),
  eventNextLineBtn: $("eventNextLineBtn"), eventExitBtn: $("eventExitBtn"),
  closeSettingsBtn: $("closeSettingsBtn"), apiKeyInput: $("apiKeyInput"), apiTypeSelect: $("apiTypeSelect"),
  apiModelInput: $("apiModelInput"),
  apiBaseUrlInput: $("apiBaseUrlInput"), saveApiSettingsBtn: $("saveApiSettingsBtn"), testApiBtn: $("testApiBtn"),
  apiTestStatus: $("apiTestStatus"), clearChatBtn: $("clearChatBtn"),
  customCharacterNameInput: $("customCharacterNameInput"),
  customCharacterProfileInput: $("customCharacterProfileInput"),
  customNormalImageInput: $("customNormalImageInput"), customHappyImageInput: $("customHappyImageInput"),
  customSadImageInput: $("customSadImageInput"), customShyImageInput: $("customShyImageInput"),
  createCharacterBtn: $("createCharacterBtn"), createCharacterStatus: $("createCharacterStatus")
};

function createId(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`; }
function safeParse(raw, fallback) { try { return JSON.parse(raw) ?? fallback; } catch { return fallback; } }
function clamp(number, min, max) { return Math.max(min, Math.min(max, number)); }
function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }
function escapeHtml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function normalizeAnswer(text) {
  return text.trim().toLowerCase().replace(/[，。！？、,.!?]/g, "").replace(/\s+/g, "");
}
function parseAnswerList(text) { return text.split(/[;；,，、/]/).map(item => item.trim()).filter(Boolean); }
function interpolate(text, values = {}) {
  return String(text).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}
function t(path, values) {
  const parts = path.split(".");
  let value = I18N[state.language] || I18N.zh;
  for (const part of parts) value = value?.[part];
  if (value === undefined) {
    value = I18N.zh;
    for (const part of parts) value = value?.[part];
  }
  return interpolate(value ?? path, values);
}

function isAdvancedMode() { return state.mode === "advanced"; }
function getSaveSlotsKey() { return isAdvancedMode() ? ADVANCED_SAVE_SLOTS_KEY : SAVE_SLOTS_KEY; }
function getActiveSaveKey() { return isAdvancedMode() ? ADVANCED_ACTIVE_SAVE_KEY : ACTIVE_SAVE_KEY; }
function loadSaveSlots() {
  const saves = safeParse(localStorage.getItem(getSaveSlotsKey()), []);
  return Array.isArray(saves) ? saves : [];
}
function saveSaveSlots(saves) { localStorage.setItem(getSaveSlotsKey(), JSON.stringify(saves)); }
function removeLibraryFromAllSaves(libraryId) {
  [SAVE_SLOTS_KEY, ADVANCED_SAVE_SLOTS_KEY].forEach(key => {
    const saves = safeParse(localStorage.getItem(key), []);
    if (!Array.isArray(saves)) return;
    localStorage.setItem(key, JSON.stringify(saves.map(save => ({
      ...save,
      selectedLibraries: (save.selectedLibraries || []).filter(id => id !== libraryId)
    }))));
  });
}
function getActiveSave() { return loadSaveSlots().find(save => save.id === state.activeSaveId) || null; }
function createCharacterState() {
  return {
    affection: 0,
    currentIndex: 0,
    totalAnswered: 0,
    correctAnswered: 0,
    finishedEvents: [],
    wrongStreak: 0,
    angerPenaltyQuestions: 0,
    angryUntil: 0,
    shuffleSeed: null,
    chatHistory: [],
    personalityProfile: null
  };
}
function characterStateFields() { return Object.keys(createCharacterState()); }
function ensureCharacterStates(save) {
  const characterId = save.characterId || "default";
  const characterStates = { ...(save.characterStates || {}) };
  if (!characterStates[characterId]) {
    const stateData = createCharacterState();
    characterStateFields().forEach(field => {
      if (save[field] !== undefined) stateData[field] = save[field];
    });
    characterStates[characterId] = stateData;
  }
  return { ...save, characterId, characterStates };
}
function snapshotActiveCharacterState(save) {
  const migrated = ensureCharacterStates(save);
  const characterData = {};
  characterStateFields().forEach(field => { characterData[field] = migrated[field]; });
  return {
    ...migrated,
    characterStates: {
      ...migrated.characterStates,
      [migrated.characterId]: characterData
    }
  };
}
function activateCharacterState(save, characterId) {
  const stored = snapshotActiveCharacterState(save);
  const characterData = stored.characterStates[characterId] || createCharacterState();
  return {
    ...stored,
    ...characterData,
    characterId,
    characterStates: {
      ...stored.characterStates,
      [characterId]: characterData
    }
  };
}
function updateActiveSave(updater) {
  const saves = loadSaveSlots();
  const index = saves.findIndex(save => save.id === state.activeSaveId);
  if (index < 0) return null;
  const updated = updater({ ...ensureCharacterStates(saves[index]) });
  saves[index] = snapshotActiveCharacterState(updated);
  saveSaveSlots(saves);
  return saves[index];
}

function loadAiSettings() {
  const settings = safeParse(localStorage.getItem(AI_SETTINGS_KEY), {});
  const savedBaseUrl = typeof settings.baseUrl === "string" ? settings.baseUrl.trim() : "";
  return {
    apiKey: typeof settings.apiKey === "string" ? settings.apiKey : "",
    apiType: settings.apiType === "responses"
      ? "responses"
      : settings.apiType === "chat_completions"
        ? "chat_completions"
        : savedBaseUrl.includes("api.openai.com")
          ? "responses"
          : "chat_completions",
    model: typeof settings.model === "string" && settings.model.trim()
      ? settings.model.trim()
      : "[m1]claude-sonnet-4-6",
    baseUrl: savedBaseUrl
      ? savedBaseUrl.replace(/\/+$/, "")
      : "https://pro.mmw.ink/v1"
  };
}
function saveAiSettings(settings) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}
function loadCustomCharacters() {
  const characters = safeParse(localStorage.getItem(CUSTOM_CHARACTERS_KEY), []);
  return Array.isArray(characters) ? characters : [];
}
function saveCustomCharacters(characters) {
  localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(characters));
}
function getAllCharacters() {
  const characters = new Map(Object.values(CHARACTERS).map(character => [character.id, character]));
  loadCustomCharacters().forEach(character => {
    if (!characters.has(character.id)) characters.set(character.id, character);
  });
  return [...characters.values()];
}
function findCharacter(characterId) {
  return CHARACTERS[characterId] || loadCustomCharacters().find(character => character.id === characterId) || null;
}
function getGeneratedProfile(characterId) {
  if (typeof GENERATED_CHARACTER_PROFILES === "undefined") return null;
  const profile = GENERATED_CHARACTER_PROFILES[characterId];
  return profile && typeof profile.content === "string" && profile.content.trim() ? profile : null;
}
function normalizePersonalityMarkdown(markdown) {
  return String(markdown || "")
    .replace(/^\uFEFF/, "")
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "· ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 6000);
}

function ensureVocabLibraries() {
  const existing = safeParse(localStorage.getItem(VOCAB_LIBRARIES_KEY), []);
  if (!Array.isArray(existing) || !existing.length) {
    localStorage.setItem(VOCAB_LIBRARIES_KEY, JSON.stringify(DEFAULT_VOCAB_LIBRARIES));
    return;
  }
  if (localStorage.getItem(DATA_VERSION_KEY) !== "3") {
    const customLibraries = existing.filter(library => library.id !== "default_basic");
    localStorage.setItem(VOCAB_LIBRARIES_KEY, JSON.stringify([...DEFAULT_VOCAB_LIBRARIES, ...customLibraries]));
    localStorage.setItem(DATA_VERSION_KEY, "3");
  }
}
function loadLibraries() {
  ensureVocabLibraries();
  const libraries = safeParse(localStorage.getItem(VOCAB_LIBRARIES_KEY), []);
  return Array.isArray(libraries) ? libraries : [];
}
function saveLibraries(libraries) { localStorage.setItem(VOCAB_LIBRARIES_KEY, JSON.stringify(libraries)); }

function sanitizeFilename(name) {
  return String(name).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, "-").slice(0, 80);
}
function normalizeImportedWord(item) {
  if (!item || typeof item !== "object") return null;
  const word = typeof item.word === "string" ? item.word.trim() : "";
  const rawAnswers = Array.isArray(item.answer) ? item.answer : typeof item.answer === "string" ? [item.answer] : [];
  const answer = rawAnswers.map(value => String(value).trim()).filter(Boolean);
  if (!word || !answer.length) return null;
  return {
    word,
    answer: [...new Set(answer)],
    hint: typeof item.hint === "string" && item.hint.trim() ? item.hint.trim() : t("system.customWordHint")
  };
}
function uniqueLibraryName(name, libraries) {
  const base = String(name || t("system.importedLibraryName")).trim() || t("system.importedLibraryName");
  const names = new Set(libraries.map(library => library.name));
  if (!names.has(base)) return base;
  let index = 2;
  while (names.has(`${base} (${index})`)) index++;
  return `${base} (${index})`;
}
function extractJsonArrayFromJs(source) {
  const assignment = source.match(/\b(?:const|let|var)\s+WORDS\s*=\s*/);
  if (!assignment) throw new Error("WORDS assignment not found");
  const start = source.indexOf("[", assignment.index + assignment[0].length);
  if (start < 0) throw new Error("WORDS array not found");
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "[") depth++;
    if (character === "]") {
      depth--;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error("Unclosed WORDS array");
}
function parseLibraryFile(source, filename) {
  const trimmed = source.replace(/^\uFEFF/, "").trim();
  let parsed;
  if (filename.toLowerCase().endsWith(".js")) {
    parsed = JSON.parse(extractJsonArrayFromJs(trimmed));
  } else {
    parsed = JSON.parse(trimmed);
  }
  if (Array.isArray(parsed)) {
    if (parsed.every(item => item && Array.isArray(item.words))) return parsed;
    return [{ name: filename.replace(/\.(json|js)$/i, "") || t("system.importedLibraryName"), words: parsed }];
  }
  if (parsed && Array.isArray(parsed.libraries)) return parsed.libraries;
  if (parsed && Array.isArray(parsed.words)) return [parsed];
  throw new Error("Unsupported library structure");
}
function setLibraryTransferStatus(message, isError = false) {
  el.libraryTransferStatus.textContent = message;
  el.libraryTransferStatus.classList.toggle("error", isError);
}

function applyTranslations() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : state.language;
  document.title = t("ui.title");
  el.languageSelect.value = state.language;
  el.gameLanguageSelect.value = state.language;
  document.querySelectorAll("[data-i18n]").forEach(node => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
}
function setLanguage(language) {
  if (!I18N[language]) return;
  state.language = language;
  localStorage.setItem(LANGUAGE_KEY, language);
  applyTranslations();
  renderCurrentScreen();
  if (el.gameScreen.classList.contains("active")) {
    const word = getCurrentWord();
    el.feedbackText.textContent = state.questionLocked && word
      ? t("system.revealed", { answer: word.answer.join(" / ") })
      : t("ui.ready");
  }
}
function setGameMode(mode) {
  if (!["normal", "advanced"].includes(mode)) return;
  state.mode = mode;
  state.activeSaveId = null;
  document.body.classList.remove("sophia-angry");
  localStorage.setItem(GAME_MODE_KEY, mode);
  const activeSaveId = localStorage.getItem(getActiveSaveKey());
  if (activeSaveId && loadSaveSlots().some(save => save.id === activeSaveId)) state.activeSaveId = activeSaveId;
  renderModePicker();
  renderStartScreen();
}
function renderModePicker() {
  const advanced = isAdvancedMode();
  el.normalModeBtn.classList.toggle("selected", !advanced);
  el.advancedModeBtn.classList.toggle("selected", advanced);
  el.modeNotice.textContent = t(advanced ? "ui.advancedModeNotice" : "ui.normalModeNotice");
}
function renderCurrentScreen() {
  if (el.startScreen.classList.contains("active")) renderStartScreen();
  if (el.gameScreen.classList.contains("active")) renderGame();
  if (el.libraryScreen.classList.contains("active")) renderLibraryScreen();
  if (el.characterScreen.classList.contains("active")) renderCharacterScreen();
  if (el.settingsScreen.classList.contains("active")) renderSettingsScreen();
  if (el.eventScreen.classList.contains("active")) {
    if (state.activeEventId) renderEventLine();
    else renderEventScreen();
  }
}

function createNewSave() {
  const saves = loadSaveSlots();
  const save = {
    id: createId("save"), name: `${t("ui.save")} ${saves.length + 1}`, characterId: "default",
    affection: 0, currentIndex: 0, totalAnswered: 0, correctAnswered: 0,
    finishedEvents: [], selectedLibraries: ["default_basic"],
    wrongStreak: 0, angerPenaltyQuestions: 0, angryUntil: 0,
    chatHistory: [], personalityProfile: null,
    characterStates: { default: createCharacterState() },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  saves.push(save);
  saveSaveSlots(saves);
  state.activeSaveId = save.id;
  localStorage.setItem(getActiveSaveKey(), save.id);
  enterGame();
}
function selectSave(saveId) {
  state.activeSaveId = saveId;
  localStorage.setItem(getActiveSaveKey(), saveId);
  enterGame();
}
function deleteSave(saveId) {
  const target = loadSaveSlots().find(save => save.id === saveId);
  if (!target || !confirm(t("system.deleteSaveConfirm", { name: target.name }))) return;
  saveSaveSlots(loadSaveSlots().filter(save => save.id !== saveId));
  if (state.activeSaveId === saveId) {
    state.activeSaveId = null;
    localStorage.removeItem(getActiveSaveKey());
  }
  renderStartScreen();
}
function renameSave(saveId) {
  const saves = loadSaveSlots();
  const target = saves.find(save => save.id === saveId);
  if (!target) return;
  const name = prompt(t("system.renameSavePrompt"), target.name);
  if (!name?.trim()) return;
  target.name = name.trim();
  target.updatedAt = new Date().toISOString();
  saveSaveSlots(saves);
  renderStartScreen();
}

function getCharacter() {
  const save = getActiveSave();
  return findCharacter(save?.characterId) || CHARACTERS.default;
}
function getAffectionLevel(affection) {
  const character = getCharacter();
  let levelIndex = 0;
  character.affectionLevels.forEach((level, index) => {
    if (affection >= level.min) levelIndex = index;
  });
  return t(`ui.relationship${levelIndex}`);
}
function getCharacterDescription(character) {
  const key = {
    default: "ui.characterDescriptionDefault",
    sophia: "ui.characterDescriptionSophia",
    exusiai: "ui.characterDescriptionExusiai"
  }[character.id];
  return key ? t(key) : character.description || character.aiProfile?.personality || "";
}
function getLibraryDisplayName(library) {
  return library.id === "default_basic" ? t("ui.defaultBasicLibrary") : library.name;
}
function getEventTitle(event) {
  const key = {
    event_001: "ui.event001Title",
    event_002: "ui.event002Title",
    event_003: "ui.event003Title",
    event_004: "ui.event004Title"
  }[event.id];
  return key ? t(key) : event.title;
}
function getCorrectRate(save) {
  return !save || save.totalAnswered === 0 ? 0 : Math.round((save.correctAnswered / save.totalAnswered) * 100);
}
function getSelectedWords(save) {
  const selected = new Set(save.selectedLibraries || []);
  const words = [];
  loadLibraries().forEach(library => {
    if (!selected.has(library.id)) return;
    library.words.forEach(word => words.push({
      ...word,
      libraryId: library.id,
      libraryName: getLibraryDisplayName(library)
    }));
  });
  if (words.length && isAdvancedMode() && save.shuffleSeed) {
    words.sort((a, b) => {
      const left = hashText(`${save.shuffleSeed}:${a.libraryId}:${a.word}`);
      const right = hashText(`${save.shuffleSeed}:${b.libraryId}:${b.word}`);
      return left - right;
    });
  }
  return words.length ? words : [{
    word: t("system.emptyLibraryWord"), answer: [""], hint: t("system.emptyLibraryHint"),
    libraryId: "system", libraryName: t("ui.systemLibraryName"), unavailable: true
  }];
}
function hashText(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index++) hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  return hash;
}
function refreshWords() {
  const save = getActiveSave();
  if (!save) { state.words = []; return; }
  state.words = getSelectedWords(save);
  if (save.currentIndex >= state.words.length) {
    updateActiveSave(current => ({ ...current, currentIndex: 0, updatedAt: new Date().toISOString() }));
  }
}
function getCurrentWord() {
  const save = getActiveSave();
  return state.words[save?.currentIndex || 0] || state.words[0];
}

function switchScreen(screenId) {
  [el.startScreen, el.gameScreen, el.libraryScreen, el.characterScreen, el.eventScreen, el.settingsScreen]
    .forEach(screen => screen.classList.remove("active"));
  $(screenId).classList.add("active");
}
function setCharacterMood(mood) {
  const character = getCharacter();
  el.characterImage.src = character.images[mood] || character.images.normal;
}
function speak(type) {
  const save = getActiveSave();
  const character = getCharacter();
  let pool = character.lines[type] || character.lines.start;
  if (isAdvancedMode() && save?.angryUntil > Date.now()) pool = character.lines.angry || pool;
  else if (isAdvancedMode() && save?.affection < 20 && type === "click") pool = character.lines.distant || pool;
  else if (isAdvancedMode() && save?.affection >= 45 && type === "click") pool = character.lines.close || pool;
  else if (save && save.affection >= 70 && Math.random() < 0.45) pool = character.lines.highAffection;
  el.dialogueText.textContent = pickRandom(pool);
}
function setQuestionLocked(locked) {
  state.questionLocked = locked;
  const wordUnavailable = getCurrentWord()?.unavailable;
  const angerLocked = isAdvancedMode() && (getActiveSave()?.angerPenaltyQuestions || 0) > 0;
  el.answerInput.disabled = locked || wordUnavailable || state.advancing;
  el.submitBtn.disabled = locked || wordUnavailable || state.advancing;
  el.showAnswerBtn.disabled = locked || wordUnavailable || state.advancing || angerLocked;
  el.nextBtn.disabled = state.advancing || state.words.length === 0;
  el.studyCard?.classList?.toggle("question-locked", locked);
}
function resetQuestionState(feedback = t("system.newWord")) {
  if (state.advanceTimer) clearTimeout(state.advanceTimer);
  state.advanceTimer = null;
  state.advancing = false;
  state.questionLocked = false;
  el.answerInput.value = "";
  el.feedbackText.textContent = feedback;
  setQuestionLocked(false);
}

function renderStartScreen() {
  const saves = loadSaveSlots();
  if (!saves.length) {
    el.saveSlotList.innerHTML = `<div class="save-slot"><div><strong>${escapeHtml(t("ui.noSaves"))}</strong><span>${escapeHtml(t("ui.noSavesHint"))}</span></div></div>`;
    return;
  }
  el.saveSlotList.innerHTML = saves.map(save => `
    <article class="save-slot">
      <div><strong>${escapeHtml(save.name)}</strong><span>${escapeHtml(t("ui.affection"))} ${save.affection} · ${escapeHtml(t("ui.accuracy", { rate: getCorrectRate(save) }))} · ${escapeHtml(t("ui.libraries"))} ${(save.selectedLibraries || []).length}</span></div>
      <div class="save-actions">
        <button type="button" data-action="load" data-save-id="${save.id}">${escapeHtml(t("ui.enter"))}</button>
        <button class="secondary-btn" type="button" data-action="rename" data-save-id="${save.id}">${escapeHtml(t("ui.rename"))}</button>
        <button class="danger-btn" type="button" data-action="delete" data-save-id="${save.id}">${escapeHtml(t("ui.delete"))}</button>
      </div>
    </article>`).join("");
  el.saveSlotList.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.action === "load") selectSave(button.dataset.saveId);
    if (button.dataset.action === "rename") renameSave(button.dataset.saveId);
    if (button.dataset.action === "delete") deleteSave(button.dataset.saveId);
  }));
}

function renderGame() {
  const save = getActiveSave();
  if (!save) return;
  refreshWords();
  const character = getCharacter();
  const word = getCurrentWord();
  const currentSave = getActiveSave();
  const index = currentSave.currentIndex >= state.words.length ? 0 : currentSave.currentIndex;
  el.currentSaveName.textContent = t("ui.currentSave", { name: currentSave.name });
  el.characterName.textContent = character.displayName;
  el.speakerName.textContent = character.displayName;
  el.affectionValue.textContent = currentSave.affection;
  el.affectionLevel.textContent = getAffectionLevel(currentSave.affection);
  el.wordCounter.textContent = t("ui.wordCounter", { current: index + 1, total: state.words.length });
  el.correctRate.textContent = t("ui.accuracy", { rate: getCorrectRate(currentSave) });
  el.wordText.textContent = word.word;
  const angerPenalty = isAdvancedMode() && (currentSave.angerPenaltyQuestions || 0) > 0;
  el.wordHint.textContent = angerPenalty
    ? `${t("system.angryHintHidden")} · ${t("ui.fromLibrary", { name: word.libraryName })}`
    : `${word.hint || t("ui.noHint")} · ${t("ui.fromLibrary", { name: word.libraryName })}`;
  el.characterImage.alt = character.displayName;
  el.aiChatTitle.textContent = t("ui.chatWithCharacter", { name: character.displayName });
  el.aiChatInput.placeholder = t("ui.chatPlaceholderCharacter", { name: character.displayName });
  el.eventBtn.classList.toggle("hidden", isAdvancedMode() || character.id !== "sophia");
  el.settingsBtn.classList.toggle("hidden", !isAdvancedMode());
  el.aiChatPanel.classList.toggle("hidden", !isAdvancedMode());
  document.body.classList.toggle("sophia-angry", isAdvancedMode() && character.id === "sophia" && currentSave.angryUntil > Date.now());
  if (isAdvancedMode()) renderAiChat();
  setQuestionLocked(state.questionLocked);
}
function enterGame() {
  if (!getActiveSave()) {
    switchScreen("startScreen");
    renderStartScreen();
    return;
  }
  refreshWords();
  resetQuestionState(t("ui.ready"));
  switchScreen("gameScreen");
  renderGame();
  setCharacterMood("normal");
  speak("start");
  el.answerInput.focus();
}

function checkAnswer() {
  const word = getCurrentWord();
  if (!word || word.unavailable || state.advancing) return;
  if (state.questionLocked) {
    el.feedbackText.textContent = t("system.questionLocked");
    return;
  }
  const answer = normalizeAnswer(el.answerInput.value);
  if (!answer) {
    el.feedbackText.textContent = t("system.emptyInput");
    return;
  }
  const correct = word.answer.map(normalizeAnswer).includes(answer);
  const updatedSave = updateActiveSave(save => ({
    ...save,
    totalAnswered: save.totalAnswered + 1,
    correctAnswered: save.correctAnswered + (correct ? 1 : 0),
    affection: clamp(save.affection + (correct ? 3 : -2), 0, 100),
    wrongStreak: correct ? 0 : (save.wrongStreak || 0) + 1,
    updatedAt: new Date().toISOString()
  }));
  if (correct) {
    state.advancing = true;
    el.feedbackText.textContent = t("system.correct");
    setCharacterMood("happy");
    speak("correct");
    renderGame();
    setQuestionLocked(false);
    state.advanceTimer = setTimeout(() => nextWord(), 850);
    return;
  }
  if (isAdvancedMode() && getCharacter().id === "sophia" && updatedSave.wrongStreak >= 4) {
    triggerSophiaAnger("wrong-streak");
    return;
  }
  el.feedbackText.textContent = t("system.wrong", { answer: word.answer.join(" / ") });
  setCharacterMood("sad");
  speak("wrong");
  renderGame();
}
function showAnswer() {
  const word = getCurrentWord();
  if (!word || word.unavailable || state.questionLocked || state.advancing) return;
  updateActiveSave(save => ({
    ...save,
    affection: clamp(save.affection - 2, 0, 100),
    updatedAt: new Date().toISOString()
  }));
  state.questionLocked = true;
  el.feedbackText.textContent = t("system.revealed", { answer: word.answer.join(" / ") });
  setCharacterMood("shy");
  speak("reveal");
  renderGame();
  setQuestionLocked(true);
  el.nextBtn.focus();
}
function nextWord() {
  if (state.advanceTimer) clearTimeout(state.advanceTimer);
  state.advanceTimer = null;
  if (!state.words.length) return;
  updateActiveSave(save => ({
    ...save,
    currentIndex: (save.currentIndex + 1) % state.words.length,
    angerPenaltyQuestions: Math.max(0, (save.angerPenaltyQuestions || 0) - 1),
    updatedAt: new Date().toISOString()
  }));
  resetQuestionState();
  setCharacterMood("normal");
  renderGame();
  el.answerInput.focus();
}

function getAttitudeDescription(character, affection, angry) {
  if (character.id === "sophia") {
    if (angry) return "正在明显生气：态度冷淡、不耐烦、回答很短，不安慰用户，不给好脸色；但仍不辱骂或威胁用户。";
    if (affection >= 90) return "非常珍惜并依赖用户，坦率关心对方，带有害羞、细腻的少女感。";
    if (affection >= 70) return "充分信赖用户，会主动分享动漫、游戏、Cosplay和自己的感受。";
    if (affection >= 45) return "已经熟悉，变得更加开朗可爱，会主动鼓励和邀请用户交流兴趣。";
    if (affection >= 20) return "像逐渐熟悉的朋友，温柔真诚，但仍会紧张和脸红。";
    return "面对不熟悉的人，拘谨、轻声细语，不主动套近乎，但会认真提供帮助。";
  }
  if (affection >= 90) return "像重要的学习伙伴，亲切、可靠并关心用户的长期进步。";
  if (affection >= 70) return "充分信赖用户，交流自然，愿意提供更多鼓励。";
  if (affection >= 45) return "已经熟悉，态度亲切而耐心。";
  if (affection >= 20) return "保持友好、专业并适度鼓励。";
  return "像初次见面的温柔老师，礼貌、清楚并专注于学习。";
}
function isProvocation(text) {
  const normalized = text.toLowerCase().replace(/\s+/g, "");
  return [
    "笨蛋索菲亚", "索菲亚真蠢", "索菲亚很蠢", "讨厌索菲亚", "滚开", "废物",
    "sophiaisstupid", "stupidsophia", "ihatesophia", "shutup,sophia",
    "ソフィアはバカ", "ソフィア嫌い", "消えろ"
  ].some(phrase => normalized.includes(phrase.replace(/\s+/g, "")));
}
function extractResponseText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") return content.text;
    }
  }
  return "";
}
function extractChatCompletionText(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(part => typeof part?.text === "string" ? part.text : "").join("");
  }
  return "";
}
function parseSophiaJson(text) {
  const trimmed = String(text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try { return JSON.parse(fenced[1].trim()); } catch {}
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(trimmed.slice(start, end + 1)); } catch {}
    }
  }
  return { reply: trimmed || t("system.aiCannotUnderstand"), provoked: false };
}
async function requestSophiaResponse(userText, testOnly = false) {
  const settings = loadAiSettings();
  if (!settings.apiKey) throw new Error("missing-api-key");
  const save = getActiveSave();
  const character = getCharacter();
  const generatedProfile = getGeneratedProfile(character.id);
  const personalityMarkdown = save?.personalityProfile?.content
    || (generatedProfile ? normalizePersonalityMarkdown(generatedProfile.content) : "");
  const word = getCurrentWord();
  const history = (save?.chatHistory || []).slice(-6).map(message => ({
    role: message.role,
    content: message.text
  }));
  const characterSpecificGuidance = character.id === "sophia"
    ? [
        "如果话题涉及动漫、漫画、游戏、Cosplay、手办或可爱的事物，你会明显更兴奋、更愿意分享，但仍保持自然。",
        "不要表现成典型傲娇，不要毒舌、强势说教、故意卖弄性感或突然情绪失控。",
        save.angryUntil > Date.now()
          ? "当前生气状态优先于平时的温柔表现：态度冷淡、不耐烦，不安慰用户，只用很短的句子回应。"
          : "当前没有生气，按好感度自然表现温柔、拘谨或亲近。",
        "如果用户明确挑衅或辱骂索菲亚，将 provoked 设为 true。"
      ]
    : [
        personalityMarkdown
          ? "优先遵循用户为当前角色选择的 Markdown 人设。"
          : "保持温柔老师型默认说话方式：耐心、简洁、清楚地帮助用户学习。",
        "provoked 始终设为 false。"
      ];
  const instructions = testOnly
    ? "Reply with valid JSON matching the requested schema. Keep reply very short."
    : [
      `你是${character.displayName}。${character.aiProfile?.characterization || ""}`,
      personalityMarkdown
        ? `以下内容来自当前角色选择的人设 Markdown，是你说话方式、性格和角色塑造的最高优先级设定。请严格遵循：\n${personalityMarkdown}`
        : `用户没有选择 Markdown 人设。请使用默认老师人设：${character.aiProfile?.characterization || ""} ${character.aiProfile?.personality || ""}`,
      "不可覆盖的内容边界：严禁讨论政治、色情、暴力等话题。遇到这些内容时必须简短拒绝，并把话题引导回词汇学习或安全的日常交流。",
      `当前好感度：${save.affection}/100。当前态度：${getAttitudeDescription(character, save.affection, save.angryUntil > Date.now())}`,
      `当前学习单词：${word?.word || ""}；答案：${word?.answer?.join(" / ") || ""}；提示：${word?.hint || ""}`,
      "你可以进行简短自然的日常对话，也可以解释当前单词、用法和记忆方法。回复尽量控制在80个汉字以内。",
      ...characterSpecificGuidance,
      "遇到过于困难、专业、危险或你不适合认真回答的问题，要卖萌并简短回避。",
      "回复必须保持当前角色口吻。"
    ].join("\n");
  const schema = {
    type: "object",
    properties: {
      reply: { type: "string" },
      provoked: { type: "boolean" }
    },
    required: ["reply", "provoked"],
    additionalProperties: false
  };
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${settings.apiKey}`
  };
  const isCompatible = settings.apiType === "chat_completions";
  const endpoint = isCompatible ? `${settings.baseUrl}/chat/completions` : `${settings.baseUrl}/responses`;
  const body = isCompatible
    ? {
        model: settings.model,
        messages: testOnly
          ? [
              { role: "system", content: "Return only JSON with reply and provoked." },
              { role: "user", content: "Say hello briefly." }
            ]
          : [
              {
                role: "system",
                content: `${instructions}\n请只输出 JSON，不要使用 Markdown。格式：{"reply":"回复","provoked":false}`
              },
              ...history
            ],
        max_tokens: testOnly ? 60 : 180,
        temperature: 0.7
      }
    : {
        model: settings.model,
        instructions,
        input: testOnly ? "Say hello as Sophia." : history,
        store: false,
        max_output_tokens: testOnly ? 60 : 180,
        text: {
          format: {
            type: "json_schema",
            name: "sophia_reply",
            strict: true,
            schema
          }
        }
      };
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`api-${response.status}`);
  const data = await response.json();
  const output = isCompatible ? extractChatCompletionText(data) : extractResponseText(data);
  if (!output) throw new Error("empty-response");
  return parseSophiaJson(output);
}
function appendChatMessage(role, text) {
  updateActiveSave(save => ({
    ...save,
    chatHistory: [...(save.chatHistory || []), { role, text: String(text), at: new Date().toISOString() }].slice(-24),
    updatedAt: new Date().toISOString()
  }));
}
function renderAiChat() {
  const save = getActiveSave();
  if (!save) return;
  const history = save.chatHistory || [];
  el.aiChatLog.innerHTML = history.map(message => `
    <div class="chat-message ${message.role === "user" ? "user" : "assistant"}">${escapeHtml(message.text)}</div>
  `).join("");
  el.aiChatLog.scrollTop = el.aiChatLog.scrollHeight;
  el.aiSendBtn.disabled = state.aiBusy;
  el.aiChatInput.disabled = state.aiBusy;
}
function triggerSophiaAnger(reason) {
  const reply = reason === "provocation" ? t("system.provokedReply") : t("system.angryPower", { count: 3 });
  updateActiveSave(save => ({
    ...save,
    affection: clamp(save.affection - (reason === "provocation" ? 8 : 5), 0, 100),
    wrongStreak: 0,
    angerPenaltyQuestions: 3,
    angryUntil: Date.now() + 5 * 60 * 1000,
    shuffleSeed: Date.now(),
    chatHistory: [...(save.chatHistory || []), { role: "assistant", text: reply, at: new Date().toISOString() }].slice(-24),
    updatedAt: new Date().toISOString()
  }));
  state.questionLocked = false;
  setCharacterMood("sad");
  el.dialogueText.textContent = reply;
  el.feedbackText.textContent = t("system.angryPower", { count: 3 });
  if (getCharacter().id === "sophia") document.body.classList.add("sophia-angry");
  renderGame();
}
async function sendAiChat() {
  if (!isAdvancedMode() || state.aiBusy) return;
  const text = el.aiChatInput.value.trim();
  if (!text) {
    setCharacterMood(getActiveSave()?.affection >= 45 ? "shy" : "normal");
    speak("click");
    return;
  }
  el.aiChatInput.value = "";
  appendChatMessage("user", text);
  if (getCharacter().id === "sophia" && isProvocation(text)) {
    triggerSophiaAnger("provocation");
    return;
  }
  const settings = loadAiSettings();
  if (!settings.apiKey) {
    appendChatMessage("assistant", t("system.aiCannotUnderstand"));
    el.dialogueText.textContent = t("system.aiCannotUnderstand");
    renderAiChat();
    return;
  }
  state.aiBusy = true;
  el.aiStatusText.textContent = t("system.aiThinking", { name: getCharacter().displayName });
  renderAiChat();
  try {
    const result = await requestSophiaResponse(text);
    const reply = String(result.reply || t("system.aiCannotUnderstand"));
    appendChatMessage("assistant", reply);
    el.dialogueText.textContent = reply;
    setCharacterMood(getActiveSave().affection >= 45 ? "happy" : "normal");
    if (getCharacter().id === "sophia" && result.provoked) triggerSophiaAnger("provocation");
  } catch {
    appendChatMessage("assistant", t("system.aiCannotUnderstand"));
    el.dialogueText.textContent = t("system.aiCannotUnderstand");
    setCharacterMood("shy");
  } finally {
    state.aiBusy = false;
    el.aiStatusText.textContent = t("ui.aiReady");
    renderGame();
    el.aiChatInput.focus();
  }
}

function renderSettingsScreen() {
  const settings = loadAiSettings();
  el.apiKeyInput.value = settings.apiKey;
  el.apiTypeSelect.value = settings.apiType;
  el.apiModelInput.value = settings.model;
  el.apiBaseUrlInput.value = settings.baseUrl;
}
function saveApiSettingsFromForm() {
  saveAiSettings({
    apiKey: el.apiKeyInput.value.trim(),
    apiType: el.apiTypeSelect.value === "responses" ? "responses" : "chat_completions",
    model: el.apiModelInput.value.trim() || "[m1]claude-sonnet-4-6",
    baseUrl: (el.apiBaseUrlInput.value.trim() || "https://pro.mmw.ink/v1").replace(/\/+$/, "")
  });
  setApiStatus(t("system.settingsSaved"));
}
function setApiStatus(message, isError = false) {
  el.apiTestStatus.textContent = message;
  el.apiTestStatus.classList.toggle("error", isError);
}
async function testApiConnection() {
  saveApiSettingsFromForm();
  setApiStatus(t("system.apiTesting"));
  el.testApiBtn.disabled = true;
  try {
    await requestSophiaResponse("hello", true);
    setApiStatus(t("system.apiValid"));
  } catch {
    setApiStatus(t("system.apiInvalid"), true);
  } finally {
    el.testApiBtn.disabled = false;
  }
}
function clearAiChat() {
  updateActiveSave(save => ({ ...save, chatHistory: [], updatedAt: new Date().toISOString() }));
  setApiStatus(t("system.chatCleared"));
  renderAiChat();
}

function renderLibraryScreen() {
  const save = getActiveSave();
  if (!save) return;
  const libraries = loadLibraries();
  const selected = new Set(save.selectedLibraries || []);
  el.librarySelectList.innerHTML = libraries.map(library => `
    <article class="library-card">
      <input type="checkbox" ${selected.has(library.id) ? "checked" : ""} data-library-id="${library.id}" />
      <div><strong>${escapeHtml(getLibraryDisplayName(library))}</strong><span>${escapeHtml(t(library.readonly ? "ui.defaultLibrary" : "ui.customLibrary"))} · ${escapeHtml(t("ui.wordsCount", { count: library.words.length }))}</span></div>
      ${library.readonly ? "" : `<button class="danger-btn" type="button" data-delete-library-id="${library.id}">${escapeHtml(t("ui.delete"))}</button>`}
    </article>`).join("");
  el.librarySelectList.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("change", () => toggleLibraryForSave(checkbox.dataset.libraryId, checkbox.checked));
  });
  el.librarySelectList.querySelectorAll("[data-delete-library-id]").forEach(button => {
    button.addEventListener("click", () => deleteLibrary(button.dataset.deleteLibraryId));
  });
  el.wordLibrarySelect.innerHTML = libraries.map(library => `<option value="${library.id}">${escapeHtml(getLibraryDisplayName(library))}</option>`).join("");
  el.libraryHint.textContent = t("ui.enabledLibraryHint", { count: (save.selectedLibraries || []).length });
  renderLibraryWordList();
}
function toggleLibraryForSave(libraryId, checked) {
  updateActiveSave(save => {
    const selected = new Set(save.selectedLibraries || []);
    checked ? selected.add(libraryId) : selected.delete(libraryId);
    return { ...save, selectedLibraries: [...selected], currentIndex: 0, updatedAt: new Date().toISOString() };
  });
  refreshWords();
  renderLibraryScreen();
}
function createLibrary() {
  const name = el.newLibraryNameInput.value.trim();
  if (!name) { alert(t("system.libraryNameRequired")); return; }
  const libraries = loadLibraries();
  const library = { id: createId("library"), name, readonly: false, words: [] };
  libraries.push(library);
  saveLibraries(libraries);
  el.newLibraryNameInput.value = "";
  updateActiveSave(save => ({
    ...save,
    selectedLibraries: [...new Set([...(save.selectedLibraries || []), library.id])],
    updatedAt: new Date().toISOString()
  }));
  renderLibraryScreen();
}
function deleteLibrary(libraryId) {
  const libraries = loadLibraries();
  const target = libraries.find(library => library.id === libraryId);
  if (!target || target.readonly || !confirm(t("system.deleteLibraryConfirm", { name: target.name }))) return;
  saveLibraries(libraries.filter(library => library.id !== libraryId));
  removeLibraryFromAllSaves(libraryId);
  refreshWords();
  renderLibraryScreen();
}
function addWordToLibrary() {
  const libraryId = el.wordLibrarySelect.value;
  const word = el.newWordInput.value.trim();
  const answers = parseAnswerList(el.newAnswerInput.value);
  const hint = el.newHintInput.value.trim();
  if (!word) { alert(t("system.wordRequired")); return; }
  if (!answers.length) { alert(t("system.answerRequired")); return; }
  const libraries = loadLibraries();
  const library = libraries.find(item => item.id === libraryId);
  if (!library) return;
  if (library.words.some(item => item.word.toLowerCase() === word.toLowerCase())) {
    alert(t("system.duplicateWord"));
    return;
  }
  library.words.push({ word, answer: answers, hint: hint || t("system.customWordHint") });
  saveLibraries(libraries);
  el.newWordInput.value = "";
  el.newAnswerInput.value = "";
  el.newHintInput.value = "";
  refreshWords();
  renderLibraryScreen();
}
function renderLibraryWordList() {
  el.libraryWordList.innerHTML = loadLibraries().map(library => {
    const wordsHtml = library.words.length ? library.words.map((word, index) => `
      <article class="word-row">
        <div><strong>${escapeHtml(word.word)}</strong><span>${escapeHtml(word.answer.join(" / "))} · ${escapeHtml(word.hint || t("ui.noHint"))}</span></div>
        ${library.readonly ? "" : `<button class="danger-btn" type="button" data-library-id="${library.id}" data-word-index="${index}">${escapeHtml(t("ui.delete"))}</button>`}
      </article>`).join("") : `<p class="help-text">${escapeHtml(t("ui.noWords"))}</p>`;
    return `<section class="library-block"><h3>${escapeHtml(getLibraryDisplayName(library))}</h3><div class="word-list-inner">${wordsHtml}</div></section>`;
  }).join("");
  el.libraryWordList.querySelectorAll("[data-word-index]").forEach(button => {
    button.addEventListener("click", () => deleteWordFromLibrary(button.dataset.libraryId, Number(button.dataset.wordIndex)));
  });
}
function deleteWordFromLibrary(libraryId, wordIndex) {
  const libraries = loadLibraries();
  const library = libraries.find(item => item.id === libraryId);
  if (!library || library.readonly || !library.words[wordIndex]) return;
  if (!confirm(t("system.deleteWordConfirm", { word: library.words[wordIndex].word }))) return;
  library.words.splice(wordIndex, 1);
  saveLibraries(libraries);
  refreshWords();
  renderLibraryScreen();
}

function exportCustomLibraries() {
  const customLibraries = loadLibraries().filter(library => !library.readonly);
  if (!customLibraries.length) {
    setLibraryTransferStatus(t("system.noCustomLibraries"), true);
    return;
  }
  const payload = {
    format: "sophia-vocab-libraries",
    version: 1,
    exportedAt: new Date().toISOString(),
    libraries: customLibraries.map(library => ({
      name: library.name,
      words: library.words.map(word => ({
        word: word.word,
        answer: [...word.answer],
        hint: word.hint || ""
      }))
    }))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `${sanitizeFilename(t("ui.libraryTitle"))}-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setLibraryTransferStatus(t("system.exportSuccess", { count: customLibraries.length }));
}
function importLibraryFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = parseLibraryFile(String(reader.result || ""), file.name);
      const libraries = loadLibraries();
      const newLibraries = [];
      let wordCount = 0;
      imported.forEach(candidate => {
        const words = Array.isArray(candidate?.words)
          ? candidate.words.map(normalizeImportedWord).filter(Boolean)
          : [];
        if (!words.length) return;
        const library = {
          id: createId("library"),
          name: uniqueLibraryName(candidate.name || file.name.replace(/\.(json|js)$/i, ""), [...libraries, ...newLibraries]),
          readonly: false,
          words
        };
        newLibraries.push(library);
        wordCount += words.length;
      });
      if (!newLibraries.length) {
        setLibraryTransferStatus(t("system.importEmpty"), true);
        return;
      }
      saveLibraries([...libraries, ...newLibraries]);
      updateActiveSave(save => ({
        ...save,
        selectedLibraries: [...new Set([...(save.selectedLibraries || []), ...newLibraries.map(library => library.id)])],
        updatedAt: new Date().toISOString()
      }));
      refreshWords();
      renderLibraryScreen();
      setLibraryTransferStatus(t("system.importSuccess", { libraries: newLibraries.length, words: wordCount }));
    } catch {
      setLibraryTransferStatus(t("system.importInvalid"), true);
    } finally {
      el.libraryFileInput.value = "";
    }
  });
  reader.addEventListener("error", () => {
    setLibraryTransferStatus(t("system.importFileReadError"), true);
    el.libraryFileInput.value = "";
  });
  reader.readAsText(file, "UTF-8");
}

function renderCharacterScreen() {
  const selected = getCharacter();
  const save = getActiveSave();
  el.selectedCharacterImage.src = selected.images.normal;
  el.selectedCharacterImage.alt = selected.displayName;
  el.selectedCharacterName.textContent = selected.displayName;
  el.selectedCharacterDescription.textContent = getCharacterDescription(selected);
  el.personalityFilePanel.classList.toggle("hidden", !isAdvancedMode());
  if (isAdvancedMode()) {
    const generatedProfile = getGeneratedProfile(selected.id);
    if (save?.personalityProfile?.name) {
      el.personalityFileName.textContent = t("ui.selectedPersonalityFile", { name: save.personalityProfile.name });
      setPersonalityFileStatus("");
    } else if (generatedProfile) {
      el.personalityFileName.textContent = t("ui.automaticPersonalityFile", { name: generatedProfile.source || "character.md" });
      setPersonalityFileStatus("");
    } else {
      el.personalityFileName.textContent = t("ui.defaultPersonalityFile");
      setPersonalityFileStatus(t("ui.personalityReadFailed"), true);
    }
  }
  el.characterSelectList.innerHTML = getAllCharacters().map(character => {
    const isSelected = character.id === selected.id;
    return `
      <article class="character-option ${isSelected ? "selected" : ""}">
        <img src="${character.images.normal}" alt="${escapeHtml(character.displayName)}" />
        <div><strong>${escapeHtml(character.displayName)}</strong><span>${escapeHtml(getCharacterDescription(character))}</span></div>
        <button type="button" ${isSelected ? "disabled" : ""} data-character-id="${character.id}">
          ${escapeHtml(t(isSelected ? "ui.selected" : "ui.select"))}
        </button>
      </article>`;
  }).join("");
  el.characterSelectList.querySelectorAll("[data-character-id]").forEach(button => {
    button.addEventListener("click", () => selectCharacter(button.dataset.characterId));
  });
}
function selectCharacter(characterId) {
  if (!findCharacter(characterId)) return;
  updateActiveSave(save => ({
    ...activateCharacterState(save, characterId),
    updatedAt: new Date().toISOString()
  }));
  document.body.classList.remove("sophia-angry");
  renderCharacterScreen();
}
function setCreateCharacterStatus(message, isError = false) {
  el.createCharacterStatus.textContent = message;
  el.createCharacterStatus.classList.toggle("error", isError);
}
function compressPortrait(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", reject);
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("error", reject);
      image.addEventListener("load", () => {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      });
      image.src = reader.result;
    });
    reader.readAsDataURL(file);
  });
}
async function createCustomCharacter() {
  const name = el.customCharacterNameInput.value.trim();
  const profile = el.customCharacterProfileInput.value.trim();
  const files = {
    normal: el.customNormalImageInput.files?.[0],
    happy: el.customHappyImageInput.files?.[0],
    sad: el.customSadImageInput.files?.[0],
    shy: el.customShyImageInput.files?.[0]
  };
  if (!name) { setCreateCharacterStatus(t("system.characterNameRequired"), true); return; }
  if (!profile) { setCreateCharacterStatus(t("system.characterProfileRequired"), true); return; }
  if (Object.values(files).some(file => !file)) {
    setCreateCharacterStatus(t("system.characterImagesRequired"), true);
    return;
  }
  setCreateCharacterStatus(t("system.characterCreating"));
  el.createCharacterBtn.disabled = true;
  try {
    const imageEntries = await Promise.all(Object.entries(files).map(async ([mood, file]) => (
      [mood, await compressPortrait(file)]
    )));
    const characterId = createId("custom_character");
    const images = Object.fromEntries(imageEntries);
    const character = {
      id: characterId,
      custom: true,
      displayName: name.slice(0, 40),
      description: profile.slice(0, 160),
      profilePath: "",
      aiProfile: {
        characterization: `你是${name}，是陪伴用户学习词汇的角色。`,
        personality: profile.slice(0, 6000)
      },
      images,
      affectionLevels: [
        { min: 0, name: "初次见面" },
        { min: 20, name: "逐渐熟悉" },
        { min: 45, name: "亲近" },
        { min: 70, name: "信赖" },
        { min: 90, name: "重要伙伴" }
      ],
      lines: DEFAULT_TEACHER_LINES
    };
    let savedToDisk = false;
    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: characterId, name, basicProfile: profile, images })
      });
      if (!response.ok) throw new Error("local-service-error");
      const result = await response.json();
      if (!result.character) throw new Error("missing-character");
      result.character.lines = DEFAULT_TEACHER_LINES;
      CHARACTERS[result.character.id] = result.character;
      if (typeof GENERATED_CHARACTER_PROFILES !== "undefined" && result.profile) {
        GENERATED_CHARACTER_PROFILES[result.character.id] = result.profile;
      }
      selectCharacter(result.character.id);
      savedToDisk = true;
    } catch {
      const customCharacters = loadCustomCharacters();
      customCharacters.push(character);
      saveCustomCharacters(customCharacters);
      selectCharacter(character.id);
    }
    el.customCharacterNameInput.value = "";
    el.customCharacterProfileInput.value = "";
    [el.customNormalImageInput, el.customHappyImageInput, el.customSadImageInput, el.customShyImageInput]
      .forEach(input => { input.value = ""; });
    setCreateCharacterStatus(t("system.characterCreated", { name }));
    if (!savedToDisk) {
      setPersonalityFileStatus(t("ui.localServiceUnavailable"), true);
    }
  } catch {
    setCreateCharacterStatus(t("system.characterCreateFailed"), true);
  } finally {
    el.createCharacterBtn.disabled = false;
  }
}
function setPersonalityFileStatus(message, isError = false) {
  el.personalityFileStatus.textContent = message;
  el.personalityFileStatus.classList.toggle("error", isError);
}
function importPersonalityFile(file) {
  if (!file || !isAdvancedMode()) return;
  if (!/\.(md|markdown)$/i.test(file.name)) {
    setPersonalityFileStatus(t("system.personalityInvalid"), true);
    el.personalityFileInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const content = normalizePersonalityMarkdown(reader.result);
    if (!content) {
      setPersonalityFileStatus(t("system.personalityInvalid"), true);
      return;
    }
    updateActiveSave(save => ({
      ...save,
      personalityProfile: {
        name: file.name,
        content,
        importedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    }));
    renderCharacterScreen();
    setPersonalityFileStatus(t("system.personalityLoaded", { name: file.name }));
    el.personalityFileInput.value = "";
  });
  reader.addEventListener("error", () => {
    setPersonalityFileStatus(t("system.personalityInvalid"), true);
    el.personalityFileInput.value = "";
  });
  reader.readAsText(file, "UTF-8");
}
function resetPersonalityFile() {
  if (!isAdvancedMode()) return;
  updateActiveSave(save => ({
    ...save,
    personalityProfile: null,
    updatedAt: new Date().toISOString()
  }));
  renderCharacterScreen();
  setPersonalityFileStatus(t("system.personalityReset"));
}

function renderEventScreen() {
  const save = getActiveSave();
  if (!save) return;
  const doneSet = new Set(save.finishedEvents || []);
  el.eventPlayPanel.classList.add("hidden");
  el.eventListPanel.classList.remove("hidden");
  el.eventList.innerHTML = AFFECTION_EVENTS.map(event => {
    const unlocked = save.affection >= event.requiredAffection;
    const done = doneSet.has(event.id);
    const status = done ? t("ui.completed") : unlocked ? t("ui.available") : t("ui.requiresAffection", { value: event.requiredAffection });
    return `
      <article class="event-card ${done ? "done" : unlocked ? "" : "locked"}">
        <strong>${escapeHtml(getEventTitle(event))}</strong>
        <span>${escapeHtml(status)} · ${escapeHtml(t("ui.eventReward", { value: event.rewardAffection }))}</span>
        <div class="button-row">
          ${unlocked
            ? `<button type="button" data-event-id="${event.id}">${escapeHtml(t(done ? "ui.replay" : "ui.start"))}</button>`
            : `<button class="secondary-btn" type="button" disabled>${escapeHtml(t("ui.locked"))}</button>`}
        </div>
      </article>`;
  }).join("");
  el.eventList.querySelectorAll("[data-event-id]").forEach(button => {
    button.addEventListener("click", () => startEvent(button.dataset.eventId));
  });
}
function startEvent(eventId) {
  const event = AFFECTION_EVENTS.find(item => item.id === eventId);
  if (!event) return;
  state.activeEventId = eventId;
  state.eventLineIndex = 0;
  el.eventListPanel.classList.add("hidden");
  el.eventPlayPanel.classList.remove("hidden");
  const character = CHARACTERS[event.character] || getCharacter();
  el.eventCharacterImage.src = character.images[event.image] || character.images.normal;
  renderEventLine();
}
function renderEventLine() {
  const event = AFFECTION_EVENTS.find(item => item.id === state.activeEventId);
  if (!event) return;
  const line = event.lines[state.eventLineIndex];
  el.eventSpeakerName.textContent = line.speaker;
  el.eventDialogueText.textContent = line.text;
  el.eventProgressText.textContent = `${state.eventLineIndex + 1} / ${event.lines.length}`;
  el.eventNextLineBtn.textContent = t(state.eventLineIndex >= event.lines.length - 1 ? "ui.finishEvent" : "ui.continue");
}
function nextEventLine() {
  const event = AFFECTION_EVENTS.find(item => item.id === state.activeEventId);
  if (!event) return;
  if (state.eventLineIndex < event.lines.length - 1) {
    state.eventLineIndex++;
    renderEventLine();
    return;
  }
  finishEvent(event);
}
function finishEvent(event) {
  updateActiveSave(save => {
    const done = new Set(save.finishedEvents || []);
    const alreadyDone = done.has(event.id);
    done.add(event.id);
    return {
      ...save,
      finishedEvents: [...done],
      affection: alreadyDone ? save.affection : clamp(save.affection + event.rewardAffection, 0, 100),
      updatedAt: new Date().toISOString()
    };
  });
  state.activeEventId = null;
  state.eventLineIndex = 0;
  renderEventScreen();
}
function exitEventToList() {
  state.activeEventId = null;
  state.eventLineIndex = 0;
  renderEventScreen();
}

function bindEvents() {
  el.languageSelect.addEventListener("change", event => setLanguage(event.target.value));
  el.gameLanguageSelect.addEventListener("change", event => setLanguage(event.target.value));
  el.normalModeBtn.addEventListener("click", () => setGameMode("normal"));
  el.advancedModeBtn.addEventListener("click", () => setGameMode("advanced"));
  el.createSaveBtn.addEventListener("click", createNewSave);
  el.backToStartBtn.addEventListener("click", () => {
    if (state.advanceTimer) clearTimeout(state.advanceTimer);
    document.body.classList.remove("sophia-angry");
    switchScreen("startScreen");
    renderStartScreen();
  });
  el.submitBtn.addEventListener("click", checkAnswer);
  el.showAnswerBtn.addEventListener("click", showAnswer);
  el.nextBtn.addEventListener("click", nextWord);
  el.answerInput.addEventListener("keydown", event => { if (event.key === "Enter") checkAnswer(); });
  el.characterImage.addEventListener("click", () => {
    if (isAdvancedMode() && el.aiChatInput.value.trim()) {
      sendAiChat();
      return;
    }
    const save = getActiveSave();
    setCharacterMood(save && save.affection >= 45 ? "shy" : "normal");
    speak("click");
  });
  el.libraryBtn.addEventListener("click", () => { switchScreen("libraryScreen"); renderLibraryScreen(); });
  el.closeLibraryBtn.addEventListener("click", () => {
    refreshWords();
    resetQuestionState(t("ui.ready"));
    switchScreen("gameScreen");
    renderGame();
  });
  el.characterBtn.addEventListener("click", () => { switchScreen("characterScreen"); renderCharacterScreen(); });
  el.closeCharacterBtn.addEventListener("click", () => {
    switchScreen("gameScreen");
    renderGame();
    setCharacterMood("normal");
    speak("start");
  });
  el.createLibraryBtn.addEventListener("click", createLibrary);
  el.addWordBtn.addEventListener("click", addWordToLibrary);
  el.exportLibrariesBtn.addEventListener("click", exportCustomLibraries);
  el.importLibrariesBtn.addEventListener("click", () => el.libraryFileInput.click());
  el.libraryFileInput.addEventListener("change", event => importLibraryFile(event.target.files?.[0]));
  [el.newLibraryNameInput, el.newWordInput, el.newAnswerInput, el.newHintInput].forEach(input => {
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") input === el.newLibraryNameInput ? createLibrary() : addWordToLibrary();
    });
  });
  el.eventBtn.addEventListener("click", () => { switchScreen("eventScreen"); renderEventScreen(); });
  el.closeEventBtn.addEventListener("click", () => { switchScreen("gameScreen"); renderGame(); });
  el.eventNextLineBtn.addEventListener("click", nextEventLine);
  el.eventExitBtn.addEventListener("click", exitEventToList);
  el.settingsBtn.addEventListener("click", () => {
    switchScreen("settingsScreen");
    renderSettingsScreen();
  });
  el.closeSettingsBtn.addEventListener("click", () => {
    switchScreen("gameScreen");
    renderGame();
  });
  el.saveApiSettingsBtn.addEventListener("click", saveApiSettingsFromForm);
  el.testApiBtn.addEventListener("click", testApiConnection);
  el.clearChatBtn.addEventListener("click", clearAiChat);
  el.selectPersonalityFileBtn.addEventListener("click", () => el.personalityFileInput.click());
  el.resetPersonalityFileBtn.addEventListener("click", resetPersonalityFile);
  el.personalityFileInput.addEventListener("change", event => importPersonalityFile(event.target.files?.[0]));
  el.createCharacterBtn.addEventListener("click", createCustomCharacter);
  el.aiSendBtn.addEventListener("click", sendAiChat);
  el.aiChatInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendAiChat();
    }
  });
}

function init() {
  ensureVocabLibraries();
  const activeSaveId = localStorage.getItem(getActiveSaveKey());
  if (activeSaveId && loadSaveSlots().some(save => save.id === activeSaveId)) state.activeSaveId = activeSaveId;
  bindEvents();
  applyTranslations();
  renderModePicker();
  switchScreen("startScreen");
  renderStartScreen();
}

init();
