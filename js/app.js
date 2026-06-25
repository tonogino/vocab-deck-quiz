const SAVE_SLOTS_KEY = "sophia_v2_save_slots";
const ACTIVE_SAVE_KEY = "sophia_v2_active_save_id";
const VOCAB_LIBRARIES_KEY = "sophia_v2_vocab_libraries";

const state = {
  activeSaveId: null,
  activeEventId: null,
  eventLineIndex: 0,
  words: []
};

const $ = id => document.getElementById(id);

const el = {
  startScreen: $("startScreen"), gameScreen: $("gameScreen"), libraryScreen: $("libraryScreen"), eventScreen: $("eventScreen"),
  saveSlotList: $("saveSlotList"), createSaveBtn: $("createSaveBtn"), currentSaveName: $("currentSaveName"), backToStartBtn: $("backToStartBtn"), libraryBtn: $("libraryBtn"), eventBtn: $("eventBtn"),
  characterName: $("characterName"), affectionValue: $("affectionValue"), affectionLevel: $("affectionLevel"), wordCounter: $("wordCounter"), correctRate: $("correctRate"), wordText: $("wordText"), wordHint: $("wordHint"), answerInput: $("answerInput"), submitBtn: $("submitBtn"), showAnswerBtn: $("showAnswerBtn"), nextBtn: $("nextBtn"), feedbackText: $("feedbackText"), characterImage: $("characterImage"), speakerName: $("speakerName"), dialogueText: $("dialogueText"),
  closeLibraryBtn: $("closeLibraryBtn"), librarySelectList: $("librarySelectList"), libraryHint: $("libraryHint"), newLibraryNameInput: $("newLibraryNameInput"), createLibraryBtn: $("createLibraryBtn"), wordLibrarySelect: $("wordLibrarySelect"), newWordInput: $("newWordInput"), newAnswerInput: $("newAnswerInput"), newHintInput: $("newHintInput"), addWordBtn: $("addWordBtn"), libraryWordList: $("libraryWordList"),
  closeEventBtn: $("closeEventBtn"), eventList: $("eventList"), eventListPanel: $("eventListPanel"), eventPlayPanel: $("eventPlayPanel"), eventCharacterImage: $("eventCharacterImage"), eventSpeakerName: $("eventSpeakerName"), eventProgressText: $("eventProgressText"), eventDialogueText: $("eventDialogueText"), eventNextLineBtn: $("eventNextLineBtn"), eventExitBtn: $("eventExitBtn")
};

function createId(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`; }
function safeParse(raw, fallback) { try { return JSON.parse(raw) ?? fallback; } catch { return fallback; } }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }
function escapeHtml(text) { return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function normalizeAnswer(text) { return text.trim().toLowerCase().replace(/[，。！？、,.!?；;]/g, "").replace(/\s+/g, ""); }
function parseAnswerList(text) { return text.split(/[;；,，\/、]/).map(item => item.trim()).filter(Boolean); }

function loadSaveSlots() { const saves = safeParse(localStorage.getItem(SAVE_SLOTS_KEY), []); return Array.isArray(saves) ? saves : []; }
function saveSaveSlots(saves) { localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saves)); }
function getActiveSave() { return loadSaveSlots().find(save => save.id === state.activeSaveId) || null; }
function updateActiveSave(updater) {
  const saves = loadSaveSlots();
  const index = saves.findIndex(save => save.id === state.activeSaveId);
  if (index < 0) return null;
  saves[index] = updater({ ...saves[index] });
  saveSaveSlots(saves);
  return saves[index];
}

function ensureVocabLibraries() {
  if (localStorage.getItem(VOCAB_LIBRARIES_KEY)) return;
  localStorage.setItem(VOCAB_LIBRARIES_KEY, JSON.stringify(DEFAULT_VOCAB_LIBRARIES.map(library => ({ ...library }))));
}
function loadLibraries() { ensureVocabLibraries(); const libraries = safeParse(localStorage.getItem(VOCAB_LIBRARIES_KEY), []); return Array.isArray(libraries) ? libraries : []; }
function saveLibraries(libraries) { localStorage.setItem(VOCAB_LIBRARIES_KEY, JSON.stringify(libraries)); }

function createNewSave() {
  const saves = loadSaveSlots();
  const save = {
    id: createId("save"), name: `存档 ${saves.length + 1}`, characterId: "sophia",
    affection: 0, currentIndex: 0, totalAnswered: 0, correctAnswered: 0,
    finishedEvents: [], selectedLibraries: ["default_basic"],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  saves.push(save); saveSaveSlots(saves);
  state.activeSaveId = save.id; localStorage.setItem(ACTIVE_SAVE_KEY, save.id);
  enterGame();
}
function selectSave(saveId) { state.activeSaveId = saveId; localStorage.setItem(ACTIVE_SAVE_KEY, saveId); enterGame(); }
function deleteSave(saveId) {
  const target = loadSaveSlots().find(save => save.id === saveId); if (!target) return;
  if (!confirm(`确定删除「${target.name}」吗？这个操作不会删除词库。`)) return;
  saveSaveSlots(loadSaveSlots().filter(save => save.id !== saveId));
  if (state.activeSaveId === saveId) { state.activeSaveId = null; localStorage.removeItem(ACTIVE_SAVE_KEY); }
  renderStartScreen();
}
function renameSave(saveId) {
  const saves = loadSaveSlots(); const target = saves.find(save => save.id === saveId); if (!target) return;
  const name = prompt("请输入新的存档名：", target.name); if (!name || !name.trim()) return;
  target.name = name.trim(); target.updatedAt = new Date().toISOString(); saveSaveSlots(saves); renderStartScreen();
}

function getCharacter() { const save = getActiveSave(); return CHARACTERS[save?.characterId || "sophia"]; }
function getAffectionLevel(affection) {
  let current = getCharacter().affectionLevels[0];
  for (const level of getCharacter().affectionLevels) if (affection >= level.min) current = level;
  return current.name;
}
function getCorrectRate(save) { return !save || save.totalAnswered === 0 ? 0 : Math.round((save.correctAnswered / save.totalAnswered) * 100); }
function getSelectedWords(save) {
  const selected = new Set(save.selectedLibraries || []);
  const words = [];
  loadLibraries().forEach(library => {
    if (!selected.has(library.id)) return;
    library.words.forEach(word => words.push({ ...word, libraryId: library.id, libraryName: library.name }));
  });
  return words.length ? words : [{ word: "empty", answer: ["空"], hint: "当前存档没有启用任何词库，或者词库里没有单词。", libraryId: "system", libraryName: "系统" }];
}
function refreshWords() {
  const save = getActiveSave(); if (!save) { state.words = []; return; }
  state.words = getSelectedWords(save);
  if (save.currentIndex >= state.words.length) updateActiveSave(current => ({ ...current, currentIndex: 0, updatedAt: new Date().toISOString() }));
}
function getCurrentWord() { const save = getActiveSave(); return state.words[save?.currentIndex || 0] || state.words[0]; }

function switchScreen(screenId) {
  [el.startScreen, el.gameScreen, el.libraryScreen, el.eventScreen].forEach(screen => screen.classList.remove("active"));
  $(screenId).classList.add("active");
}
function setCharacterMood(mood) { const c = getCharacter(); el.characterImage.src = c.images[mood] || c.images.normal; }
function speak(type) {
  const save = getActiveSave(); const c = getCharacter();
  let pool = c.lines[type] || c.lines.start;
  if (save && save.affection >= 70 && Math.random() < 0.45) pool = c.lines.highAffection;
  el.dialogueText.textContent = pickRandom(pool);
}

function renderStartScreen() {
  const saves = loadSaveSlots();
  if (!saves.length) {
    el.saveSlotList.innerHTML = `<div class="save-slot"><div><strong>还没有存档</strong><span>点击“新建存档”开始。</span></div></div>`;
    return;
  }
  el.saveSlotList.innerHTML = saves.map(save => `
    <article class="save-slot">
      <div><strong>${escapeHtml(save.name)}</strong><span>好感度 ${save.affection} · 正确率 ${getCorrectRate(save)}% · 词库 ${save.selectedLibraries.length} 个</span></div>
      <div class="save-actions">
        <button type="button" data-action="load" data-save-id="${save.id}">进入</button>
        <button class="secondary-btn" type="button" data-action="rename" data-save-id="${save.id}">改名</button>
        <button class="danger-btn" type="button" data-action="delete" data-save-id="${save.id}">删除</button>
      </div>
    </article>`).join("");
  el.saveSlotList.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.action === "load") selectSave(button.dataset.saveId);
    if (button.dataset.action === "rename") renameSave(button.dataset.saveId);
    if (button.dataset.action === "delete") deleteSave(button.dataset.saveId);
  }));
}

function renderGame() {
  const save = getActiveSave(); if (!save) return;
  refreshWords(); const c = getCharacter(); const word = getCurrentWord(); const idx = save.currentIndex >= state.words.length ? 0 : save.currentIndex;
  el.currentSaveName.textContent = `当前存档：${save.name}`;
  el.characterName.textContent = c.displayName; el.speakerName.textContent = c.displayName;
  el.affectionValue.textContent = save.affection; el.affectionLevel.textContent = getAffectionLevel(save.affection);
  el.wordCounter.textContent = `Word ${idx + 1} / ${state.words.length}`; el.correctRate.textContent = `正确率 ${getCorrectRate(save)}%`;
  el.wordText.textContent = word.word; el.wordHint.textContent = `${word.hint || "没有提示。"} · 来自：${word.libraryName}`;
}
function enterGame() { if (!getActiveSave()) { switchScreen("startScreen"); renderStartScreen(); return; } refreshWords(); switchScreen("gameScreen"); renderGame(); setCharacterMood("normal"); speak("start"); el.answerInput.focus(); }

function checkAnswer() {
  const word = getCurrentWord(); if (!word) return;
  const answer = normalizeAnswer(el.answerInput.value); if (!answer) { el.feedbackText.textContent = "先输入答案再确认。"; return; }
  const correct = word.answer.map(normalizeAnswer).includes(answer);
  updateActiveSave(save => ({ ...save, totalAnswered: save.totalAnswered + 1, correctAnswered: save.correctAnswered + (correct ? 1 : 0), affection: clamp(save.affection + (correct ? 3 : -2), 0, 100), updatedAt: new Date().toISOString() }));
  if (correct) { el.feedbackText.textContent = "正确！好感度 +3"; setCharacterMood("happy"); speak("correct"); }
  else { el.feedbackText.textContent = `错误。正确答案：${word.answer.join(" / ")}。好感度 -2`; setCharacterMood("sad"); speak("wrong"); }
  renderGame();
}
function showAnswer() { const word = getCurrentWord(); if (!word) return; el.feedbackText.textContent = `答案：${word.answer.join(" / ")}`; setCharacterMood("shy"); speak("reveal"); }
function nextWord() {
  updateActiveSave(save => ({ ...save, currentIndex: (save.currentIndex + 1) % state.words.length, updatedAt: new Date().toISOString() }));
  el.answerInput.value = ""; el.feedbackText.textContent = "新的单词来了。"; setCharacterMood("normal"); renderGame(); el.answerInput.focus();
}

function renderLibraryScreen() {
  const save = getActiveSave(); if (!save) return;
  const libraries = loadLibraries(); const selected = new Set(save.selectedLibraries || []);
  el.librarySelectList.innerHTML = libraries.map(library => `
    <article class="library-card">
      <input type="checkbox" ${selected.has(library.id) ? "checked" : ""} data-library-id="${library.id}" />
      <div><strong>${escapeHtml(library.name)}</strong><span>${library.readonly ? "默认词库" : "自定义词库"} · ${library.words.length} 个单词</span></div>
      ${library.readonly ? "" : `<button class="danger-btn" type="button" data-delete-library-id="${library.id}">删除</button>`}
    </article>`).join("");
  el.librarySelectList.querySelectorAll("input[type='checkbox']").forEach(cb => cb.addEventListener("change", () => toggleLibraryForSave(cb.dataset.libraryId, cb.checked)));
  el.librarySelectList.querySelectorAll("[data-delete-library-id]").forEach(btn => btn.addEventListener("click", () => deleteLibrary(btn.dataset.deleteLibraryId)));
  el.wordLibrarySelect.innerHTML = libraries.map(library => `<option value="${library.id}">${escapeHtml(library.name)}</option>`).join("");
  el.libraryHint.textContent = `当前启用 ${save.selectedLibraries.length} 个词库。启用多个词库后，学习时会把这些词库合并。`;
  renderLibraryWordList();
}
function toggleLibraryForSave(libraryId, checked) {
  updateActiveSave(save => { const selected = new Set(save.selectedLibraries || []); checked ? selected.add(libraryId) : selected.delete(libraryId); return { ...save, selectedLibraries: [...selected], currentIndex: 0, updatedAt: new Date().toISOString() }; });
  refreshWords(); renderLibraryScreen();
}
function createLibrary() {
  const name = el.newLibraryNameInput.value.trim(); if (!name) { alert("词库名字不能为空。"); return; }
  const libraries = loadLibraries(); const library = { id: createId("library"), name, readonly: false, words: [] };
  libraries.push(library); saveLibraries(libraries); el.newLibraryNameInput.value = "";
  updateActiveSave(save => ({ ...save, selectedLibraries: [...new Set([...(save.selectedLibraries || []), library.id])], updatedAt: new Date().toISOString() }));
  renderLibraryScreen();
}
function deleteLibrary(libraryId) {
  const libraries = loadLibraries(); const target = libraries.find(l => l.id === libraryId); if (!target || target.readonly) return;
  if (!confirm(`确定删除词库「${target.name}」吗？这个词库里的单词也会删除。`)) return;
  saveLibraries(libraries.filter(l => l.id !== libraryId));
  saveSaveSlots(loadSaveSlots().map(save => ({ ...save, selectedLibraries: (save.selectedLibraries || []).filter(id => id !== libraryId) })));
  refreshWords(); renderLibraryScreen();
}
function addWordToLibrary() {
  const libraryId = el.wordLibrarySelect.value; const word = el.newWordInput.value.trim(); const answers = parseAnswerList(el.newAnswerInput.value); const hint = el.newHintInput.value.trim();
  if (!word) { alert("单词不能为空。"); return; } if (!answers.length) { alert("中文意思不能为空。"); return; }
  const libraries = loadLibraries(); const library = libraries.find(l => l.id === libraryId); if (!library) return;
  if (library.words.some(item => item.word.toLowerCase() === word.toLowerCase())) { alert("这个单词已经在该词库里了。"); return; }
  library.words.push({ word, answer: answers, hint: hint || "这是你自己添加的单词。" }); saveLibraries(libraries);
  el.newWordInput.value = ""; el.newAnswerInput.value = ""; el.newHintInput.value = "";
  refreshWords(); renderLibraryScreen();
}
function renderLibraryWordList() {
  el.libraryWordList.innerHTML = loadLibraries().map(library => {
    const wordsHtml = library.words.length ? library.words.map((word, index) => `
      <article class="word-row"><div><strong>${escapeHtml(word.word)}</strong><span>${escapeHtml(word.answer.join(" / "))} · ${escapeHtml(word.hint || "没有提示")}</span></div>${library.readonly ? "" : `<button class="danger-btn" type="button" data-library-id="${library.id}" data-word-index="${index}">删除</button>`}</article>`).join("") : `<p class="help-text">这个词库还没有单词。</p>`;
    return `<section class="library-block"><h3>${escapeHtml(library.name)}</h3><div class="word-list-inner">${wordsHtml}</div></section>`;
  }).join("");
  el.libraryWordList.querySelectorAll("[data-word-index]").forEach(btn => btn.addEventListener("click", () => deleteWordFromLibrary(btn.dataset.libraryId, Number(btn.dataset.wordIndex))));
}
function deleteWordFromLibrary(libraryId, wordIndex) {
  const libraries = loadLibraries(); const library = libraries.find(l => l.id === libraryId); if (!library || library.readonly || !library.words[wordIndex]) return;
  if (!confirm(`确定删除「${library.words[wordIndex].word}」吗？`)) return;
  library.words.splice(wordIndex, 1); saveLibraries(libraries); refreshWords(); renderLibraryScreen();
}

function renderEventScreen() {
  const save = getActiveSave(); if (!save) return;
  const doneSet = new Set(save.finishedEvents || []);
  el.eventPlayPanel.classList.add("hidden"); el.eventListPanel.classList.remove("hidden");
  el.eventList.innerHTML = AFFECTION_EVENTS.map(event => {
    const unlocked = save.affection >= event.requiredAffection; const done = doneSet.has(event.id);
    const status = done ? "已完成" : unlocked ? "可观看" : `需要好感度 ${event.requiredAffection}`;
    return `<article class="event-card ${done ? "done" : unlocked ? "" : "locked"}"><strong>${escapeHtml(event.title)}</strong><span>${status} · 奖励好感度 +${event.rewardAffection}</span><div class="button-row">${unlocked ? `<button type="button" data-event-id="${event.id}">${done ? "重看" : "开始"}</button>` : `<button class="secondary-btn" type="button" disabled>未解锁</button>`}</div></article>`;
  }).join("");
  el.eventList.querySelectorAll("[data-event-id]").forEach(btn => btn.addEventListener("click", () => startEvent(btn.dataset.eventId)));
}
function startEvent(eventId) {
  const event = AFFECTION_EVENTS.find(e => e.id === eventId); if (!event) return;
  state.activeEventId = eventId; state.eventLineIndex = 0;
  el.eventListPanel.classList.add("hidden"); el.eventPlayPanel.classList.remove("hidden");
  const c = CHARACTERS[event.character] || getCharacter(); el.eventCharacterImage.src = c.images[event.image] || c.images.normal;
  renderEventLine();
}
function renderEventLine() {
  const event = AFFECTION_EVENTS.find(e => e.id === state.activeEventId); if (!event) return;
  const line = event.lines[state.eventLineIndex];
  el.eventSpeakerName.textContent = line.speaker; el.eventDialogueText.textContent = line.text;
  el.eventProgressText.textContent = `${state.eventLineIndex + 1} / ${event.lines.length}`;
  el.eventNextLineBtn.textContent = state.eventLineIndex >= event.lines.length - 1 ? "完成事件" : "继续";
}
function nextEventLine() {
  const event = AFFECTION_EVENTS.find(e => e.id === state.activeEventId); if (!event) return;
  if (state.eventLineIndex < event.lines.length - 1) { state.eventLineIndex++; renderEventLine(); return; }
  finishEvent(event);
}
function finishEvent(event) {
  updateActiveSave(save => {
    const done = new Set(save.finishedEvents || []); const alreadyDone = done.has(event.id); done.add(event.id);
    return { ...save, finishedEvents: [...done], affection: alreadyDone ? save.affection : clamp(save.affection + event.rewardAffection, 0, 100), updatedAt: new Date().toISOString() };
  });
  state.activeEventId = null; state.eventLineIndex = 0; renderEventScreen();
}
function exitEventToList() { state.activeEventId = null; state.eventLineIndex = 0; renderEventScreen(); }

function bindEvents() {
  el.createSaveBtn.addEventListener("click", createNewSave);
  el.backToStartBtn.addEventListener("click", () => { switchScreen("startScreen"); renderStartScreen(); });
  el.submitBtn.addEventListener("click", checkAnswer); el.showAnswerBtn.addEventListener("click", showAnswer); el.nextBtn.addEventListener("click", nextWord);
  el.answerInput.addEventListener("keydown", e => { if (e.key === "Enter") checkAnswer(); });
  el.characterImage.addEventListener("click", () => { const save = getActiveSave(); setCharacterMood(save && save.affection >= 45 ? "shy" : "normal"); speak("click"); });
  el.libraryBtn.addEventListener("click", () => { switchScreen("libraryScreen"); renderLibraryScreen(); });
  el.closeLibraryBtn.addEventListener("click", () => { refreshWords(); switchScreen("gameScreen"); renderGame(); });
  el.createLibraryBtn.addEventListener("click", createLibrary); el.addWordBtn.addEventListener("click", addWordToLibrary);
  [el.newLibraryNameInput, el.newWordInput, el.newAnswerInput, el.newHintInput].forEach(input => input.addEventListener("keydown", e => { if (e.key === "Enter") input === el.newLibraryNameInput ? createLibrary() : addWordToLibrary(); }));
  el.eventBtn.addEventListener("click", () => { switchScreen("eventScreen"); renderEventScreen(); });
  el.closeEventBtn.addEventListener("click", () => { switchScreen("gameScreen"); renderGame(); });
  el.eventNextLineBtn.addEventListener("click", nextEventLine); el.eventExitBtn.addEventListener("click", exitEventToList);
}

function init() {
  ensureVocabLibraries();
  const activeSaveId = localStorage.getItem(ACTIVE_SAVE_KEY);
  if (activeSaveId && loadSaveSlots().some(save => save.id === activeSaveId)) state.activeSaveId = activeSaveId;
  bindEvents(); switchScreen("startScreen"); renderStartScreen();
}
init();
