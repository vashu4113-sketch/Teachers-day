const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

$$('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => {
    scrollToSection(button.dataset.scroll);

    const mobileNav = $('#mobile-nav');

    if (mobileNav && !mobileNav.hidden) {
      mobileNav.hidden = true;
      $('#menu-button')?.setAttribute('aria-expanded', 'false');
    }
  });
});

const menuButton = $('#menu-button');
const mobileNav = $('#mobile-nav');

menuButton?.addEventListener('click', () => {
  const opening = mobileNav.hidden;

  mobileNav.hidden = !opening;
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute(
    'aria-label',
    opening ? 'Close navigation menu' : 'Open navigation menu'
  );
});

function createTechnicalCanvas(element, compact = false) {
  const nodes = compact
    ? [
      { x: 22, y: 30 },
      { x: 48, y: 12 },
      { x: 76, y: 35 },
      { x: 38, y: 67 },
      { x: 67, y: 78 }
    ]
    : [
      { x: 8, y: 22 },
      { x: 22, y: 59 },
      { x: 36, y: 34 },
      { x: 48, y: 78 },
      { x: 59, y: 20 },
      { x: 74, y: 51 },
      { x: 90, y: 29 },
      { x: 84, y: 79 }
    ];

  const svgLines = nodes
    .slice(0, -1)
    .map((node, index) => {
      const next = nodes[index + 1];

      return `<line x1="${node.x}" y1="${node.y}" x2="${next.x}" y2="${next.y}" />`;
    })
    .join('');

  element.innerHTML = `
    <div class="technical-grid"></div>
    <div class="binary-noise"></div>

    <svg
      class="network-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      ${svgLines}

      <path d="M8 22L36 34L59 20L90 29M22 59L48 78L84 79L74 51L36 34" />
    </svg>

    <div class="network-nodes">
      ${nodes
      .map(
        (node, index) =>
          `<span
              class="network-node"
              style="left:${node.x}%;top:${node.y}%;animation-delay:${index * 0.35}s"
            ></span>`
      )
      .join('')}
    </div>
  `;

  const nodesLayer = $('.network-nodes', element);

  const move = (event) => {
    const rect = element.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width - 0.5) * 18;

    const y =
      ((event.clientY - rect.top) / rect.height - 0.5) * 18;

    nodesLayer.style.transform =
      `translate3d(${x}px, ${y}px, 0)`;
  };

  window.addEventListener('mousemove', move, {
    passive: true
  });
}

$$('[data-canvas]').forEach((canvas) =>
  createTechnicalCanvas(
    canvas,
    canvas.dataset.canvas === 'compact'
  )
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12
  }
);

$$('.reveal').forEach((element) =>
  revealObserver.observe(element)
);


/* =========================================================
   RSVP SECTION
   ========================================================= */

const form = $('#rsvp-form');
const successState = $('#success-state');
const formError = $('#form-error');
const submitButton = $('#submit-button');
const submitLabel = $('#submit-label');

const requiredFields = [
  [
    'facultyName',
    'faculty-name',
    'Please tell us your name.'
  ],
  [
    'department',
    'department',
    'Please add your department or designation.'
  ],
  [
    'email',
    'email',
    'Please enter a valid email address.'
  ]
];


/* =========================================================
   GOOGLE APPS SCRIPT URL
   =========================================================

   REPLACE THE URL BELOW WITH YOUR GOOGLE APPS SCRIPT
   WEB APP URL.

   Example:

   const GOOGLE_SCRIPT_URL =
     'https://script.google.com/macros/s/XXXXXXXXXXXX/exec';

   ========================================================= */

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbz-RXWuR9blmlVuw_oruAqq_ygh-gFCasvU-Jk8zGaCveBwLzHS6VXsYZoJtUGSNnstWw/exec';


function setFieldError(name, message) {
  const field = $(
    `[data-error-for="${name}"]`
  );

  const input = $(
    `#${requiredFields.find(
      ([key]) => key === name
    )?.[1] || name}`
  );

  if (field) {
    field.textContent = message || '';
  }

  if (input) {
    input.setAttribute(
      'aria-invalid',
      String(Boolean(message))
    );
  }
}


/* =========================================================
   RSVP SUBMISSION
   ========================================================= */

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  formError.hidden = true;

  let hasError = false;

  const data = new FormData(form);

  const values = Object.fromEntries(
    data.entries()
  );


  /* ---------- Validation ---------- */

  requiredFields.forEach(
    ([name, id, message]) => {
      const value = String(
        values[name] || ''
      ).trim();

      const invalidEmail =
        name === 'email' &&
        !/^\S+@\S+\.\S+$/.test(value);

      const error =
        !value || invalidEmail
          ? message
          : '';

      setFieldError(
        name,
        error
      );

      if (error) {
        hasError = true;
      }
    }
  );


  if (hasError) {
    const firstInvalid =
      $('.field input[aria-invalid="true"]');

    firstInvalid?.focus();

    return;
  }


  /* ---------- Check Google Script URL ---------- */

  if (
    !GOOGLE_SCRIPT_URL ||
    GOOGLE_SCRIPT_URL.includes(
      'PASTE_YOUR_GOOGLE_APPS_SCRIPT'
    )
  ) {
    formError.textContent =
      'RSVP system is not configured yet. Please add the Google Apps Script URL.';

    formError.hidden = false;

    return;
  }


  /* ---------- Sending ---------- */

  submitButton.disabled = true;

  submitLabel.textContent =
    'Sending your RSVP...';


  try {

    const response = await fetch(
      GOOGLE_SCRIPT_URL,
      {
        method: 'POST',

        mode: 'no-cors',

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded;charset=UTF-8'
        },

        body: new URLSearchParams({
          facultyName:
            String(
              values.facultyName || ''
            ).trim(),

          department:
            String(
              values.department || ''
            ).trim(),

          email:
            String(
              values.email || ''
            ).trim(),

          attendance:
            String(
              values.attendance || ''
            ),

          message:
            String(
              values.message || ''
            ).trim()
        }).toString()
      }
    );


    /*
      no-cors responses are opaque, so the browser
      cannot read the response from Google Apps Script.

      The request has been sent to the Apps Script,
      which stores the RSVP in Google Sheets.
    */

    void response;


    /* ---------- Show success ---------- */

    form.hidden = true;

    successState.hidden = false;

    successState.setAttribute(
      'tabindex',
      '-1'
    );

    successState.focus();

    form.reset();


  } catch (error) {

    console.error(
      'RSVP submission failed:',
      error
    );

    formError.textContent =
      'We could not send your RSVP. Please check your internet connection and try again.';

    formError.hidden = false;

    submitButton.disabled = false;

    submitLabel.textContent =
      'Confirm My RSVP';
  }
});
/* =========================================================
   LIVE EVENT COUNTDOWN
   ========================================================= */

/*
   CHANGE THIS DATE AND TIME TO YOUR EVENT DATE/TIME.

   Format:
   YYYY-MM-DDTHH:MM:SS

   Example:
   5 September 2026 at 4:00 PM

   2026-09-05T16:00:00
*/

const EVENT_DATE = '2026-09-05T16:00:00';

const countdown = $('#countdown');

const countdownDays = $('#countdown-days');
const countdownHours = $('#countdown-hours');
const countdownMinutes = $('#countdown-minutes');
const countdownSeconds = $('#countdown-seconds');

const countdownMessage = $('#countdown-message');


function updateCountdown() {

  if (!countdown) return;

  const eventTime =
    new Date(EVENT_DATE).getTime();

  const currentTime =
    new Date().getTime();

  const difference =
    eventTime - currentTime;


  if (difference <= 0) {

    countdownDays.textContent = '00';
    countdownHours.textContent = '00';
    countdownMinutes.textContent = '00';
    countdownSeconds.textContent = '00';

    countdownMessage.textContent =
      'The celebration has begun!';

    return;
  }


  const days =
    Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );

  const hours =
    Math.floor(
      (difference / (1000 * 60 * 60)) % 24
    );

  const minutes =
    Math.floor(
      (difference / (1000 * 60)) % 60
    );

  const seconds =
    Math.floor(
      (difference / 1000) % 60
    );


  countdownDays.textContent =
    String(days).padStart(2, '0');

  countdownHours.textContent =
    String(hours).padStart(2, '0');

  countdownMinutes.textContent =
    String(minutes).padStart(2, '0');

  countdownSeconds.textContent =
    String(seconds).padStart(2, '0');
}


updateCountdown();

const countdownInterval =
  setInterval(updateCountdown, 1000);