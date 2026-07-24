document.documentElement.classList.add("is-ready");

const body = document.body;
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");

function setHeaderState() {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", window.scrollY > 20);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if (menuToggle && nav) {
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
}

function setupMobileStickyCta() {
  const triggerSections = Array.from(document.querySelectorAll("#planos, #cta-final"));
  const stickyCta = document.querySelector(".mobile-sticky-cta");

  if (!triggerSections.length || !stickyCta) {
    return;
  }

  function setStickyState(isVisible) {
    body.classList.toggle("show-mobile-cta", isVisible);
  }

  if ("IntersectionObserver" in window) {
    const visibleSections = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.04) {
            visibleSections.add(entry.target);
            return;
          }

          visibleSections.delete(entry.target);
        });

        setStickyState(visibleSections.size > 0);
      },
      {
        rootMargin: "-16% 0px -24% 0px",
        threshold: [0, 0.04, 0.18],
      }
    );

    triggerSections.forEach((section) => observer.observe(section));
    return;
  }

  function updateFromScroll() {
    const viewportMiddle = window.scrollY + window.innerHeight * 0.58;
    const isInsideDecisionArea = triggerSections.some((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;

      return viewportMiddle >= top && viewportMiddle <= bottom;
    });

    setStickyState(isInsideDecisionArea);
  }

  updateFromScroll();
  window.addEventListener("scroll", updateFromScroll, { passive: true });
}

function setupDiagnostic() {
  const diagnostic = document.querySelector("[data-diagnostic]");

  if (!diagnostic) {
    return;
  }

  const quiz = diagnostic.querySelector("[data-diagnostic-quiz]");
  const result = diagnostic.querySelector("[data-diagnostic-result]");
  const progress = diagnostic.querySelector("[data-diagnostic-progress]");
  const step = diagnostic.querySelector("[data-diagnostic-step]");
  const icon = diagnostic.querySelector("[data-diagnostic-icon]");
  const question = diagnostic.querySelector("[data-diagnostic-question]");
  const options = diagnostic.querySelector("[data-diagnostic-options]");
  const reset = diagnostic.querySelector("[data-diagnostic-reset]");

  if (!quiz || !result || !progress || !step || !icon || !question || !options || !reset) {
    return;
  }

  const questions = [
    {
      icon: "💭",
      text: "Quando você pensa no seu corpo hoje, o que mais te incomoda?",
      options: [
        "Me esforço muito e quase nada muda",
        "Começo, paro, recomeço... e cansei disso",
        "Nunca tive orientação de verdade",
        "Já tive resultado antes, mas voltou tudo",
      ],
    },
    {
      icon: "⏳",
      text: "Isso está acontecendo faz quanto tempo?",
      options: [
        "Menos de 6 meses",
        "Entre 1 e 3 anos",
        "Mais de 3 anos",
        "A vida inteira, nunca consegui manter",
      ],
    },
    {
      icon: "🚧",
      text: "O que mais sabota quando você tenta mudar?",
      options: [
        "A dieta fica impossível de seguir",
        "Começo forte, mas perco o ritmo rápido",
        "Treino muito e não vejo resultado",
        "Ansiedade, compulsão ou estresse atrapalham",
      ],
    },
    {
      icon: "🎯",
      text: "Se esse obstáculo sumisse, qual seria seu objetivo principal?",
      options: [
        "Emagrecer e tirar esse peso de vez",
        "Ganhar músculo e ficar definido",
        "Emagrecer e ganhar massa ao mesmo tempo",
        "Saúde e bem-estar no meu próprio corpo",
      ],
    },
    {
      icon: "✨",
      text: "Chegando lá de verdade, o que mudaria na sua vida?",
      options: [
        "Minha autoestima e confiança voltariam",
        "Teria mais energia no dia a dia",
        "Me sentiria bem olhando no espelho",
        "Pararia de adiar e viveria de verdade",
      ],
    },
  ];

  let currentQuestion = 0;

  function showQuestion() {
    const activeQuestion = questions[currentQuestion];
    const progressValue = ((currentQuestion + 1) / questions.length) * 100;

    quiz.hidden = false;
    result.hidden = true;
    progress.style.width = `${progressValue}%`;
    step.textContent = `Pergunta ${currentQuestion + 1} de ${questions.length}`;
    icon.textContent = activeQuestion.icon;
    question.textContent = activeQuestion.text;
    options.replaceChildren();

    activeQuestion.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "diagnostic-option";
      button.textContent = option;
      button.addEventListener("click", () => {
        if (currentQuestion < questions.length - 1) {
          currentQuestion += 1;
          showQuestion();
          return;
        }

        showResult();
      });

      options.appendChild(button);
    });
  }

  function showResult() {
    quiz.hidden = true;
    result.hidden = false;
    progress.style.width = "100%";
  }

  reset.addEventListener("click", () => {
    currentQuestion = 0;
    showQuestion();
  });

  showQuestion();
}

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

setupMobileStickyCta();
setupDiagnostic();

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
