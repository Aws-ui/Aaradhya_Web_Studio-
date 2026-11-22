document.addEventListener("DOMContentLoaded", function () {
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  var themeToggle = document.getElementById("themeToggle");
  var savedTheme;
  try {
    savedTheme = localStorage.getItem("aw-theme");
  } catch {
    // The theme can still be changed when storage is unavailable.
  }
  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("light");
    var isLight = document.body.classList.contains("light");
    themeToggle.textContent = isLight ? "☀️" : "🌙";
    try {
      localStorage.setItem("aw-theme", isLight ? "light" : "dark");
    } catch {
      // Keep the selected theme for the current page.
    }
  });

  var menuToggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  menuToggle.addEventListener("click", function () {
    var expanded = mobileNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", expanded);
  });
  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    document.body.classList.add("motion-ready");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("show");
    });
  }

  var filters = document.querySelectorAll(".filter-btn");
  var projects = document.querySelectorAll(".project");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      filters.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      projects.forEach(function (card) {
        var type = card.getAttribute("data-type");
        var show = filter === "all" || filter === type;
        card.style.display = show ? "block" : "none";
      });
    });
  });

  var faqButtons = document.querySelectorAll(".faq-q");
  faqButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var answer = btn.nextElementSibling;
      var isOpen = answer.style.display === "block";

      document.querySelectorAll(".faq-a").forEach(function (a) {
        a.style.display = "none";
      });

      answer.style.display = isOpen ? "none" : "block";
    });
  });

  var testimonials = [
    { text: "The website looks premium and feels like a real modern studio brand.", name: "Client A" },
    { text: "Fast, clean, and beautiful. The glass effect makes it stand out.", name: "Client B" },
    { text: "Very polished design. The scrolling and sections feel professional.", name: "Client C" }
  ];

  var tText = document.getElementById("testimonialText");
  var tName = document.getElementById("testimonialName");
  var testimonialIndex = 0;

  function showTestimonial() {
    var item = testimonials[testimonialIndex];
    tText.textContent = "“" + item.text + "”";
    tName.textContent = "— " + item.name;
    testimonialIndex = (testimonialIndex + 1) % testimonials.length;
  }
  if (tText && tName) {
    showTestimonial();
    if (!reducedMotion.matches) setInterval(showTestimonial, 5000);
  }

  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("name").value.trim();
      var email = document.getElementById("email").value.trim();
      var message = document.getElementById("message").value.trim();

      if (!name || !email || !message) {
        alert("Please fill all fields.");
        return;
      }

      var whatsapp = new URL(document.getElementById("whatsappLink").href);
      whatsapp.searchParams.set("text", "Website inquiry from " + name + "\nEmail: " + email + "\n\n" + message);
      window.location.assign(whatsapp.href);
    });
  }

  setupHeroMotion(reducedMotion);
});

function setupHeroMotion(reducedMotion) {
  const hero = document.getElementById("home");
  const globe = document.getElementById("networkGlobe");
  const particles = document.getElementById("particleCanvas");
  const globeContext = globe.getContext("2d");
  const particleContext = particles.getContext("2d");
  if (!globeContext || !particleContext) return;

  const nodes = Array.from({ length: 112 }, (_, index) => {
    const y = 1 - 2 * (index + 0.5) / 112;
    const radius = Math.sqrt(1 - y * y);
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    return { x: radius * Math.cos(angle), y, z: radius * Math.sin(angle) };
  });
  const links = [];
  nodes.forEach((node, index) => {
    for (let other = index + 1; other < nodes.length; other++) {
      const target = nodes[other];
      if (Math.hypot(node.x - target.x, node.y - target.y, node.z - target.z) < 0.39) {
        links.push([index, other]);
      }
    }
  });

  const stars = Array.from({ length: 52 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.6 + Math.random() * 1.2
  }));
  let globeSize;
  let particleSize;
  let pointerX = 0;
  let pointerY = 0;
  let rotation = 0.45;
  let pitch = 0.22;
  let lastTime = null;
  let frame = 0;
  let visible = true;

  function fit(canvas, context) {
    const { width, height } = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    return { width, height };
  }

  function draw() {
    const { width, height } = globeSize;
    const radius = Math.min(width, height) * 0.37;
    const cosYaw = Math.cos(rotation);
    const sinYaw = Math.sin(rotation);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    const projected = nodes.map((node) => {
      const x = node.x * cosYaw - node.z * sinYaw;
      const rotatedZ = node.x * sinYaw + node.z * cosYaw;
      const y = node.y * cosPitch - rotatedZ * sinPitch;
      const z = node.y * sinPitch + rotatedZ * cosPitch;
      const scale = radius * 4 / (4 - z);
      return { x: width / 2 + x * scale, y: height / 2 + y * scale, z };
    });

    globeContext.clearRect(0, 0, width, height);
    links.forEach(([from, to]) => {
      const start = projected[from];
      const end = projected[to];
      const depth = (start.z + end.z + 2) / 4;
      globeContext.strokeStyle = "rgba(123, 196, 255, " + (0.14 + depth * 0.55) + ")";
      globeContext.beginPath();
      globeContext.moveTo(start.x, start.y);
      globeContext.lineTo(end.x, end.y);
      globeContext.stroke();
    });
    projected.forEach(({ x, y, z }) => {
      const depth = (z + 1) / 2;
      globeContext.fillStyle = "rgba(173, 244, 255, " + (0.25 + depth * 0.75) + ")";
      globeContext.beginPath();
      globeContext.arc(x, y, 1 + depth * 1.4, 0, Math.PI * 2);
      globeContext.fill();
    });

    particleContext.clearRect(0, 0, particleSize.width, particleSize.height);
    particleContext.fillStyle = "rgba(109, 146, 238, 0.48)";
    stars.forEach((star) => {
      const offsetX = (star.x + rotation * 0.018) % 1;
      particleContext.beginPath();
      particleContext.arc(offsetX * particleSize.width, star.y * particleSize.height, star.size, 0, Math.PI * 2);
      particleContext.fill();
    });
  }

  function animate(now) {
    const elapsed = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    rotation += elapsed * (0.22 + pointerX * 0.14);
    pitch += (0.22 + pointerY * 0.48 - pitch) * Math.min(elapsed * 5, 1);
    draw();
    frame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    cancelAnimationFrame(frame);
    lastTime = null;
    if (visible && !document.hidden && !reducedMotion.matches) {
      frame = requestAnimationFrame(animate);
    }
  }

  function resize() {
    globeSize = fit(globe, globeContext);
    particleSize = fit(particles, particleContext);
    draw();
  }

  hero.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const bounds = hero.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
  });
  hero.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    }).observe(hero);
  }
  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(hero);
  } else {
    window.addEventListener("resize", resize);
  }
  reducedMotion.addEventListener("change", syncAnimation);
  document.addEventListener("visibilitychange", syncAnimation);
  resize();
  syncAnimation();
}
