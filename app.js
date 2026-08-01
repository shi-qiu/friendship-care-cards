const defaultCards = [
  {
    id: "rest-and-reset",
    message: "宝宝交给我两个小时。你可以补觉、洗个澡，或者什么都不做。",
    giver: "小雅",
    redeemed: false,
  },
  {
    id: "dinner-drop",
    message: "晚饭交给我。你挑个晚上，我带着热乎乎的饭菜来。",
    giver: "诺拉",
    redeemed: false,
  },
  {
    id: "laundry-magic",
    message: "把那堆衣服交给我吧，我来洗、叠好，再帮你收起来。",
    giver: "佳怡",
    redeemed: false,
  },
  {
    id: "quiet-company",
    message: "我来陪你坐一会儿。不用招待、不用收拾，也不用勉强聊天。",
    giver: "莉娅",
    redeemed: false,
  },
  {
    id: "tiny-errands",
    message: "把超市和药房的清单发给我，外面的跑腿都交给我。",
    giver: "佩雅",
    redeemed: false,
  },
  {
    id: "morning-rescue",
    message: "找个早晨，我带着咖啡、早餐，还有一双能帮忙的手来找你。",
    giver: "苏菲",
    redeemed: false,
  },
  {
    id: "fresh-air",
    message: "我们一起慢慢散个步吧。我来推婴儿车，也会带好零食。",
    giver: "艾薇",
    redeemed: false,
  },
  {
    id: "kitchen-reset",
    message: "你安心抱宝宝，或者什么都不做；我来把厨房收拾清爽。",
    giver: "艾琳",
    redeemed: false,
  },
];

const LEGACY_STORAGE_KEY = "friend-cards-redeemed-v1";
const CARDS_STORAGE_KEY = "friend-cards-device-deck-v2";
const animationDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ? 0
  : 560;

const deckView = document.querySelector("#deck-view");
const revealView = document.querySelector("#reveal-view");
const completeView = document.querySelector("#complete-view");
const count = document.querySelector("#count");
const drawButton = document.querySelector("#draw-button");
const redeemButton = document.querySelector("#redeem-button");
const anotherButton = document.querySelector("#another-button");
const careCard = document.querySelector("#care-card");
const cardMessage = document.querySelector("#card-message");
const cardGiver = document.querySelector("#card-giver");
const confirmation = document.querySelector("#confirmation");
const redeemedSection = document.querySelector("#redeemed-section");
const redeemedDetails = document.querySelector("#redeemed-details");
const redeemedCount = document.querySelector("#redeemed-count");
const redeemedList = document.querySelector("#redeemed-list");
const manageButton = document.querySelector("#manage-button");
const managerDialog = document.querySelector("#manager-dialog");
const managerClose = document.querySelector("#manager-close");
const cardForm = document.querySelector("#card-form");
const editingCardId = document.querySelector("#editing-card-id");
const managerMessage = document.querySelector("#manager-message");
const managerGiver = document.querySelector("#manager-giver");
const saveCardButton = document.querySelector("#save-card-button");
const cancelEditButton = document.querySelector("#cancel-edit-button");
const managerStatus = document.querySelector("#manager-status");
const managerCardCount = document.querySelector("#manager-card-count");
const managerList = document.querySelector("#manager-list");

let cards = defaultCards.map((card) => ({ ...card }));
let currentCard = null;
let isAnimating = false;
let confirmationTimer;

function isValidStoredCard(card) {
  return (
    card &&
    typeof card.id === "string" &&
    typeof card.message === "string" &&
    card.message.trim() &&
    typeof card.giver === "string" &&
    card.giver.trim() &&
    typeof card.redeemed === "boolean"
  );
}

function loadCards() {
  try {
    const savedCards = JSON.parse(localStorage.getItem(CARDS_STORAGE_KEY) || "null");
    if (Array.isArray(savedCards) && savedCards.length && savedCards.every(isValidStoredCard)) {
      cards = savedCards.map((card) => ({
        id: card.id,
        message: card.message.trim().slice(0, 180),
        giver: card.giver.trim().slice(0, 40),
        redeemed: card.redeemed,
      }));
      return;
    }

    const legacyRedeemed = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
    if (!Array.isArray(legacyRedeemed)) return;

    const savedIds = new Set(legacyRedeemed.filter((id) => typeof id === "string"));
    cards.forEach((card) => {
      card.redeemed = savedIds.has(card.id);
    });
  } catch {
    // The deck remains usable when storage is unavailable or malformed.
  }
}

function saveCards() {
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // In restricted browsing modes, state simply lasts for this visit.
  }
}

function availableCards(excludeId) {
  return cards.filter((card) => !card.redeemed && card.id !== excludeId);
}

function randomCard(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateCount() {
  const remaining = availableCards().length;
  count.textContent = `${remaining} ${remaining === 1 ? "gift" : "gifts"} waiting for you`;
}

function renderRedeemedDeck() {
  const redeemedCards = cards.filter((card) => card.redeemed);
  redeemedSection.hidden = redeemedCards.length === 0;
  redeemedCount.textContent = redeemedCards.length;
  redeemedCount.setAttribute(
    "aria-label",
    `${redeemedCards.length} redeemed ${redeemedCards.length === 1 ? "gift" : "gifts"}`,
  );
  redeemedList.replaceChildren();

  redeemedCards.forEach((card) => {
    const item = document.createElement("article");
    item.className = "redeemed-card";

    const message = document.createElement("p");
    message.className = "redeemed-message";
    message.textContent = card.message;

    const giver = document.createElement("p");
    giver.className = "redeemed-giver";
    giver.textContent = `来自 ${card.giver} 的心意`;

    item.append(message, giver);
    redeemedList.append(item);
  });
}

function renderManagerCards() {
  managerCardCount.textContent = `${cards.length} ${cards.length === 1 ? "card" : "cards"}`;
  managerList.replaceChildren();

  cards.forEach((card) => {
    const item = document.createElement("article");
    item.className = "manager-card";

    const copy = document.createElement("div");
    copy.className = "manager-card-copy";

    const message = document.createElement("p");
    message.className = "manager-card-message";
    message.textContent = card.message;

    const meta = document.createElement("p");
    meta.className = "manager-card-meta";
    meta.append(`来自 ${card.giver}`);
    if (card.redeemed) {
      const status = document.createElement("span");
      status.className = "is-redeemed";
      status.textContent = " · Redeemed";
      meta.append(status);
    }

    const editButton = document.createElement("button");
    editButton.className = "edit-card-button";
    editButton.type = "button";
    editButton.dataset.cardId = card.id;
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit card from ${card.giver}`);

    const actions = document.createElement("div");
    actions.className = "manager-card-actions";
    actions.append(editButton);

    if (card.id.startsWith("custom-")) {
      const removeButton = document.createElement("button");
      removeButton.className = "remove-card-button";
      removeButton.type = "button";
      removeButton.dataset.cardId = card.id;
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", `Remove card from ${card.giver}`);
      actions.append(removeButton);
    }

    copy.append(message, meta);
    item.append(copy, actions);
    managerList.append(item);
  });
}

function resetCardForm() {
  cardForm.reset();
  editingCardId.value = "";
  saveCardButton.textContent = "Add to the deck";
  cancelEditButton.hidden = true;
}

function refreshDeckAfterCardChange() {
  updateCount();
  renderRedeemedDeck();
  renderManagerCards();

  if (currentCard) {
    const refreshedCurrentCard = cards.find((card) => card.id === currentCard.id);
    if (refreshedCurrentCard) {
      currentCard = refreshedCurrentCard;
      cardMessage.textContent = currentCard.message;
      cardGiver.textContent = currentCard.giver;
    }
  }

  if (!availableCards().length) {
    showCompletion();
  } else if (!revealView.hidden && currentCard) {
    showView(revealView);
  } else {
    showView(deckView);
  }
}

function showView(view) {
  [deckView, revealView, completeView].forEach((item) => {
    item.hidden = item !== view;
  });
}

function setActionState(disabled) {
  drawButton.disabled = disabled;
  redeemButton.disabled = disabled;
  anotherButton.disabled = disabled;
}

function revealCard(excludeId) {
  if (isAnimating) return;

  let pool = availableCards(excludeId);
  if (pool.length === 0) pool = availableCards();

  if (pool.length === 0) {
    showCompletion();
    return;
  }

  isAnimating = true;
  setActionState(true);
  currentCard = randomCard(pool);
  cardMessage.textContent = currentCard.message;
  cardGiver.textContent = currentCard.giver;
  showView(revealView);
  careCard.classList.remove("is-revealing");
  void careCard.offsetWidth;
  careCard.classList.add("is-revealing");

  window.setTimeout(() => {
    isAnimating = false;
    setActionState(false);
    careCard.focus({ preventScroll: true });
  }, animationDuration);
}

function showDeck() {
  currentCard = null;
  showView(deckView);
  updateCount();
  drawButton.focus({ preventScroll: true });
}

function showCompletion() {
  currentCard = null;
  count.textContent = "Every gift has been received";
  showView(completeView);
  completeView.querySelector("h2").focus({ preventScroll: true });
}

function showConfirmation() {
  window.clearTimeout(confirmationTimer);
  confirmation.hidden = false;
  confirmationTimer = window.setTimeout(() => {
    confirmation.hidden = true;
  }, 2800);
}

drawButton.addEventListener("click", () => revealCard());

anotherButton.addEventListener("click", () => {
  if (isAnimating || !currentCard) return;
  revealCard(currentCard.id);
});

redeemButton.addEventListener("click", () => {
  if (isAnimating || !currentCard) return;
  currentCard.redeemed = true;
  saveCards();
  updateCount();
  renderRedeemedDeck();
  redeemedDetails.open = true;
  showConfirmation();

  if (availableCards().length === 0) {
    showCompletion();
  } else {
    showDeck();
  }
});

manageButton.addEventListener("click", () => {
  managerStatus.textContent = "";
  renderManagerCards();
  managerDialog.showModal();
});

managerClose.addEventListener("click", () => {
  managerDialog.close();
});

cancelEditButton.addEventListener("click", () => {
  resetCardForm();
  managerStatus.textContent = "Edit cancelled.";
  managerMessage.focus();
});

managerList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-card-button");
  if (removeButton) {
    cards = cards.filter((card) => card.id !== removeButton.dataset.cardId);
    if (editingCardId.value === removeButton.dataset.cardId) resetCardForm();
    saveCards();
    refreshDeckAfterCardChange();
    managerStatus.textContent = "Card removed from this device.";
    return;
  }

  const editButton = event.target.closest(".edit-card-button");
  if (!editButton) return;

  const card = cards.find((item) => item.id === editButton.dataset.cardId);
  if (!card) return;

  editingCardId.value = card.id;
  managerMessage.value = card.message;
  managerGiver.value = card.giver;
  saveCardButton.textContent = "Save changes";
  cancelEditButton.hidden = false;
  managerStatus.textContent = `Editing ${card.giver}’s card.`;
  managerMessage.focus();
  managerMessage.scrollIntoView({ behavior: "smooth", block: "center" });
});

cardForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = managerMessage.value.trim();
  const giver = managerGiver.value.trim();
  if (!message || !giver) return;

  const cardId = editingCardId.value;
  if (cardId) {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;
    card.message = message;
    card.giver = giver;
    managerStatus.textContent = "Card updated on this device.";
  } else {
    cards.push({
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      giver,
      redeemed: false,
    });
    managerStatus.textContent = "New card added to this device.";
  }

  saveCards();
  resetCardForm();
  refreshDeckAfterCardChange();
  managerMessage.focus();
});

loadCards();
updateCount();
renderRedeemedDeck();
renderManagerCards();

if (availableCards().length === 0) {
  showCompletion();
}
