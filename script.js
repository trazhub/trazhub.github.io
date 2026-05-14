const cursor = document.getElementById("cursor");
const ring = document.getElementById("cursorRing");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;

if (cursor && ring && window.matchMedia("(pointer: fine)").matches) {
  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.style.left = `${mouseX - 4}px`;
    cursor.style.top = `${mouseY - 4}px`;
  });

  function animateCursor() {
    ringX += (mouseX - ringX - 18) * 0.14;
    ringY += (mouseY - ringY - 18) * 0.14;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  document.querySelectorAll("a, button").forEach((element) => {
    element.addEventListener("mouseenter", () => {
      ring.style.width = "54px";
      ring.style.height = "54px";
      ring.style.background = "rgba(255, 92, 138, 0.22)";
      cursor.style.transform = "scale(0.55)";
    });

    element.addEventListener("mouseleave", () => {
      ring.style.width = "36px";
      ring.style.height = "36px";
      ring.style.background = "rgba(247, 201, 72, 0.18)";
      cursor.style.transform = "scale(1)";
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const typeLine = document.getElementById("typeLine");
const typeOutput = document.getElementById("typeOutput");
const consoleCommands = [
  ["render --quality", "high, unless the deadline says otherwise"],
  ["deploy --target ubuntu", "static files packed, tunnel is ready"],
  ["debug --patience", "cache has entered the suspect list"],
  ["make --thing fun", "portfolio personality increased"]
];

let commandIndex = 0;

function rotateConsoleLine() {
  if (!typeLine || !typeOutput) return;

  commandIndex = (commandIndex + 1) % consoleCommands.length;
  const [command, output] = consoleCommands[commandIndex];
  typeLine.textContent = "";
  typeOutput.textContent = output;

  [...command].forEach((character, index) => {
    window.setTimeout(() => {
      typeLine.textContent += character;
    }, index * 34);
  });
}

window.setInterval(rotateConsoleLine, 3600);

if (window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${y * -4}deg) rotateY(${x * 5}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

const navLinks = [...document.querySelectorAll(".nav-links a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -50% 0px" }
);

sections.forEach((section) => navObserver.observe(section));
