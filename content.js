// Canvas Assignment Helper - Content Script

const SIDEBAR_ID = "canvas-ai-sidebar";

function extractAssignmentText() {
  const selectors = [
    // Assignment description
    "#assignment_show .description",
    ".assignment-description",
    "#assignment_description",
    // Quiz instructions
    "#quiz-instructions .description",
    ".quiz-description",
    // Generic Canvas content areas
    ".user_content",
    "#content .description",
    // Question text for quizzes
    ".question_text",
    ".quiz_question .question_text",
  ];

  const parts = [];

  // Try to get the assignment title
  const titleEl =
    document.querySelector("h1.title") ||
    document.querySelector("#assignment_show h1") ||
    document.querySelector(".quiz-header h1") ||
    document.querySelector("h1");
  if (titleEl) {
    parts.push("Assignment: " + titleEl.innerText.trim());
  }

  // Try each selector for assignment body
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim().length > 20) {
      parts.push(el.innerText.trim());
      break;
    }
  }

  // For quiz pages with multiple questions, grab all question texts
  const questionEls = document.querySelectorAll(".question .question_text");
  if (questionEls.length > 0) {
    questionEls.forEach((q, i) => {
      parts.push(`Question ${i + 1}: ${q.innerText.trim()}`);
    });
  }

  return parts.join("\n\n").trim();
}

function createSidebar() {
  if (document.getElementById(SIDEBAR_ID)) return;

  const sidebar = document.createElement("div");
  sidebar.id = SIDEBAR_ID;
  sidebar.innerHTML = `
    <div id="cah-header">
      <span id="cah-title">AI Assignment Helper</span>
      <button id="cah-close" title="Close">✕</button>
    </div>
    <div id="cah-body">
      <div id="cah-question-area">
        <label>Extracted question:</label>
        <textarea id="cah-question" rows="6" placeholder="Question text will appear here..."></textarea>
      </div>
      <div id="cah-controls">
        <button id="cah-extract-btn">Extract from Page</button>
        <button id="cah-ask-btn">Ask Claude</button>
      </div>
      <div id="cah-status"></div>
      <div id="cah-answer-area" style="display:none;">
        <label>Claude's response:</label>
        <div id="cah-answer"></div>
      </div>
    </div>
  `;
  document.body.appendChild(sidebar);

  // Close button
  document.getElementById("cah-close").addEventListener("click", () => {
    sidebar.remove();
  });

  // Extract button
  document.getElementById("cah-extract-btn").addEventListener("click", () => {
    const text = extractAssignmentText();
    const textarea = document.getElementById("cah-question");
    if (text) {
      textarea.value = text;
      setStatus("");
    } else {
      textarea.value = "";
      setStatus("Could not extract text. Try selecting text manually and it will appear here.", "warn");
    }
  });

  // Ask Claude button
  document.getElementById("cah-ask-btn").addEventListener("click", async () => {
    const question = document.getElementById("cah-question").value.trim();
    if (!question) {
      setStatus("Please extract or enter a question first.", "warn");
      return;
    }

    setStatus("Asking Claude...", "loading");
    document.getElementById("cah-ask-btn").disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: "ASK_CLAUDE",
        question,
      });

      if (response.error) {
        setStatus("Error: " + response.error, "error");
      } else {
        showAnswer(response.answer);
        setStatus("");
      }
    } catch (err) {
      setStatus("Extension error: " + err.message, "error");
    } finally {
      document.getElementById("cah-ask-btn").disabled = false;
    }
  });

  // Auto-extract on open
  const extracted = extractAssignmentText();
  if (extracted) {
    document.getElementById("cah-question").value = extracted;
  }
}

function setStatus(msg, type = "") {
  const el = document.getElementById("cah-status");
  el.textContent = msg;
  el.className = type ? `cah-status-${type}` : "";
}

function showAnswer(answer) {
  const area = document.getElementById("cah-answer-area");
  const el = document.getElementById("cah-answer");
  // Simple markdown-ish formatting: preserve newlines
  el.innerHTML = answer
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  area.style.display = "block";
}

// Add the trigger button to the page
function addTriggerButton() {
  if (document.getElementById("cah-trigger")) return;

  const btn = document.createElement("button");
  btn.id = "cah-trigger";
  btn.textContent = "Ask AI";
  btn.title = "Open Canvas Assignment Helper";
  btn.addEventListener("click", () => {
    if (document.getElementById(SIDEBAR_ID)) {
      document.getElementById(SIDEBAR_ID).remove();
    } else {
      createSidebar();
    }
  });
  document.body.appendChild(btn);
}

// Wait for page to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addTriggerButton);
} else {
  addTriggerButton();
}
