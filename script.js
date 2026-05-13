const body = document.body;
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");

function setHeaderState() {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

menuToggle.addEventListener("click", () => {
  const isOpen = body.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

function setupHorizontalCarousel({
  rootSelector,
  viewportSelector,
  cardSelector,
  previousSelector,
  nextSelector,
  dotsSelector,
  dotLabel,
  interval = 4200,
}) {
  const carousel = document.querySelector(rootSelector);

  if (!carousel) {
    return;
  }

  const viewport = carousel.querySelector(viewportSelector);
  const cards = Array.from(carousel.querySelectorAll(cardSelector));
  const previousButton = carousel.querySelector(previousSelector);
  const nextButton = carousel.querySelector(nextSelector);
  const dotsContainer = carousel.querySelector(dotsSelector);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!viewport || !cards.length || !previousButton || !nextButton || !dotsContainer) {
    return;
  }

  let activeIndex = 0;
  let autoPlayTimer;
  let resumeTimer;
  let scrollTimer;

  const dots = cards.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `${dotLabel} ${index + 1}`);
    dot.addEventListener("click", () => {
      pauseThenResume();
      scrollToCard(index);
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  function updateDots() {
    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function getCenteredScrollLeft(index) {
    const card = cards[index];
    return card.offsetLeft - (viewport.clientWidth - card.clientWidth) / 2;
  }

  function getClosestIndex() {
    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;

    return cards.reduce((closestIndex, card, index) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const closestCard = cards[closestIndex];
      const closestCenter = closestCard.offsetLeft + closestCard.clientWidth / 2;

      return Math.abs(cardCenter - viewportCenter) < Math.abs(closestCenter - viewportCenter)
        ? index
        : closestIndex;
    }, 0);
  }

  function scrollToCard(index, behavior = "smooth") {
    activeIndex = (index + cards.length) % cards.length;
    viewport.scrollTo({
      left: Math.max(0, getCenteredScrollLeft(activeIndex)),
      behavior,
    });
    updateDots();
  }

  function stopAutoPlay() {
    window.clearInterval(autoPlayTimer);
  }

  function startAutoPlay() {
    if (prefersReducedMotion || cards.length < 2) {
      return;
    }

    stopAutoPlay();
    autoPlayTimer = window.setInterval(() => {
      scrollToCard(getClosestIndex() + 1);
    }, interval);
  }

  function pauseThenResume() {
    stopAutoPlay();
    window.clearTimeout(resumeTimer);

    if (!prefersReducedMotion) {
      resumeTimer = window.setTimeout(startAutoPlay, 7000);
    }
  }

  previousButton.addEventListener("click", () => {
    pauseThenResume();
    scrollToCard(getClosestIndex() - 1);
  });

  nextButton.addEventListener("click", () => {
    pauseThenResume();
    scrollToCard(getClosestIndex() + 1);
  });

  viewport.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        activeIndex = getClosestIndex();
        updateDots();
      }, 80);
    },
    { passive: true }
  );

  viewport.addEventListener("mouseenter", stopAutoPlay);
  viewport.addEventListener("mouseleave", startAutoPlay);
  viewport.addEventListener("focusin", stopAutoPlay);
  viewport.addEventListener("focusout", startAutoPlay);
  viewport.addEventListener("touchstart", pauseThenResume, { passive: true });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      pauseThenResume();
      scrollToCard(getClosestIndex() - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      pauseThenResume();
      scrollToCard(getClosestIndex() + 1);
    }
  });

  updateDots();
  window.requestAnimationFrame(() => scrollToCard(0, "auto"));
  startAutoPlay();
}

setupHorizontalCarousel({
  rootSelector: "[data-results-carousel]",
  viewportSelector: "[data-results-viewport]",
  cardSelector: ".result-card",
  previousSelector: "[data-results-prev]",
  nextSelector: "[data-results-next]",
  dotsSelector: "[data-results-dots]",
  dotLabel: "Ver resultado",
});

setupHorizontalCarousel({
  rootSelector: "[data-testimonials-carousel]",
  viewportSelector: "[data-testimonials-viewport]",
  cardSelector: ".testimonial-card",
  previousSelector: "[data-testimonials-prev]",
  nextSelector: "[data-testimonials-next]",
  dotsSelector: "[data-testimonials-dots]",
  dotLabel: "Ver feedback",
  interval: 4800,
});
