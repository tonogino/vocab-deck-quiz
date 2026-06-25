// script.js

let decks = [];
let currentDeckId = null;
let currentQuizWord = null;
let waitingForNext = false;

const STORAGE_KEY = "vocabDeckQuizData";

// Pages
const deckPage = document.getElementById("deck-page");
const wordPage = document.getElementById("word-page");

// Deck elements
const newDeckNameInput = document.getElementById("new-deck-name");
const createDeckBtn = document.getElementById("create-deck-btn");
const deckList = document.getElementById("deck-list");

// Word page elements
const backBtn = document.getElementById("back-btn");
const currentDeckTitle = document.getElementById("current-deck-title");
const wordCount = document.getElementById("word-count");

const wordInput = document.getElementById("word-input");
const meaningInput = document.getElementById("meaning-input");
const addWordBtn = document.getElementById("add-word-btn");
const wordList = document.getElementById("word-list");

// Quiz elements
const quizQuestion = document.getElementById("quiz-question");
const answerInput = document.getElementById("answer-input");
const startQuizBtn = document.getElementById("start-quiz-btn");
const submitAnswerBtn = document.getElementById("submit-answer-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const quizResult = document.getElementById("quiz-result");

const quizPage = document.getElementById("quiz-page");

const exitQuizBtn = document.getElementById("exit-quiz-btn");
const quizDeckTitle = document.getElementById("quiz-deck-title");
const quizProgress = document.getElementById("quiz-progress");
const quizQuestionMain = document.getElementById("quiz-question-main");
const quizAnswerMain = document.getElementById("quiz-answer-main");
const quizActionBtn =
    document.getElementById("quiz-action-btn");
const quizFeedbackMain = document.getElementById("quiz-feedback-main");
const quizStats = document.getElementById("quiz-stats");
// ---------- Data ----------

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

function loadData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    decks = JSON.parse(savedData);
  } else {
    decks = [];
  }
}

function createId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
}

function getCurrentDeck() {
  return decks.find(deck => deck.id === currentDeckId);
}

// ---------- Deck Page ----------

function renderDecks() {
  deckList.innerHTML = "";

  if (decks.length === 0) {
    deckList.innerHTML = `<p class="small-text">No decks yet. Create your first deck.</p>`;
    return;
  }

  decks.forEach(deck => {
    const deckItem = document.createElement("div");
    deckItem.className = "deck-item";

    const deckInfo = document.createElement("div");
    deckInfo.className = "deck-info";
    deckInfo.innerHTML = `
      <strong>${deck.name}</strong>
      <span class="small-text">${deck.words.length} words</span>
    `;

    deckInfo.addEventListener("click", () => {
      openDeck(deck.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      const confirmDelete = confirm(`Delete deck "${deck.name}"?`);
      if (!confirmDelete) return;

      decks = decks.filter(item => item.id !== deck.id);
      saveData();
      renderDecks();
    });

    deckItem.appendChild(deckInfo);
    deckItem.appendChild(deleteBtn);
    deckList.appendChild(deckItem);
  });
}

function createDeck() {
  const deckName = newDeckNameInput.value.trim();

  if (deckName === "") {
    alert("Please enter a deck name.");
    return;
  }

  const newDeck = {
    id: createId("deck"),
    name: deckName,
    words: []
  };

  decks.push(newDeck);
  saveData();

  newDeckNameInput.value = "";
  renderDecks();
}

function openDeck(deckId) {
  currentDeckId = deckId;
  currentQuizWord = null;

  deckPage.classList.add("hidden");
  wordPage.classList.remove("hidden");

  quizQuestion.textContent = "Click Start Quiz to begin.";
  quizResult.textContent = "";
  answerInput.value = "";

  renderCurrentDeck();
}

function goBackToDecks() {
  currentDeckId = null;
  currentQuizWord = null;

  wordPage.classList.add("hidden");
  deckPage.classList.remove("hidden");

  renderDecks();
}

// ---------- Word Page ----------

function renderCurrentDeck() {
  const deck = getCurrentDeck();

  if (!deck) {
    goBackToDecks();
    return;
  }

  currentDeckTitle.textContent = deck.name;
  wordCount.textContent = `${deck.words.length} words`;

  renderWords();
}

function renderWords() {
  const deck = getCurrentDeck();
  wordList.innerHTML = "";

  if (!deck || deck.words.length === 0) {
    wordList.innerHTML = `<p class="small-text">No words yet. Add your first word.</p>`;
    return;
  }

  deck.words.forEach(wordItem => {
    const item = document.createElement("div");
    item.className = "word-item";

    const text = document.createElement("div");
    text.innerHTML = `
      <strong>${wordItem.word}</strong>
      <span class="small-text"> - ${wordItem.meaning}</span>
    `;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      const confirmDelete = confirm(`Delete word "${wordItem.word}"?`);
      if (!confirmDelete) return;

      deck.words = deck.words.filter(item => item.id !== wordItem.id);
      saveData();
      renderCurrentDeck();
    });

    item.appendChild(text);
    item.appendChild(deleteBtn);
    wordList.appendChild(item);
  });
}

function getReviewDelay(level) {
  const delays = [
    0,
    1 * 60 * 1000,
    10 * 60 * 1000,
    60 * 60 * 1000,
    24 * 60 * 60 * 1000,
    3 * 24 * 60 * 60 * 1000,
    7 * 24 * 60 * 60 * 1000
  ];

  return delays[Math.min(level, delays.length - 1)];
}

function getDueWords() {
  const deck = getCurrentDeck();
  if (!deck) return [];

  const now = Date.now();

  return deck.words.filter(word => {
    if (!word.nextReview) {
      word.nextReview = Date.now();
    }

    if (word.reviewLevel === undefined) {
      word.reviewLevel = 0;
    }

    return word.nextReview <= now;
  });
}

function addWord() {
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();

  if (word === "" || meaning === "") {
    alert("Please enter both word and meaning.");
    return;
  }

  const deck = getCurrentDeck();

  if (!deck) return;

    const newWord = {
    id: createId("word"),
    word: word,
    meaning: meaning,
    correctCount: 0,
    wrongCount: 0,
    reviewLevel: 0,
    nextReview: Date.now()
    };

  deck.words.push(newWord);
  saveData();

  wordInput.value = "";
  meaningInput.value = "";

  renderCurrentDeck();
}

// ---------- Quiz ----------

function startQuiz() {
  const deck = getCurrentDeck();

  if (!deck || deck.words.length === 0) {
    alert("Please add at least one word first.");
    return;
  }

  wordPage.classList.add("hidden");
  quizPage.classList.remove("hidden");

  quizDeckTitle.textContent = `${deck.name} Quiz`;
  quizProgress.textContent = `${deck.words.length} words in this deck`;

  pickRandomWordMain();
}

function pickRandomWordMain() {
  const dueWords = getDueWords();
  quizStats.textContent = `Correct: ${currentQuizWord.correctCount} | Wrong: ${currentQuizWord.wrongCount}`;
  if (dueWords.length === 0) {
    quizQuestionMain.textContent = "No words to review now.";
    quizAnswerMain.value = "";
    quizFeedbackMain.textContent = "All caught up. Come back later.";
    currentQuizWord = null;
    return;
  }

  const randomIndex = Math.floor(Math.random() * dueWords.length);
  currentQuizWord = dueWords[randomIndex];

  quizQuestionMain.textContent = currentQuizWord.word;
  quizAnswerMain.value = "";
  quizFeedbackMain.textContent = "";
  quizAnswerMain.focus();

  if (typeof waitingForNext !== "undefined") {
    waitingForNext = false;
  }

  if (typeof quizActionBtn !== "undefined") {
    quizActionBtn.textContent = "Submit";
  }

  const questionCard = document.querySelector(".big-question-card");
  if (questionCard) {
    questionCard.className = "big-question-card";
  }
}

function submitAnswerMain() {
  if (!currentQuizWord) return;

  const userAnswer = quizAnswerMain.value.trim();
  const correctAnswer = currentQuizWord.meaning.trim();

  if (userAnswer === "") return;

  const questionCard = document.querySelector(".big-question-card");

  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
    quizFeedbackMain.textContent = "✅ Correct!";
    quizFeedbackMain.style.color = "green";

    currentQuizWord.correctCount++;
    currentQuizWord.reviewLevel++;
    currentQuizWord.nextReview =
      Date.now() + getReviewDelay(currentQuizWord.reviewLevel);

    if (questionCard) {
      questionCard.className = "big-question-card correct-animation";
    }
  } else {
    quizFeedbackMain.innerHTML =
      `❌ Wrong<br>Correct answer: <b>${correctAnswer}</b>`;
    quizFeedbackMain.style.color = "red";

    currentQuizWord.wrongCount++;
    currentQuizWord.reviewLevel = 0;
    currentQuizWord.nextReview = Date.now();

    if (questionCard) {
      questionCard.className = "big-question-card wrong-animation";
    }
  }

  quizStats.textContent =
    `Correct: ${currentQuizWord.correctCount} | Wrong: ${currentQuizWord.wrongCount}`;

  saveData();

  waitingForNext = true;
  quizActionBtn.textContent = "Next";
}

function handleQuizButton() {

    if (waitingForNext) {

        pickRandomWordMain();

        waitingForNext = false;

        quizActionBtn.textContent = "Submit";

    } else {

        submitAnswerMain();

    }
}

function exitQuiz() {
  quizPage.classList.add("hidden");
  wordPage.classList.remove("hidden");

  currentQuizWord = null;
  renderCurrentDeck();
}

function pickRandomWord() {
  const deck = getCurrentDeck();

  if (!deck || deck.words.length === 0) return;

  const randomIndex = Math.floor(Math.random() * deck.words.length);
  currentQuizWord = deck.words[randomIndex];

  quizQuestion.textContent = currentQuizWord.word;
  answerInput.value = "";
  quizResult.textContent = "";
  answerInput.focus();
}

function submitAnswer() {
  if (!currentQuizWord) {
    alert("Please start the quiz first.");
    return;
  }

  const userAnswer = answerInput.value.trim();
  const correctAnswer = currentQuizWord.meaning.trim();

  if (userAnswer === "") {
    alert("Please type your answer.");
    return;
  }

  if (userAnswer === correctAnswer) {
    quizResult.textContent = "Correct!";
    quizResult.style.color = "green";
    currentQuizWord.correctCount++;
  } else {
    quizResult.textContent = `Wrong. Correct answer: ${correctAnswer}`;
    quizResult.style.color = "red";
    currentQuizWord.wrongCount++;
  }

  saveData();
  renderCurrentDeck();
}

// ---------- Events ----------

createDeckBtn.addEventListener("click", createDeck);
backBtn.addEventListener("click", goBackToDecks);
addWordBtn.addEventListener("click", addWord);

startQuizBtn.addEventListener("click", startQuiz);
submitAnswerBtn.addEventListener("click", submitAnswer);
nextQuestionBtn.addEventListener("click", pickRandomWord);
exitQuizBtn.addEventListener("click", exitQuiz);

quizActionBtn.addEventListener(
    "click",
    handleQuizButton
);

quizAnswerMain.addEventListener(
    "keydown",
    e => {

        if (e.key === "Enter") {

            handleQuizButton();

        }

    }
);



newDeckNameInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    createDeck();
  }
});

meaningInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    addWord();
  }
});

answerInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    submitAnswer();
  }
});

// ---------- Start App ----------

loadData();
renderDecks();
