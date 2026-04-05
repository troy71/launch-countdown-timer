const COUNTDOWN_DAYS = 14;
const SECONDS_PER_DAY = 24 * 60 * 60;
const FLIP_CLASS = "is-flipping";

const root = document.querySelector(".countdown-app");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const flipAnimationEnabled =
  root?.dataset.flipAnimation !== "false" &&
  root?.dataset.flipAnimation !== "off" &&
  !prefersReducedMotion;

const segments = {
  days: createSegmentController("days"),
  hours: createSegmentController("hours"),
  minutes: createSegmentController("minutes"),
  seconds: createSegmentController("seconds"),
};

const targetTime = Date.now() + COUNTDOWN_DAYS * SECONDS_PER_DAY * 1000;
let timerId = null;
let stopped = false;

startCountdown();

function startCountdown() {
  stopped = false;
  renderTimeRemaining(getTimeRemaining(targetTime));
  scheduleNextTick();
}

function scheduleNextTick() {
  if (stopped) {
    return;
  }

  const now = Date.now();
  const driftSafeDelay = Math.max(0, 1000 - (now % 1000) + 5);
  timerId = window.setTimeout(tick, driftSafeDelay);
}

function tick() {
  const remaining = getTimeRemaining(targetTime);
  renderTimeRemaining(remaining);

  if (remaining.totalMs <= 0) {
    stopCountdown();
    return;
  }

  scheduleNextTick();
}

function stopCountdown() {
  stopped = true;

  if (timerId !== null) {
    window.clearTimeout(timerId);
    timerId = null;
  }

  renderTimeRemaining({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });
}

function getTimeRemaining(targetTimestamp) {
  const totalMs = Math.max(0, targetTimestamp - Date.now());
  const totalSeconds = Math.floor(totalMs / 1000);

  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
  };
}

function renderTimeRemaining({ days, hours, minutes, seconds }) {
  segments.days.update(days);
  segments.hours.update(hours);
  segments.minutes.update(minutes);
  segments.seconds.update(seconds);
}

function createSegmentController(name) {
  const container = document.querySelector(`[data-segment="${name}"]`);
  const card = container?.querySelector(".flip-card");
  const topValue = container?.querySelector('[data-part="top"]');
  const bottomValue = container?.querySelector('[data-part="bottom"]');
  const screenReaderValue = container?.querySelector("[data-sr-value]");
  const flipOld = container?.querySelector("[data-flip-old]");
  const flipNew = container?.querySelector("[data-flip-new]");

  let currentValue = screenReaderValue?.textContent?.trim() || "00";

  return {
    update(nextRawValue) {
      const nextValue = formatTime(nextRawValue, name === "days");

      if (
        !card ||
        !topValue ||
        !bottomValue ||
        !screenReaderValue ||
        !flipOld ||
        !flipNew
      ) {
        return;
      }

      if (currentValue === nextValue) {
        return;
      }

      if (!flipAnimationEnabled) {
        topValue.textContent = nextValue;
        bottomValue.textContent = nextValue;
        screenReaderValue.textContent = nextValue;
        currentValue = nextValue;
        return;
      }

      card.classList.remove(FLIP_CLASS);
      void card.offsetWidth;

      flipOld.textContent = currentValue;
      flipNew.textContent = nextValue;
      topValue.textContent = currentValue;
      bottomValue.textContent = currentValue;
      screenReaderValue.textContent = nextValue;

      card.classList.add(FLIP_CLASS);

      window.setTimeout(() => {
        topValue.textContent = nextValue;
      }, 340);

      window.setTimeout(() => {
        bottomValue.textContent = nextValue;
        card.classList.remove(FLIP_CLASS);
      }, 680);

      currentValue = nextValue;
    },
  };
}

function formatTime(value, allowThreeDigits) {
  if (allowThreeDigits) {
    return String(value).padStart(2, "0");
  }

  return String(value).padStart(2, "0");
}
