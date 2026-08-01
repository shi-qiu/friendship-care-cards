const cards = [
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

const STORAGE_KEY = "friend-cards-redeemed-v1";
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

let currentCard = null;
let isAnimating = false;
let confirmationTimer;

function loadRedeemedCards() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return;

    const savedIds = new Set(saved.filter((id) => typeof id === "string"));
    cards.forEach((card) => {
      card.redeemed = savedIds.has(card.id);
    });
  } catch {
    // The deck remains usable when storage is unavailable or malformed.
  }
}

function saveRedeemedCards() {
  try {
    const redeemedIds = cards.filter((card) => card.redeemed).map((card) => card.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(redeemedIds));
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
  saveRedeemedCards();
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

loadRedeemedCards();
updateCount();
renderRedeemedDeck();

if (availableCards().length === 0) {
  showCompletion();
}
