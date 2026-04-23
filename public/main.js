import { Chess } from "https://esm.sh/chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECE_ORDER = ["q", "r", "b", "n", "p"];
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const STARTING_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
const STORAGE_KEY = "premium-chess-settings";
const AI_ONLY_MODE = true;
const API_ROOT = "";

const PIECE_ASSETS = {
  wp: "/static/pieces/wp.svg",
  wn: "/static/pieces/wn.svg",
  wb: "/static/pieces/wb.svg",
  wr: "/static/pieces/wr.svg",
  wq: "/static/pieces/wq.svg",
  wk: "/static/pieces/wk.svg",
  bp: "/static/pieces/bp.svg",
  bn: "/static/pieces/bn.svg",
  bb: "/static/pieces/bb.svg",
  br: "/static/pieces/br.svg",
  bq: "/static/pieces/bq.svg",
  bk: "/static/pieces/bk.svg",
};

const dom = {
  body: document.body,
  board: document.getElementById("board"),
  dragGhost: document.getElementById("dragGhost"),
  gestureCursor: document.getElementById("gestureCursor"),
  turnPill: document.getElementById("turnPill"),
  statusPill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  lastMoveText: document.getElementById("lastMoveText"),
  checkStateText: document.getElementById("checkStateText"),
  moveHistory: document.getElementById("moveHistory"),
  capturedByWhite: document.getElementById("capturedByWhite"),
  capturedByBlack: document.getElementById("capturedByBlack"),
  modeHuman: document.getElementById("modeHuman"),
  modeAI: document.getElementById("modeAI"),
  difficultySelect: document.getElementById("difficultySelect"),
  undoBtn: document.getElementById("undoBtn"),
  redoBtn: document.getElementById("redoBtn"),
  restartBtn: document.getElementById("restartBtn"),
  themeToggle: document.getElementById("themeToggle"),
  soundToggle: document.getElementById("soundToggle"),
  gestureToggle: document.getElementById("gestureToggle"),
  perspectiveToggle: document.getElementById("perspectiveToggle"),
  apiStatusBadge: document.getElementById("apiStatusBadge"),
  headerMode: document.getElementById("headerMode"),
  gestureStatusBadge: document.getElementById("gestureStatusBadge"),
  perspectiveText: document.getElementById("perspectiveText"),
  evaluationText: document.getElementById("evaluationText"),
  engineSourceText: document.getElementById("engineSourceText"),
  engineLineText: document.getElementById("engineLineText"),
  whitePlayerCard: document.getElementById("whitePlayerCard"),
  whitePlayerName: document.getElementById("whitePlayerName"),
  whitePlayerBadge: document.getElementById("whitePlayerBadge"),
  blackPlayerCard: document.getElementById("blackPlayerCard"),
  blackPlayerName: document.getElementById("blackPlayerName"),
  blackPlayerBadge: document.getElementById("blackPlayerBadge"),
  roomCodeText: document.getElementById("roomCodeText"),
  syncStatusBadge: document.getElementById("syncStatusBadge"),
  roomStatusText: document.getElementById("roomStatusText"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  copyInviteBtn: document.getElementById("copyInviteBtn"),
  shareInviteBtn: document.getElementById("shareInviteBtn"),
  leaveRoomBtn: document.getElementById("leaveRoomBtn"),
  joinRoomInput: document.getElementById("joinRoomInput"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  inviteFeedbackText: document.getElementById("inviteFeedbackText"),
  gestureVideo: document.getElementById("gestureVideo"),
  gestureStateText: document.getElementById("gestureStateText"),
  gestureSquareText: document.getElementById("gestureSquareText"),
  promotionModal: document.getElementById("promotionModal"),
  promotionOptions: document.getElementById("promotionOptions"),
  promotionCancel: document.getElementById("promotionCancel"),
  celebrationOverlay: document.getElementById("celebrationOverlay"),
  celebrationTitle: document.getElementById("celebrationTitle"),
  celebrationText: document.getElementById("celebrationText"),
  celebrationConfetti: document.getElementById("celebrationConfetti"),
  celebrationRestart: document.getElementById("celebrationRestart"),
  celebrationClose: document.getElementById("celebrationClose"),
};

const state = {
  game: new Chess(),
  mode: "ai",
  aiDepth: 3,
  theme: "light",
  orientation: "white",
  soundEnabled: true,
  apiStatus: "checking",
  engine: {
    evaluation: 0,
    source: "Minimax",
    note: "Balanced starting position. Open with control of the center.",
  },
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  drag: null,
  redoStack: [],
  aiThinking: false,
  aiRequestId: 0,
  interactionLocked: false,
  pendingPromotion: null,
  suppressClickUntil: 0,
  audioContext: null,
  gesture: {
    enabled: false,
    ready: false,
    hands: null,
    camera: null,
    pointerX: 0,
    pointerY: 0,
    pinching: false,
    hoverSquare: null,
    stream: null,
    denied: false,
  },
  room: {
    active: false,
    code: "",
    playerToken: "",
    playerColor: "w",
    hostName: "You",
    guestName: "",
    inviteUrl: "",
    pollingId: null,
    lastVersion: 0,
  },
  celebration: {
    visible: false,
    key: "",
    dismissedKey: "",
    title: "",
    text: "",
    confettiMarkup: "",
  },
};

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.mode = "ai";
    state.aiDepth = [2, 3, 4].includes(saved.aiDepth) ? saved.aiDepth : 3;
    state.theme = saved.theme === "dark" ? "dark" : "light";
    state.orientation = saved.orientation === "black" ? "black" : "white";
    state.soundEnabled = saved.soundEnabled !== false;
  } catch {
    state.mode = "ai";
  }
}

function savePreferences() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      mode: "ai",
      aiDepth: state.aiDepth,
      theme: state.theme,
      orientation: state.orientation,
      soundEnabled: state.soundEnabled,
    }),
  );
}

function gameCall(methodNames, defaultValue = false) {
  for (const methodName of methodNames) {
    if (typeof state.game[methodName] === "function") {
      return state.game[methodName]();
    }
  }
  return defaultValue;
}

function isCheck() {
  return gameCall(["isCheck", "in_check"]);
}

function isCheckmate() {
  return gameCall(["isCheckmate", "in_checkmate"]);
}

function isDraw() {
  return gameCall(["isDraw", "in_draw"]);
}

function isStalemate() {
  return gameCall(["isStalemate", "in_stalemate"]);
}

function isGameOver() {
  return gameCall(["isGameOver", "game_over"]);
}

function isInsufficientMaterial() {
  return gameCall(["isInsufficientMaterial", "insufficient_material"]);
}

function isThreefoldRepetition() {
  return gameCall(["isThreefoldRepetition", "in_threefold_repetition"]);
}

function getPieceAt(square) {
  return typeof state.game.get === "function" ? state.game.get(square) : null;
}

function currentTurnColor() {
  return state.game.turn() === "w" ? "white" : "black";
}

function currentTurnCode() {
  return state.game.turn();
}

function isRoomActive() {
  return !AI_ONLY_MODE && state.room.active && !!state.room.code;
}

function buildInviteUrl(roomCode = state.room.code) {
  const inviteUrl = new URL(window.location.href);
  inviteUrl.searchParams.set("room", roomCode);
  return inviteUrl.toString();
}

function setInviteFeedback(message) {
  if (dom.inviteFeedbackText) {
    dom.inviteFeedbackText.textContent = message;
  }
}

function serializeMoves() {
  return state.game.history({ verbose: true }).map((move) => `${move.from}${move.to}${move.promotion || ""}`);
}

function hydrateGameFromMoves(moves) {
  const replayGame = new Chess();
  for (const move of moves) {
    const applied = replayGame.move({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: move[4],
    });
    if (!applied) {
      throw new Error("Room sync contained an invalid move sequence.");
    }
  }

  state.game = replayGame;
  state.lastMove = lastHistoryMove();
  clearSelection();
  closePromotion();
}

function setOrientation(orientation, { save = true } = {}) {
  state.orientation = orientation === "black" ? "black" : "white";
  if (dom.perspectiveToggle) {
    dom.perspectiveToggle.textContent = state.orientation === "white" ? "View black side" : "View white side";
  }
  if (save) {
    savePreferences();
  }
}

function formatEvaluation(score) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return "0.0";
  }

  if (Math.abs(score) >= 99999) {
    return score > 0 ? "Mate +" : "Mate -";
  }

  const pawns = score / 100;
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
}

function setEngineInsight({ evaluation, source, note }) {
  if (typeof evaluation === "number") {
    state.engine.evaluation = evaluation;
  }
  if (source) {
    state.engine.source = source;
  }
  if (note) {
    state.engine.note = note;
  }
}

function buildCelebrationConfetti() {
  const colors = ["#f97316", "#fbbf24", "#38bdf8", "#22c55e", "#fb7185", "#f8fafc"];
  return Array.from({ length: 24 }, (_, index) => {
    const left = 4 + ((index * 11) % 92);
    const delay = (index % 6) * 0.12;
    const duration = 2.8 + (index % 5) * 0.22;
    const rotation = index % 2 === 0 ? -18 : 18;
    const color = colors[index % colors.length];
    return `<span class="confetti-piece" style="--left:${left}%;--delay:${delay}s;--duration:${duration}s;--rotate:${rotation}deg;--color:${color};"></span>`;
  }).join("");
}

function playCelebrationSound() {
  if (!state.soundEnabled) {
    return;
  }
  playTone({ frequency: 392, duration: 0.08, type: "triangle", volume: 0.05 });
  playTone({ frequency: 523.25, duration: 0.09, type: "triangle", volume: 0.05, delay: 0.07 });
  playTone({ frequency: 659.25, duration: 0.14, type: "triangle", volume: 0.05, delay: 0.14 });
}

function hideCelebration({ dismiss = false } = {}) {
  if (dismiss) {
    state.celebration.dismissedKey = state.game.fen();
  }
  state.celebration.visible = false;
}

function syncCelebrationState() {
  const gameKey = state.game.fen();

  if (!isCheckmate()) {
    if (state.celebration.visible && state.celebration.key !== gameKey) {
      state.celebration.visible = false;
    }
    return;
  }

  if (state.celebration.visible && state.celebration.key === gameKey) {
    return;
  }

  if (state.celebration.dismissedKey === gameKey) {
    return;
  }

  const winner = state.game.turn() === "w" ? "Black" : "White";
  state.celebration.visible = true;
  state.celebration.key = gameKey;
  state.celebration.title = `${winner} Wins`;
  state.celebration.text = `${winner} delivered checkmate. The king is trapped and the board belongs to ${winner.toLowerCase()}.`;
  state.celebration.confettiMarkup = buildCelebrationConfetti();
  playCelebrationSound();
}

function humanCanInteract() {
  if (state.interactionLocked) {
    return false;
  }

  if (isRoomActive()) {
    return currentTurnCode() === state.room.playerColor;
  }

  return !(state.mode === "ai" && state.game.turn() === "b");
}

function pieceKey(piece) {
  return `${piece.color}${piece.type}`;
}

function squareTone(square) {
  const fileIndex = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  return (fileIndex + rank) % 2 === 0 ? "dark" : "light";
}

function isPieceMovable(piece) {
  if (!piece || !humanCanInteract()) {
    return false;
  }
  return piece.color === state.game.turn();
}

function setTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  dom.body.dataset.theme = state.theme;
  dom.themeToggle.textContent = state.theme === "dark" ? "Light mode" : "Dark mode";
}

function updateButtonStates() {
  state.mode = "ai";
  dom.modeHuman?.classList.toggle("is-active", false);
  dom.modeAI?.classList.toggle("is-active", true);
  dom.soundToggle.classList.toggle("is-active", state.soundEnabled);
  dom.soundToggle.textContent = state.soundEnabled ? "Sound on" : "Sound off";
  dom.gestureToggle.classList.toggle("is-active", state.gesture.enabled);
  dom.gestureToggle.textContent = state.gesture.enabled ? "Disable gestures" : "Enable gestures";
  dom.difficultySelect.value = String(state.aiDepth);
  dom.headerMode.textContent = "Human vs AI";
  if (dom.perspectiveToggle) {
    dom.perspectiveToggle.textContent = state.orientation === "white" ? "View black side" : "View white side";
  }
}

function updateApiBadge() {
  dom.apiStatusBadge.classList.remove("status-online", "status-offline", "status-fallback");
  if (state.apiStatus === "online") {
    dom.apiStatusBadge.textContent = "Server AI ready";
    dom.apiStatusBadge.classList.add("status-online");
    return;
  }
  if (state.apiStatus === "fallback") {
    dom.apiStatusBadge.textContent = "Local fallback";
    dom.apiStatusBadge.classList.add("status-fallback");
    return;
  }
  if (state.apiStatus === "offline") {
    dom.apiStatusBadge.textContent = "Backend offline";
    dom.apiStatusBadge.classList.add("status-offline");
    return;
  }
  dom.apiStatusBadge.textContent = "Checking...";
}

function updateGestureBadge() {
  dom.gestureStatusBadge.textContent = state.gesture.enabled ? "Gesture enabled" : "Mouse / Touch";
}

function updatePlayerPanels() {
  const roomMode = isRoomActive();
  const blackName = roomMode
    ? state.room.guestName || "Waiting for friend"
    : "AI Rival";

  dom.whitePlayerName.textContent = roomMode ? state.room.hostName || "Host" : "You";
  dom.blackPlayerName.textContent = blackName;

  const whiteActive = currentTurnCode() === "w";
  const blackActive = currentTurnCode() === "b";

  dom.whitePlayerCard.classList.toggle("is-active", whiteActive);
  dom.blackPlayerCard.classList.toggle("is-active", blackActive);
  dom.whitePlayerCard.classList.toggle("is-local", !roomMode || state.room.playerColor === "w");
  dom.blackPlayerCard.classList.toggle("is-local", !roomMode ? state.mode !== "ai" : state.room.playerColor === "b");

  if (roomMode) {
    dom.whitePlayerBadge.textContent = state.room.playerColor === "w" ? "You" : whiteActive ? "Turn" : "Remote";
    dom.blackPlayerBadge.textContent = state.room.playerColor === "b" ? "You" : blackActive ? "Turn" : state.room.guestName ? "Remote" : "Invite";
    return;
  }

  dom.whitePlayerBadge.textContent = whiteActive ? "Turn" : "Ready";
  dom.blackPlayerBadge.textContent = blackActive ? "Thinking" : "Waiting";
}

function updateRoomPanel() {
  if (!dom.roomCodeText || !dom.syncStatusBadge || !dom.roomStatusText) {
    return;
  }

  const roomMode = isRoomActive();

  dom.roomCodeText.textContent = roomMode ? state.room.code : "No active room";
  dom.syncStatusBadge.classList.remove("is-live", "is-waiting", "is-offline");

  if (roomMode) {
    const waitingForGuest = !state.room.guestName;
    dom.syncStatusBadge.textContent = waitingForGuest ? "Waiting for friend" : "Live room";
    dom.syncStatusBadge.classList.add(waitingForGuest ? "is-waiting" : "is-live");
    dom.roomStatusText.textContent = waitingForGuest
      ? "Invite copied players can join instantly from mobile, tablet, or desktop."
      : `Room ${state.room.code} is synced. ${state.room.playerColor === "w" ? "You play white." : "You play black."}`;
  } else {
    dom.syncStatusBadge.textContent = "Solo board";
    dom.roomStatusText.textContent = "Create a room to invite a friend and sync moves live.";
  }

  dom.copyInviteBtn.disabled = !roomMode;
  dom.shareInviteBtn.disabled = !roomMode;
  dom.leaveRoomBtn.disabled = !roomMode;
}

function updateInsightPanel() {
  const perspectiveLabel = state.orientation === "white" ? "White side" : "Black side";
  dom.perspectiveText.textContent = perspectiveLabel;
  dom.evaluationText.textContent = state.aiThinking ? "..." : formatEvaluation(state.engine.evaluation);
  dom.engineSourceText.textContent = state.engine.source;

  if (state.aiThinking) {
    dom.engineLineText.textContent = `Depth ${state.aiDepth} search running. The engine is evaluating tactical pressure and king safety.`;
    return;
  }

  if (isRoomActive()) {
    dom.engineLineText.textContent = state.room.guestName
      ? `Live room ${state.room.code} is synced. ${state.room.playerColor === "w" ? "You have the white pieces." : "You have the black pieces."}`
      : `Invite room ${state.room.code} is ready. Share the link and wait for your friend to join.`;
    return;
  }

  dom.engineLineText.textContent = state.engine.note;
}

function renderCelebration() {
  dom.celebrationOverlay.hidden = !state.celebration.visible;
  if (!state.celebration.visible) {
    dom.celebrationConfetti.innerHTML = "";
    return;
  }

  dom.celebrationTitle.textContent = state.celebration.title;
  dom.celebrationText.textContent = state.celebration.text;
  dom.celebrationRestart.disabled = isRoomActive();
  dom.celebrationRestart.textContent = isRoomActive() ? "Restart locked in room" : "Play again";
  dom.celebrationConfetti.innerHTML = state.celebration.confettiMarkup;
}

function getKingSquare(color) {
  for (let rank = 8; rank >= 1; rank -= 1) {
    for (const file of FILES) {
      const square = `${file}${rank}`;
      const piece = getPieceAt(square);
      if (piece && piece.color === color && piece.type === "k") {
        return square;
      }
    }
  }
  return null;
}

function getStatusSummary() {
  if (isCheckmate()) {
    const winner = state.game.turn() === "w" ? "Black" : "White";
    return {
      pill: `${winner} wins`,
      text: `${winner} wins by checkmate.`,
      check: "Checkmate on the board",
    };
  }

  if (isDraw()) {
    let detail = "Drawn position";
    if (isStalemate()) detail = "Stalemate";
    if (isInsufficientMaterial()) detail = "Draw by insufficient material";
    if (isThreefoldRepetition()) detail = "Draw by repetition";
    return {
      pill: "Draw",
      text: `${detail}. Restart or explore a new line.`,
      check: "No king under attack",
    };
  }

  if (state.aiThinking) {
    return {
      pill: "AI thinking",
      text: "The engine is evaluating candidate moves.",
      check: isCheck() ? `${currentTurnColor()} king is in check` : "Kings are safe",
    };
  }

  if (isRoomActive()) {
    const yourTurn = currentTurnCode() === state.room.playerColor;
    return {
      pill: yourTurn ? "Your turn" : "Friend's turn",
      text: yourTurn
        ? "Your move is live and will sync to your friend's board."
        : "Waiting for your friend's move to arrive from the live room.",
      check: isCheck() ? `${currentTurnColor().slice(0, 1).toUpperCase()}${currentTurnColor().slice(1)} king is in check` : "Kings are safe",
    };
  }

  const turnText = `${currentTurnColor().slice(0, 1).toUpperCase()}${currentTurnColor().slice(1)} to move`;
  return {
    pill: turnText,
    text: isCheck() ? `${turnText}. Respond to the check.` : `${turnText}. Select a piece or drag to move.`,
    check: isCheck() ? `${currentTurnColor().slice(0, 1).toUpperCase()}${currentTurnColor().slice(1)} king is in check` : "Kings are safe",
  };
}

function renderBoard() {
  const legalTargets = new Map(state.legalMoves.map((move) => [move.to, move]));
  const checkedKingSquare = isCheck() ? getKingSquare(state.game.turn()) : null;
  const rankOrder = state.orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const fileOrder = state.orientation === "white" ? FILES : [...FILES].reverse();
  let markup = "";

  for (const rank of rankOrder) {
    for (const file of fileOrder) {
      const square = `${file}${rank}`;
      const piece = getPieceAt(square);
      const legalMove = legalTargets.get(square);
      const isSelected = state.selectedSquare === square;
      const isLastMove = state.lastMove && (state.lastMove.from === square || state.lastMove.to === square);
      const isDraggedSquare = state.drag?.sourceSquare === square && state.drag.active;
      const toneClass = squareTone(square) === "light" ? "is-light" : "is-dark";

      const squareClasses = [
        "square",
        toneClass,
        isSelected ? "is-selected" : "",
        legalMove ? (legalMove.captured ? "is-legal-capture" : "is-legal") : "",
        isLastMove ? "is-last-move" : "",
        checkedKingSquare === square ? "is-check" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const isBottomEdge = state.orientation === "white" ? rank === 1 : rank === 8;
      const isLeftEdge = state.orientation === "white" ? file === "a" : file === "h";
      const fileLabel = isBottomEdge ? `data-file-label="${file}"` : "";
      const rankLabel = isLeftEdge ? `data-rank-label="${rank}"` : "";
      const pieceMarkup = piece
        ? `<img class="piece ${isDraggedSquare ? "is-hidden" : ""}" src="${PIECE_ASSETS[pieceKey(piece)]}" alt="" draggable="false" />`
        : "";

      markup += `<button class="${squareClasses}" data-square="${square}" ${fileLabel} ${rankLabel} aria-label="${square}">${pieceMarkup}</button>`;
    }
  }

  dom.board.innerHTML = markup;
}

function renderHistory() {
  const history = state.game.history({ verbose: true });
  if (!history.length) {
    dom.moveHistory.innerHTML = '<div class="empty-history">Moves will appear here as the game unfolds.</div>';
    return;
  }

  const rows = [];
  for (let index = 0; index < history.length; index += 2) {
    const whiteMove = history[index];
    const blackMove = history[index + 1];
    const isLatestWhite = index === history.length - 1;
    const isLatestBlack = index + 1 === history.length - 1;

    rows.push(`
      <div class="history-row">
        <span class="history-turn">${Math.floor(index / 2) + 1}.</span>
        <span class="history-move ${isLatestWhite ? "is-latest" : ""}">${whiteMove?.san || "..."}</span>
        <span class="history-move ${isLatestBlack ? "is-latest" : ""}">${blackMove?.san || "..."}</span>
      </div>
    `);
  }

  dom.moveHistory.innerHTML = rows.join("");
}

function computeCapturedPieces() {
  const counts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  for (let rank = 8; rank >= 1; rank -= 1) {
    for (const file of FILES) {
      const piece = getPieceAt(`${file}${rank}`);
      if (piece) {
        counts[piece.color][piece.type] += 1;
      }
    }
  }

  const capturedByWhite = [];
  const capturedByBlack = [];

  for (const type of PIECE_ORDER) {
    const blackMissing = STARTING_COUNTS[type] - counts.b[type];
    const whiteMissing = STARTING_COUNTS[type] - counts.w[type];

    for (let index = 0; index < blackMissing; index += 1) {
      capturedByWhite.push(`b${type}`);
    }

    for (let index = 0; index < whiteMissing; index += 1) {
      capturedByBlack.push(`w${type}`);
    }
  }

  return { capturedByWhite, capturedByBlack };
}

function renderCapturedPieces() {
  const { capturedByWhite, capturedByBlack } = computeCapturedPieces();
  dom.capturedByWhite.innerHTML = capturedByWhite.length
    ? capturedByWhite.map((piece) => `<img class="capture-piece" src="${PIECE_ASSETS[piece]}" alt="" />`).join("")
    : '<span class="empty-state">No captures yet</span>';
  dom.capturedByBlack.innerHTML = capturedByBlack.length
    ? capturedByBlack.map((piece) => `<img class="capture-piece" src="${PIECE_ASSETS[piece]}" alt="" />`).join("")
    : '<span class="empty-state">No captures yet</span>';
}

function renderStatus() {
  const summary = getStatusSummary();
  dom.turnPill.textContent = isRoomActive()
    ? currentTurnCode() === state.room.playerColor
      ? "Your turn"
      : "Friend's turn"
    : `${currentTurnColor().slice(0, 1).toUpperCase()}${currentTurnColor().slice(1)} to move`;
  dom.statusPill.textContent = summary.pill;
  dom.statusText.textContent = summary.text;
  dom.checkStateText.textContent = summary.check;
  dom.lastMoveText.textContent = state.lastMove
    ? `${state.lastMove.from} -> ${state.lastMove.to}`
    : "No move yet";
}

function renderPromotionOptions() {
  if (!state.pendingPromotion) {
    dom.promotionModal.hidden = true;
    return;
  }

  const color = state.pendingPromotion.color;
  dom.promotionOptions.innerHTML = ["q", "r", "b", "n"]
    .map(
      (piece) => `
        <button class="promotion-piece" type="button" data-piece="${piece}">
          <img src="${PIECE_ASSETS[`${color}${piece}`]}" alt="${piece}" />
        </button>
      `,
    )
    .join("");

  dom.promotionModal.hidden = false;
}

function render() {
  syncCelebrationState();
  updateButtonStates();
  updateApiBadge();
  updateGestureBadge();
  updatePlayerPanels();
  updateRoomPanel();
  updateInsightPanel();
  renderBoard();
  renderHistory();
  renderCapturedPieces();
  renderStatus();
  renderPromotionOptions();
  renderCelebration();
  dom.board.classList.toggle("is-busy", state.aiThinking);
  dom.board.classList.toggle("is-celebrating", state.celebration.visible);
}

function getSquareFromClientPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  return target?.closest(".square")?.dataset.square || null;
}

function clearSelection() {
  state.selectedSquare = null;
  state.legalMoves = [];
}

function setSelectedSquare(square) {
  const piece = getPieceAt(square);
  if (!piece || !isPieceMovable(piece)) {
    clearSelection();
    render();
    return;
  }

  state.selectedSquare = square;
  state.legalMoves = state.game.moves({ square, verbose: true });
  render();
}

function openPromotion(from, to, color) {
  state.pendingPromotion = { from, to, color };
  renderPromotionOptions();
}

function closePromotion() {
  state.pendingPromotion = null;
  renderPromotionOptions();
}

function shakeBoard() {
  dom.board.classList.remove("board-shake");
  window.requestAnimationFrame(() => {
    dom.board.classList.add("board-shake");
    window.setTimeout(() => dom.board.classList.remove("board-shake"), 280);
  });
}

function ensureAudioContext() {
  if (!state.soundEnabled) {
    return null;
  }
  if (!state.audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      return null;
    }
    state.audioContext = new Context();
  }
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => {});
  }
  return state.audioContext;
}

function playTone({ frequency, duration, type = "sine", volume = 0.045, delay = 0 }) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playMoveSound(move) {
  if (!state.soundEnabled) {
    return;
  }

  if (isCheckmate()) {
    playTone({ frequency: 196, duration: 0.14, type: "triangle", volume: 0.06 });
    playTone({ frequency: 262, duration: 0.18, type: "triangle", volume: 0.05, delay: 0.05 });
    return;
  }

  if (move.captured) {
    playTone({ frequency: 260, duration: 0.07, type: "square", volume: 0.045 });
    playTone({ frequency: 170, duration: 0.1, type: "triangle", volume: 0.03, delay: 0.035 });
    return;
  }

  if (isCheck()) {
    playTone({ frequency: 720, duration: 0.06, type: "triangle", volume: 0.04 });
    playTone({ frequency: 540, duration: 0.08, type: "sine", volume: 0.03, delay: 0.035 });
    return;
  }

  playTone({ frequency: 420, duration: 0.055, type: "sine", volume: 0.03 });
  playTone({ frequency: 520, duration: 0.045, type: "triangle", volume: 0.018, delay: 0.024 });
}

function playIllegalSound() {
  if (!state.soundEnabled) {
    return;
  }
  playTone({ frequency: 180, duration: 0.08, type: "sawtooth", volume: 0.03 });
}

function lastHistoryMove() {
  const history = state.game.history({ verbose: true });
  if (!history.length) {
    return null;
  }
  const latest = history[history.length - 1];
  return { from: latest.from, to: latest.to };
}

function maybeHandlePromotion(from, to) {
  const candidateMoves = state.game
    .moves({ square: from, verbose: true })
    .filter((move) => move.to === to);

  if (!candidateMoves.length) {
    return false;
  }

  if (candidateMoves.some((move) => move.promotion)) {
    openPromotion(from, to, state.game.turn());
    return true;
  }

  return false;
}

async function afterMove(move, { fromAI = false } = {}) {
  playMoveSound(move);
  render();

  if (isGameOver()) {
    state.aiThinking = false;
    state.interactionLocked = true;
    render();
    return;
  }

  if (isRoomActive()) {
    await pushRoomState();
    state.interactionLocked = false;
    render();
    return;
  }

  if (state.mode === "ai" && !fromAI && state.game.turn() === "b") {
    await requestAIMove();
    return;
  }

  state.aiThinking = false;
  state.interactionLocked = false;
  render();
}

function applyMove(moveInput, { fromAI = false, preserveRedo = false } = {}) {
  const move = state.game.move(moveInput);
  if (!move) {
    playIllegalSound();
    shakeBoard();
    return false;
  }

  if (!preserveRedo) {
    state.redoStack = [];
  }

  state.lastMove = { from: move.from, to: move.to };
  clearSelection();
  closePromotion();
  void afterMove(move, { fromAI });
  return true;
}

function tryMove(from, to, options = {}) {
  if (maybeHandlePromotion(from, to)) {
    return false;
  }

  return applyMove({ from, to, promotion: options.promotion }, options);
}

function moveScore(move) {
  let score = 0;
  if (move.captured) {
    score += PIECE_VALUES[move.captured] * 10 - PIECE_VALUES[move.piece];
  }
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] + 350;
  }
  if (move.san.includes("+")) {
    score += 280;
  }
  if (move.san.includes("#")) {
    score += 9000;
  }
  if (move.flags?.includes("k") || move.flags?.includes("q")) {
    score += 110;
  }
  return score;
}

function getFallbackAIMove() {
  const moves = state.game.moves({ verbose: true });
  if (!moves.length) {
    return null;
  }
  const ordered = [...moves].sort((left, right) => moveScore(right) - moveScore(left));
  const topBand = ordered.filter((move) => moveScore(move) === moveScore(ordered[0]));
  const chosen = topBand[Math.floor(Math.random() * topBand.length)];
  return `${chosen.from}${chosen.to}${chosen.promotion || ""}`;
}

async function fetchJson(path, options = {}, timeout = 2500) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function updateRoomUrl(roomCode = "") {
  const nextUrl = new URL(window.location.href);
  if (roomCode) {
    nextUrl.searchParams.set("room", roomCode);
  } else {
    nextUrl.searchParams.delete("room");
  }
  window.history.replaceState({}, "", nextUrl);
}

function stopRoomPolling() {
  if (state.room.pollingId) {
    window.clearInterval(state.room.pollingId);
    state.room.pollingId = null;
  }
}

function startRoomPolling() {
  stopRoomPolling();
  if (!isRoomActive()) {
    return;
  }

  state.room.pollingId = window.setInterval(() => {
    void fetchRoomSnapshot();
  }, 1800);
}

async function fetchRoomSnapshot() {
  if (!isRoomActive()) {
    return;
  }

  try {
    const snapshot = await fetchJson(`/api/rooms/${state.room.code}`, { method: "GET" }, 2500);
    state.room.hostName = snapshot.host_name;
    state.room.guestName = snapshot.guest_name || "";
    state.room.lastVersion = snapshot.version;

    const nextMoves = snapshot.moves || [];
    if (JSON.stringify(nextMoves) !== JSON.stringify(serializeMoves())) {
      hydrateGameFromMoves(nextMoves);
      render();
      if (nextMoves.length) {
        playTone({ frequency: 530, duration: 0.05, type: "triangle", volume: 0.024 });
      }
    }

    render();
  } catch (error) {
    if (String(error).includes("404")) {
      stopRoomPolling();
      state.room = {
        active: false,
        code: "",
        playerToken: "",
        playerColor: "w",
        hostName: "You",
        guestName: "",
        inviteUrl: "",
        pollingId: null,
        lastVersion: 0,
      };
      updateRoomUrl("");
      setOrientation("white");
      hideCelebration();
      setInviteFeedback("This room is no longer available. You are back on a local board.");
      render();
      return;
    }

    dom.syncStatusBadge.classList.remove("is-live", "is-waiting");
    dom.syncStatusBadge.classList.add("is-offline");
    dom.syncStatusBadge.textContent = "Sync offline";
    setInviteFeedback("Room service is temporarily unreachable. Your local board is still safe.");
  }
}

async function pushRoomState() {
  if (!isRoomActive()) {
    return;
  }

  try {
    const snapshot = await fetchJson(
      `/api/rooms/${state.room.code}/sync`,
      {
        method: "POST",
        body: JSON.stringify({
          player_token: state.room.playerToken,
          moves: serializeMoves(),
        }),
      },
      2500,
    );

    state.room.hostName = snapshot.host_name;
    state.room.guestName = snapshot.guest_name || "";
    state.room.lastVersion = snapshot.version;
    setInviteFeedback("Moves synced to the room.");
    render();
  } catch {
    setInviteFeedback("Move made locally, but room sync could not reach the server right now.");
  }
}

async function createRoom() {
  if (isRoomActive()) {
    await leaveRoom();
  }

  try {
    const session = await fetchJson(
      "/api/rooms/create",
      {
        method: "POST",
        body: JSON.stringify({ display_name: "You" }),
      },
      3000,
    );

    state.room.active = true;
    state.room.code = session.room_code;
    state.room.playerToken = session.player_token;
    state.room.playerColor = session.player_color;
    state.room.hostName = session.host_name;
    state.room.guestName = session.guest_name || "";
    state.room.inviteUrl = buildInviteUrl(session.room_code);
    state.room.lastVersion = session.version;
    state.mode = "human";
    setOrientation("white");
    resetGame(true);
    updateRoomUrl(session.room_code);
    startRoomPolling();
    await pushRoomState();
    setInviteFeedback("Invite room created. Copy or share the link with your friend.");
    playTone({ frequency: 680, duration: 0.05, type: "triangle", volume: 0.03 });
    render();
  } catch {
    setInviteFeedback("Could not create a room. Make sure the FastAPI backend is running.");
  }
}

async function joinRoom(roomCode) {
  if (isRoomActive()) {
    await leaveRoom();
  }

  try {
    const session = await fetchJson(
      "/api/rooms/join",
      {
        method: "POST",
        body: JSON.stringify({
          room_code: roomCode,
          display_name: "Friend",
        }),
      },
      3000,
    );

    state.room.active = true;
    state.room.code = session.room_code;
    state.room.playerToken = session.player_token;
    state.room.playerColor = session.player_color;
    state.room.hostName = session.host_name;
    state.room.guestName = session.guest_name || "Friend";
    state.room.inviteUrl = buildInviteUrl(session.room_code);
    state.room.lastVersion = session.version;
    state.mode = "human";
    setOrientation("black");
    resetGame(true);
    updateRoomUrl(session.room_code);
    startRoomPolling();
    await fetchRoomSnapshot();
    setInviteFeedback("Joined the challenge room. You are playing black.");
    playTone({ frequency: 580, duration: 0.06, type: "triangle", volume: 0.03 });
    render();
  } catch {
    setInviteFeedback("Could not join that room. Check the code or confirm the room still exists.");
  }
}

async function leaveRoom() {
  if (!isRoomActive()) {
    return;
  }

  try {
    await fetchJson(
      `/api/rooms/${state.room.code}/leave`,
      {
        method: "POST",
        body: JSON.stringify({ player_token: state.room.playerToken }),
      },
      2500,
    );
  } catch {
    // Keep leaving locally even if the server is gone.
  }

  stopRoomPolling();
  state.room = {
    active: false,
    code: "",
    playerToken: "",
    playerColor: "w",
    hostName: "You",
    guestName: "",
    inviteUrl: "",
    pollingId: null,
    lastVersion: 0,
  };
  updateRoomUrl("");
  setOrientation("white");
  hideCelebration();
  setInviteFeedback("Left the room. You are back on a local board.");
  playTone({ frequency: 320, duration: 0.05, type: "sine", volume: 0.024 });
  render();
}

async function copyInviteLink() {
  if (!isRoomActive()) {
    setInviteFeedback("Create a room first to copy an invite link.");
    return;
  }

  const inviteUrl = state.room.inviteUrl || buildInviteUrl();
  try {
    await navigator.clipboard.writeText(inviteUrl);
    setInviteFeedback("Invite link copied. Send it to your friend.");
    playTone({ frequency: 640, duration: 0.04, type: "triangle", volume: 0.03 });
  } catch {
    setInviteFeedback(inviteUrl);
  }
}

async function shareInviteLink() {
  if (!isRoomActive()) {
    setInviteFeedback("Create a room first to share an invite.");
    return;
  }

  const inviteUrl = state.room.inviteUrl || buildInviteUrl();
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Join my chess room",
        text: `Play chess with me in room ${state.room.code}.`,
        url: inviteUrl,
      });
      setInviteFeedback("Invite shared.");
      return;
    } catch {
      // Fall back to copy.
    }
  }

  await copyInviteLink();
}

async function refreshApiStatus() {
  try {
    await fetchJson("/api/health", { method: "GET" }, 1800);
    state.apiStatus = "online";
  } catch {
    state.apiStatus = "offline";
  }
  render();
}

async function requestAIMove() {
  const requestId = ++state.aiRequestId;
  state.aiThinking = true;
  state.interactionLocked = true;
  setEngineInsight({
    source: state.apiStatus === "online" ? "Minimax" : "Engine",
    note: "The engine is searching candidate moves and balancing material against activity.",
  });
  render();

  let uciMove = null;

  try {
    const payload = await fetchJson(
      "/api/best-move",
      {
        method: "POST",
        body: JSON.stringify({
          fen: state.game.fen(),
          depth: state.aiDepth,
        }),
      },
      state.aiDepth === 4 ? 6000 : 3500,
    );
    uciMove = payload.best_move;
    state.apiStatus = "online";
    setEngineInsight({
      evaluation: payload.evaluation,
      source: payload.source === "minimax-alpha-beta" ? "Minimax" : payload.source,
      note: payload.is_checkmate
        ? `Forced mate found with ${payload.san}.`
        : `Best response ${payload.san} selected at depth ${payload.depth}.`,
    });
  } catch {
    state.apiStatus = "fallback";
    uciMove = getFallbackAIMove();
    setEngineInsight({
      source: "Fallback",
      note: "Using the lightweight local move picker because the backend engine is unavailable.",
    });
  }

  if (!uciMove) {
    state.aiThinking = false;
    state.interactionLocked = false;
    render();
    return;
  }

  window.setTimeout(() => {
    if (requestId !== state.aiRequestId || state.mode !== "ai" || state.game.turn() !== "b") {
      return;
    }
    applyMove(
      {
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: uciMove[4],
      },
      { fromAI: true },
    );
  }, 180);
}

function handleBoardClick(event) {
  if (performance.now() < state.suppressClickUntil || state.pendingPromotion) {
    return;
  }

  const square = event.target.closest(".square")?.dataset.square;
  if (!square || !humanCanInteract()) {
    return;
  }

  const piece = getPieceAt(square);
  const selectedMove = state.legalMoves.find((move) => move.to === square);

  if (state.selectedSquare && selectedMove) {
    tryMove(state.selectedSquare, square);
    return;
  }

  if (piece && isPieceMovable(piece)) {
    setSelectedSquare(square);
    return;
  }

  clearSelection();
  render();
}

function updateGhost(clientX, clientY) {
  dom.dragGhost.style.left = `${clientX}px`;
  dom.dragGhost.style.top = `${clientY}px`;
}

function startDrag(sourceSquare, clientX, clientY, mode = "pointer") {
  const piece = getPieceAt(sourceSquare);
  if (!piece || !isPieceMovable(piece)) {
    return;
  }

  state.drag = {
    sourceSquare,
    pieceKey: pieceKey(piece),
    active: true,
    mode,
  };

  dom.dragGhost.innerHTML = `<img src="${PIECE_ASSETS[pieceKey(piece)]}" alt="" />`;
  dom.dragGhost.classList.add("is-visible");
  updateGhost(clientX, clientY);
  setSelectedSquare(sourceSquare);
}

function finishDrag(targetSquare) {
  if (!state.drag) {
    return;
  }

  const sourceSquare = state.drag.sourceSquare;
  dom.dragGhost.classList.remove("is-visible");
  dom.dragGhost.innerHTML = "";
  state.drag = null;

  if (!targetSquare) {
    render();
    return;
  }

  if (sourceSquare === targetSquare) {
    setSelectedSquare(sourceSquare);
    return;
  }

  const success = tryMove(sourceSquare, targetSquare);
  if (!success) {
    render();
  }
}

function handlePointerDown(event) {
  if (!humanCanInteract() || state.pendingPromotion) {
    return;
  }

  const square = event.target.closest(".square")?.dataset.square;
  if (!square) {
    return;
  }

  const piece = getPieceAt(square);
  if (!piece || !isPieceMovable(piece)) {
    return;
  }

  event.preventDefault();
  startDrag(square, event.clientX, event.clientY, "pointer");
}

function handlePointerMove(event) {
  if (!state.drag || state.drag.mode !== "pointer") {
    return;
  }
  updateGhost(event.clientX, event.clientY);
}

function handlePointerUp(event) {
  if (!state.drag || state.drag.mode !== "pointer") {
    return;
  }

  const targetSquare = getSquareFromClientPoint(event.clientX, event.clientY);
  state.suppressClickUntil = performance.now() + 120;
  finishDrag(targetSquare);
}

function resetGame(force = false) {
  if (isRoomActive() && !force) {
    setInviteFeedback("Restart is disabled during a live room so both boards stay in sync.");
    return;
  }

  state.aiRequestId += 1;
  state.game = new Chess();
  state.lastMove = null;
  state.redoStack = [];
  state.aiThinking = false;
  state.interactionLocked = false;
  state.celebration.dismissedKey = "";
  setEngineInsight({
    evaluation: 0,
    source: "Minimax",
    note: "Balanced starting position. Open with control of the center.",
  });
  hideCelebration();
  clearSelection();
  closePromotion();
  render();
}

function undoMove() {
  if (state.aiThinking || state.pendingPromotion) {
    return;
  }

  if (isRoomActive()) {
    setInviteFeedback("Undo is disabled during a live room to avoid desync.");
    return;
  }

  state.aiRequestId += 1;
  const movesToUndo =
    state.mode === "ai" && state.game.turn() === "w" && state.game.history().length >= 2 ? 2 : 1;

  let undone = 0;
  while (undone < movesToUndo) {
    const move = state.game.undo();
    if (!move) {
      break;
    }
    state.redoStack.push({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
    undone += 1;
  }

  state.lastMove = lastHistoryMove();
  clearSelection();
  state.interactionLocked = false;
  state.aiThinking = false;
  render();
}

function redoMove() {
  if (state.aiThinking || state.pendingPromotion || !state.redoStack.length) {
    return;
  }

  if (isRoomActive()) {
    setInviteFeedback("Redo is disabled during a live room to avoid desync.");
    return;
  }

  state.aiRequestId += 1;
  const movesToRedo = state.mode === "ai" ? Math.min(2, state.redoStack.length) : 1;
  let applied = 0;

  while (applied < movesToRedo && state.redoStack.length) {
    const move = state.redoStack.pop();
    const result = state.game.move(move);
    if (!result) {
      break;
    }
    state.lastMove = { from: result.from, to: result.to };
    applied += 1;
  }

  clearSelection();
  render();
}

function toggleMode(mode) {
  state.aiRequestId += 1;
  state.mode = "ai";
  state.aiThinking = false;
  state.interactionLocked = false;
  setEngineInsight({
    evaluation: 0,
    source: "Minimax",
    note: "Human vs AI is active. The engine will respond after black's turn.",
  });
  savePreferences();
  render();

  if (!isGameOver() && state.game.turn() === "b") {
    void requestAIMove();
  }
}

function bindPromotionEvents() {
  dom.promotionOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-piece]");
    if (!button || !state.pendingPromotion) {
      return;
    }

    const promotion = button.dataset.piece;
    const { from, to } = state.pendingPromotion;
    applyMove({ from, to, promotion });
  });

  dom.promotionCancel.addEventListener("click", () => {
    closePromotion();
    render();
  });
}

function bindControls() {
  dom.modeHuman?.addEventListener("click", () => toggleMode("ai"));
  dom.modeAI?.addEventListener("click", () => toggleMode("ai"));
  dom.difficultySelect.addEventListener("change", (event) => {
    state.aiDepth = Number(event.target.value);
    savePreferences();
    render();
  });
  dom.undoBtn.addEventListener("click", undoMove);
  dom.redoBtn.addEventListener("click", redoMove);
  dom.restartBtn.addEventListener("click", resetGame);
  dom.themeToggle.addEventListener("click", () => {
    setTheme(state.theme === "dark" ? "light" : "dark");
    savePreferences();
    render();
  });
  dom.soundToggle.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    savePreferences();
    render();
  });
  dom.gestureToggle.addEventListener("click", () => {
    void toggleGestureMode();
  });
  dom.perspectiveToggle?.addEventListener("click", () => {
    setOrientation(state.orientation === "white" ? "black" : "white");
    render();
  });
  dom.createRoomBtn?.addEventListener("click", () => {
    void createRoom();
  });
  dom.copyInviteBtn?.addEventListener("click", () => {
    void copyInviteLink();
  });
  dom.shareInviteBtn?.addEventListener("click", () => {
    void shareInviteLink();
  });
  dom.leaveRoomBtn?.addEventListener("click", () => {
    void leaveRoom();
  });
  dom.joinRoomBtn?.addEventListener("click", () => {
    const roomCode = dom.joinRoomInput.value.trim().toUpperCase();
    if (!roomCode) {
      setInviteFeedback("Enter a room code first.");
      return;
    }
    void joinRoom(roomCode);
  });
  dom.joinRoomInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      dom.joinRoomBtn.click();
    }
  });
  dom.celebrationRestart?.addEventListener("click", () => {
    hideCelebration({ dismiss: true });
    resetGame();
  });
  dom.celebrationClose?.addEventListener("click", () => {
    hideCelebration({ dismiss: true });
    render();
  });
  dom.celebrationOverlay?.addEventListener("click", (event) => {
    if (event.target === dom.celebrationOverlay) {
      hideCelebration({ dismiss: true });
      render();
    }
  });
}

function bindBoard() {
  dom.board.addEventListener("click", handleBoardClick);
  dom.board.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);
}

async function toggleGestureMode() {
  if (state.gesture.enabled) {
    stopGestureMode();
    return;
  }

  try {
    await initGestureMode();
    state.gesture.enabled = true;
    state.gesture.denied = false;
  } catch {
    state.gesture.enabled = false;
    state.gesture.denied = true;
    dom.gestureStateText.textContent = "Camera permission blocked";
  }

  render();
}

function stopGestureMode() {
  state.gesture.enabled = false;
  state.gesture.ready = false;
  state.gesture.pinching = false;
  state.gesture.hoverSquare = null;
  dom.gestureCursor.classList.remove("is-visible");
  dom.gestureStateText.textContent = "Camera idle";
  dom.gestureSquareText.textContent = "No square targeted";

  if (state.gesture.camera?.stop) {
    state.gesture.camera.stop();
  }

  if (state.gesture.stream) {
    for (const track of state.gesture.stream.getTracks()) {
      track.stop();
    }
    state.gesture.stream = null;
  }

  if (state.drag?.mode === "gesture") {
    finishDrag(state.gesture.hoverSquare);
  }

  render();
}

async function initGestureMode() {
  if (!navigator.mediaDevices?.getUserMedia || !window.Hands || !window.Camera) {
    throw new Error("MediaPipe unavailable");
  }

  if (!state.gesture.hands) {
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.6,
    });

    hands.onResults(handleGestureResults);
    state.gesture.hands = hands;
  }

  if (!state.gesture.stream) {
    state.gesture.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
    });
    dom.gestureVideo.srcObject = state.gesture.stream;
    await dom.gestureVideo.play();
  }

  if (state.gesture.camera?.stop) {
    state.gesture.camera.stop();
  }

  state.gesture.camera = new window.Camera(dom.gestureVideo, {
    onFrame: async () => {
      if (state.gesture.enabled || !state.gesture.ready) {
        await state.gesture.hands.send({ image: dom.gestureVideo });
      }
    },
    width: 640,
    height: 480,
  });

  state.gesture.enabled = true;
  state.gesture.ready = true;
  dom.gestureStateText.textContent = "Tracking hand landmarks";
  await state.gesture.camera.start();
}

function handleGestureResults(results) {
  if (!state.gesture.enabled) {
    return;
  }

  const landmarks = results.multiHandLandmarks?.[0];
  if (!landmarks) {
    dom.gestureStateText.textContent = "Searching for hand";
    dom.gestureSquareText.textContent = "No square targeted";
    dom.gestureCursor.classList.remove("is-visible");
    return;
  }

  const thumb = landmarks[4];
  const indexTip = landmarks[8];
  const pinchDistance = Math.hypot(indexTip.x - thumb.x, indexTip.y - thumb.y);
  const pinching = pinchDistance < 0.045;
  const boardRect = dom.board.getBoundingClientRect();
  const clientX = boardRect.left + (1 - indexTip.x) * boardRect.width;
  const clientY = boardRect.top + indexTip.y * boardRect.height;
  const hoverSquare = getSquareFromClientPoint(clientX, clientY);

  state.gesture.pointerX = clientX;
  state.gesture.pointerY = clientY;
  state.gesture.hoverSquare = hoverSquare;

  dom.gestureCursor.classList.add("is-visible");
  dom.gestureCursor.style.left = `${clientX}px`;
  dom.gestureCursor.style.top = `${clientY}px`;
  dom.gestureSquareText.textContent = hoverSquare ? `Tracking ${hoverSquare}` : "Move over the board";
  dom.gestureStateText.textContent = pinching ? "Pinch detected" : "Hand tracked";

  if (!humanCanInteract()) {
    state.gesture.pinching = pinching;
    return;
  }

  if (pinching && !state.gesture.pinching && hoverSquare) {
    const piece = getPieceAt(hoverSquare);
    if (piece && isPieceMovable(piece)) {
      startDrag(hoverSquare, clientX, clientY, "gesture");
    }
  }

  if (pinching && state.drag?.mode === "gesture") {
    updateGhost(clientX, clientY);
  }

  if (!pinching && state.gesture.pinching && state.drag?.mode === "gesture") {
    finishDrag(hoverSquare);
  }

  state.gesture.pinching = pinching;
}

function init() {
  loadPreferences();
  state.mode = "ai";
  setTheme(state.theme);
  setOrientation(state.orientation, { save: false });
  bindControls();
  bindPromotionEvents();
  bindBoard();
  clearSelection();
  setEngineInsight({
    evaluation: 0,
    source: "Minimax",
    note: "Balanced starting position. Open with control of the center.",
  });
  render();
  void refreshApiStatus();
}

init();
