document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const inputField      = document.getElementById("emojiInput");
  const emojiGrid       = document.getElementById("emojiGrid");
  const randomizeButton = document.getElementById("randomizeButton");
  const outOf100Toggle  = document.getElementById("outOf100Toggle");
  const copyButton      = document.getElementById("copyButton");
  const emojiPicker     = document.getElementById("emojiPicker");
  const emojiButton     = document.getElementById("emojiButton");
  const barGraphToggle  = document.getElementById("barGraphToggle");
  const sidebar         = document.getElementById("sidebar");
  const gearButton      = document.getElementById("gearButton");
  const gridWidthInput  = document.getElementById("gridWidthInput");

  // Application State
  const state = {
    emojis: [],
    originalEmojiData: [],
    isOutOf100: false,
    cursorPosition: 0,
    gridWidth: 10
  };

  // Initialize All Listeners
  function initializeListeners() {
    inputField.addEventListener("input", handleInputChange);
    randomizeButton.addEventListener("click", handleRandomize);
    copyButton.addEventListener("click", handleCopy);
    emojiButton.addEventListener("click", showEmojiPicker);
    emojiPicker.addEventListener("emoji-click", handleEmojiInsert);
    outOf100Toggle.addEventListener("change", handleTogglePercent);
    gearButton.addEventListener("click", toggleSidebar);
    barGraphToggle.addEventListener("change", handleBarGraphToggle);
    gridWidthInput.addEventListener("input", handleGridWidthChange);

    // Close sidebar if user clicks outside it
    document.addEventListener("click", (event) => {
      if (sidebar.classList.contains("open")) {
        const insideSidebar = sidebar.contains(event.target);
        const onGearButton  = gearButton && gearButton.contains(event.target);
        if (!insideSidebar && !onGearButton) {
          sidebar.classList.remove("open");
        }
      }
    });

    // Close emoji picker if user clicks outside it
    document.addEventListener("click", (event) => {
      if (emojiPicker.style.display === "block") {
        const insidePicker = emojiPicker.contains(event.target);
        const onEmojiBtn   = emojiButton.contains(event.target);
        if (!insidePicker && !onEmojiBtn) {
          emojiPicker.style.display = "none";
        }
      }
    });
  }

  /*******************************************************
   *  EVENT HANDLERS
   *******************************************************/
  function handleInputChange() {
    resetPercentMode();
    updateEmojiGrid();
  }

  function handleRandomize() {
    if (barGraphToggle.checked) {
      barGraphToggle.checked = false;
      resetToDefaultGrid();
    }
    shuffleArray(state.emojis);
    updateGrid();
    animateButton(randomizeButton);
  }

  function handleCopy() {
    // Build summary + array text to copy
    const summaryText = getEmojiSummary(state.emojis);
    let textOutput = `${summaryText}\n\n`;

    // Append the actual array
    if (barGraphToggle.checked) {
      textOutput += generateBarGraphText(state.emojis, state.gridWidth);
    } else {
      textOutput += generateGridTextByColumns(state.emojis, state.gridWidth);
    }

    navigator.clipboard.writeText(textOutput).then(showCopyConfirmation);
  }

  function handleTogglePercent() {
    state.isOutOf100 = outOf100Toggle.checked;
    if (state.isOutOf100) {
      state.originalEmojiData = [...state.emojis];
      convertTo100Emojis();
    } else {
      state.emojis = [...state.originalEmojiData];
    }
    if (barGraphToggle.checked) {
      applyBarGraphFormat();
    } else {
      updateGrid();
    }
  }

  function handleEmojiInsert(event) {
    const emoji = event.detail.unicode || event.detail.emoji;
    const text  = inputField.value;
    inputField.value =
      text.slice(0, state.cursorPosition) + emoji + text.slice(state.cursorPosition);

    state.cursorPosition += emoji.length;
    emojiPicker.style.display = "none";
    inputField.focus();
    updateEmojiGrid();
  }

  function showEmojiPicker() {
    state.cursorPosition = inputField.selectionStart || inputField.value.length;
    emojiPicker.style.display =
      emojiPicker.style.display === "block" ? "none" : "block";
  }

  function toggleSidebar() {
    sidebar.classList.toggle("open");
  }

  function handleBarGraphToggle() {
    if (barGraphToggle.checked) {
      applyBarGraphFormat();
    } else {
      resetToDefaultGrid();
    }
  }

  function handleGridWidthChange(e) {
    const newWidth = parseInt(e.target.value, 10) || 1;
    state.gridWidth = newWidth < 1 ? 1 : newWidth;
    if (barGraphToggle.checked) {
      applyBarGraphFormat();
    } else {
      updateGrid();
    }
  }

  /*******************************************************
   *  BAR GRAPH / GRID RENDERING
   *******************************************************/
  function applyBarGraphFormat() {
    emojiGrid.classList.add("bar-graph");
    emojiGrid.innerHTML = "";

    const emojiCounts = {};
    state.emojis.forEach((emoji) => {
      emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
    });
    const barWidth = state.gridWidth || 10;

    Object.entries(emojiCounts).forEach(([emoji, count]) => {
      const fullRows = Math.floor(count / barWidth);
      const remainder = count % barWidth;

      for (let i = 0; i < fullRows; i++) {
        const row = document.createElement("div");
        row.className = "bar-row";
        row.textContent = emoji.repeat(barWidth);
        emojiGrid.appendChild(row);
      }
      if (remainder > 0) {
        const row = document.createElement("div");
        row.className = "bar-row";
        row.textContent = emoji.repeat(remainder);
        emojiGrid.appendChild(row);
      }
    });
  }

  function resetToDefaultGrid() {
    emojiGrid.classList.remove("bar-graph");
    updateGrid();
  }

  /*******************************************************
   *  CORE FUNCTIONS
   *******************************************************/
  function updateEmojiGrid() {
    state.emojis = [];
    const entries = inputField.value.split(/[, ]+/);
    entries.forEach((entry) => {
      const match = entry.match(/(\d+)([^\d\s]+)/);
      if (match) {
        const count = parseInt(match[1], 10);
        const emoji = match[2];
        for (let i = 0; i < count; i++) {
          state.emojis.push(emoji);
        }
      }
    });
    updateGrid();
  }

  function convertTo100Emojis() {
    const entries = inputField.value.split(/[, ]+/);
    let totalCount = 0;
    const proportions = [];

    entries.forEach((entry) => {
      const match = entry.match(/(\d+)([^\d\s]+)/);
      if (match) {
        const count = parseInt(match[1], 10);
        const emoji = match[2];
        totalCount += count;
        proportions.push({ emoji, count });
      }
    });

    state.emojis = [];
    let remaining = 100;
    proportions.forEach(({ emoji, count }, index) => {
      const scaledCount =
        index === proportions.length - 1
          ? remaining
          : Math.round((count / totalCount) * 100);

      for (let i = 0; i < scaledCount; i++) {
        state.emojis.push(emoji);
      }
      remaining -= scaledCount;
    });
  }

  function updateGrid() {
    if (barGraphToggle.checked) return;
    emojiGrid.innerHTML = "";
    emojiGrid.style.gridTemplateColumns = `repeat(${state.gridWidth}, 1fr)`;

    state.emojis.forEach((emoji) => {
      const cell = document.createElement("div");
      cell.className = "emoji";
      cell.textContent = emoji;
      emojiGrid.appendChild(cell);
    });

    // Update ARIA label for the grid
    emojiGrid.setAttribute("aria-label", getEmojiSummary(state.emojis));

    [randomizeButton, copyButton, outOf100Toggle.parentElement].forEach((el) => {
      if (el) el.style.display = "flex";
    });
  }

  function resetPercentMode() {
    if (state.isOutOf100) {
      state.isOutOf100 = false;
      outOf100Toggle.checked = false;
    }
  }

  /*******************************************************
   *  UTILITY / HELPER FUNCTIONS
   *******************************************************/
  function getEmojiSummary(emojis) {
    const counts = {};
    emojis.forEach((em) => {
      counts[em] = (counts[em] || 0) + 1;
    });
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    let summary = `${total} emojis below: `;

    for (const [emoji, count] of Object.entries(counts)) {
      summary += `${count} x ${emoji}, `;
    }
    return summary.replace(/,\s*$/, "");
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function generateGridTextByColumns(emojis, columns) {
    if (columns < 1) columns = 10;
    let result = "";
    emojis.forEach((emoji, index) => {
      result += emoji;
      if ((index + 1) % columns === 0) {
        result += "\n";
      }
    });
    return result;
  }

  function generateBarGraphText(emojis, barWidth) {
    if (barWidth < 1) barWidth = 10;
    const counts = {};
    let result   = "";
    emojis.forEach((em) => {
      counts[em] = (counts[em] || 0) + 1;
    });
    for (const [emoji, count] of Object.entries(counts)) {
      const fullRows = Math.floor(count / barWidth);
      const remainder = count % barWidth;
      for (let i = 0; i < fullRows; i++) {
        result += emoji.repeat(barWidth) + "\n";
      }
      if (remainder > 0) {
        result += emoji.repeat(remainder) + "\n";
      }
    }
    return result;
  }

  function animateButton(button) {
    button.classList.add("shake");
    setTimeout(() => button.classList.remove("shake"), 300);
  }

  function showCopyConfirmation() {
    copyButton.textContent = "✅ Copied!";
    setTimeout(() => {
      copyButton.textContent = "📋 Copy";
    }, 2000);
  }

  // Final Initialization
  initializeListeners();
  updateEmojiGrid();
});