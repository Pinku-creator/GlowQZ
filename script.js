const home = document.getElementById("home");
const quiz = document.getElementById("quiz");
const end = document.getElementById("end");
const playerNameInput = document.getElementById("playerName");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const timerEl = document.getElementById("timer");
const progressBar = document.getElementById("progressBar");
const finalScore = document.getElementById("finalScore");
const reviewDiv = document.getElementById("review");
const popup = document.getElementById("popup");
const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");
const timerText = document.getElementById("timer-text");
const timerFill = document.getElementById("timer-fill");
const scoreDisplay = document.getElementById("score");

let playerName = "";
let mode = "";
let type = "";
let questions = [];
let score = 0;
let questionIndex = 0;
let timeLeft = 60;
let timerInterval;
let reviewData = [];

document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".mode")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    mode = btn.dataset.mode;
    startIfReady();
  });
});

document.querySelectorAll(".type").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".type")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    type = btn.dataset.type;
    startIfReady();
  });
});

function startIfReady() {
  playerName = playerNameInput.value.trim();
  if (!playerName) {
    showPopup("Please enter your name!");
    return;
  }
  if (mode && type) startGame();
}

function showPopup(message) {
  popup.textContent = message;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 2000);
}
function startQuiz(mode) {
  selectedMode = mode;
  document.getElementById("home-page").style.display = "none";
  document.getElementById("quiz-page").style.display = "block";

  const timerContainer = document.getElementById("timer-container");
  const timerText = document.getElementById("timer-text");

  if (mode === "time-attack") {
    timerText.style.display = "block";
    timerContainer.classList.remove("centered");
  } else {
    timerText.style.display = "none";
    timerContainer.classList.add("centered");
  }

  loadNewQuestion();
}

async function startGame() {
  home.classList.add("hidden");
  quiz.classList.remove("hidden");
  score = 0;
  questionIndex = 0;
  reviewData = [];

  const category = type === "technology" ? 18 : type === "sports" ? 21 : 26;
  const res = await fetch(
    `https://opentdb.com/api.php?amount=10&category=${category}&type=multiple`
  );
  const data = await res.json();
  questions = data.results.map((q) => ({
    question: q.question,
    choices: [...q.incorrect_answers, q.correct_answer].sort(
      () => Math.random() - 0.5
    ),
    correct: q.correct_answer,
  }));

  if (mode === "time") startTimer();
  getNewQuestion();
}

function startTimer() {
  const totalTime = 60;
  timeLeft = totalTime;

  // Show timer in Time Attack, hide in Traditional
  const timerContainer = document.getElementById("timer-container");
  if (mode === "traditional") {
    timerContainer.style.opacity = "0";
  } else {
    timerContainer.style.opacity = "1";
  }

  clearInterval(timerInterval);
  updateTimerUI(timeLeft, totalTime);

  if (mode === "time") {
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame();
      } else {
        updateTimerUI(timeLeft, totalTime);
      }
    }, 1000);
  }
}

function updateTimerUI(current, total) {
  timerText.textContent = mode === "time" ? `Time: ${current}s` : "";
  const widthPercent = (current / total) * 100;
  timerFill.style.width = `${widthPercent}%`;
}

function getNewQuestion() {
  if (questionIndex >= questions.length) {
    endGame();
    return;
  }
  const current = questions[questionIndex];
  questionEl.innerHTML = current.question;
  choicesEl.innerHTML = "";
  current.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(choice, current.correct);
    choicesEl.appendChild(btn);
  });
}

function checkAnswer(selected, correct) {
  const currentQ = questions[questionIndex];
  const correctAns = selected === correct;
  if (correctAns) {
    score += 10;
    scoreDisplay.textContent = score;
    correctSound.currentTime = 0;
    correctSound.play();
    if (mode === "time") timeLeft += 2;
  } else {
    wrongSound.currentTime = 0;
    wrongSound.play();
    if (mode === "time") timeLeft -= 5;
  }
  reviewData.push({
    question: currentQ.question,
    selected,
    correct,
  });
  questionIndex++;
  getNewQuestion();
}

function endGame() {
  clearInterval(timerInterval);
  quiz.classList.add("hidden");
  end.classList.remove("hidden");
  finalScore.textContent = `${playerName}, your score: ${score}`;
  showReview();
}

function showReview() {
  reviewDiv.innerHTML = "";
  reviewData.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add(
      "review-item",
      item.selected === item.correct ? "correct" : "wrong"
    );
    div.innerHTML = `
      <p><strong>Q:</strong> ${item.question}</p>
      <p><strong>Your Answer:</strong> ${item.selected}</p>
      ${
        item.selected !== item.correct
          ? `<p><strong>Correct:</strong> ${item.correct}</p>`
          : ""
      }
    `;
    reviewDiv.appendChild(div);
  });
}

document.getElementById("restart").onclick = () => {
  end.classList.add("hidden");
  home.classList.remove("hidden");
  document
    .querySelectorAll(".selected")
    .forEach((b) => b.classList.remove("selected"));
  playerNameInput.value = "";
  timerEl.textContent = "";
  progressBar.style.width = "100%";
};

document.getElementById("downloadPdf").onclick = () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  // Helper: Decode HTML entities (to fix &quot; etc.)
  function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  // Decorative header
  pdf.setFillColor(97, 0, 244);
  pdf.rect(0, 0, 210, 20, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text(" Quiz Report ", 105, 13, { align: "center" });

  // Player summary box
  pdf.setDrawColor(156, 39, 176);
  pdf.setLineWidth(0.8);
  pdf.roundedRect(10, 25, 190, 25, 3, 3);
  pdf.setTextColor(0);
  pdf.setFontSize(12);
  pdf.text(`Name: ${playerName}`, 15, 35);
  pdf.text(`Mode: ${mode}`, 80, 35);
  pdf.text(`Type: ${type}`, 140, 35);
  pdf.text(`Score: ${score}`, 15, 45);

  let y = 60;
  // reviewData.forEach((item, index) => {
  //   if (y > 270) {
  //     pdf.addPage();
  //     y = 20;
  //   }

  //   pdf.setDrawColor(220, 220, 220);
  //   pdf.line(10, y - 5, 200, y - 5);

  //   const correct = item.selected === item.correct;
  //   pdf.setFontSize(12);
  //   pdf.setTextColor(correct ? 0 : 200, correct ? 180 : 0, 0);

  //   // Decode before adding
  //   const questionText = decodeHTML(item.question);
  //   const selectedText = decodeHTML(item.selected);
  //   const correctText = decodeHTML(item.correct);

  //   pdf.text(`${index + 1}. ${questionText}`, 10, y);
  //   y += 6;
  //   pdf.text(`Your Answer: ${selectedText}`, 10, y);
  //   y += 6;

  //   if (!correct) {
  //     pdf.setTextColor(0, 0, 255);
  //     pdf.text(`Correct Answer: ${correctText}`, 10, y);
  //     y += 6;
  //   }

  //   y += 4;
  // });
  //
  reviewData.forEach((item, index) => {
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }

    pdf.setDrawColor(220, 220, 220);
    pdf.line(10, y - 5, 200, y - 5);

    const correct = item.selected === item.correct;
    pdf.setFontSize(12);
    pdf.setTextColor(correct ? 0 : 200, correct ? 180 : 0, 0);

    const questionText = decodeHTML(item.question);
    const selectedText = decodeHTML(item.selected);
    const correctText = decodeHTML(item.correct);

    // ✅ Wrap question text to fit the page
    const wrappedQuestion = pdf.splitTextToSize(
      `${index + 1}. ${questionText}`,
      180
    );
    pdf.text(wrappedQuestion, 10, y);
    y += wrappedQuestion.length * 6;

    pdf.text(`Your Answer: ${selectedText}`, 10, y);
    y += 6;

    if (!correct) {
      pdf.setTextColor(0, 0, 255);
      const wrappedCorrect = pdf.splitTextToSize(
        `Correct Answer: ${correctText}`,
        180
      );
      pdf.text(wrappedCorrect, 10, y);
      y += wrappedCorrect.length * 6;
    }

    y += 4;
  });

  pdf.save(`${playerName}_Quiz_Report.pdf`);
};

// Neon gradient progress bar (you can keep same logic)
function updateTimerBar() {
  const width = (timeLeft / totalTime) * 100;
  const fill = document.getElementById("timer-fill");
  fill.style.width = width + "%";
  // Animate gradient movement for a glowing effect
  fill.style.background = `linear-gradient(90deg, #00f0ff, #ff00ff, #00f0ff)`;
  fill.style.backgroundSize = "200% 100%";
  fill.style.animation = "neonFlow 2s linear infinite";
}

// document.getElementById("downloadPdf").onclick = () => {
//   const { jsPDF } = window.jspdf;
//   const pdf = new jsPDF();

//   function decodeHTML(html) {
//     const txt = document.createElement("textarea");
//     txt.innerHTML = html;
//     return txt.value;
//   }
//   // Decorative header
//   pdf.setFillColor(97, 0, 244);
//   pdf.rect(0, 0, 210, 20, "F");
//   pdf.setTextColor(255, 255, 255);
//   pdf.setFontSize(18);
//   // pdf.text("✨ Quiz Report ✨", 60, 13);
//   pdf.text(" Quiz Report ", 105, 13, { align: "center" });

//   // pdf.text("Quiz Report", 60, 13);
//   // Player summary box
//   pdf.setDrawColor(156, 39, 176);
//   pdf.setLineWidth(0.8);
//   pdf.roundedRect(10, 25, 190, 25, 3, 3);
//   pdf.setTextColor(0);
//   pdf.setFontSize(12);
//   pdf.text(`Name: ${playerName}`, 15, 35);
//   pdf.text(`Mode: ${mode}`, 80, 35);
//   pdf.text(`Type: ${type}`, 140, 35);
//   pdf.text(`Score: ${score}`, 15, 45);

//   let y = 60;
//   reviewData.forEach((item, index) => {
//     if (y > 270) {
//       pdf.addPage();
//       y = 20;
//     }

//     pdf.setDrawColor(220, 220, 220);
//     pdf.line(10, y - 5, 200, y - 5);

//     const correct = item.selected === item.correct;
//     if (correct) pdf.setTextColor(0, 180, 0);
//     else pdf.setTextColor(200, 0, 0);

//     pdf.setFontSize(12);
//     pdf.text(`${index + 1}. ${item.question}`, 10, y);
//     y += 6;
//     pdf.text(`Your Answer: ${item.selected}`, 10, y);
//     y += 6;

//     if (!correct) {
//       pdf.setTextColor(0, 0, 255);
//       pdf.text(`Correct Answer: ${item.correct}`, 10, y);
//       y += 6;
//     }

//     y += 4;
//   });

//   pdf.save(`${playerName}_Quiz_Report.pdf`);
// };

// function updateTimerBar() {
//   const width = (timeLeft / totalTime) * 100;
//   document.getElementById("timer-fill").style.width = width + "%";
// }
