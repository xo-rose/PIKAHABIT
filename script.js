const STORAGE_KEY = "pikaReminders";

const elements = {
  form: document.getElementById("reminderForm"),
  title: document.getElementById("reminderTitle"),
  repeat: document.getElementById("reminderRepeat"),
  date: document.getElementById("reminderDate"),
  time: document.getElementById("reminderTime"),
  dateLabel: document.getElementById("dateLabel"),
  scheduleFields: document.getElementById("scheduleFields"),
  scheduleHint: document.getElementById("scheduleHint"),
  reminderList: document.getElementById("reminderList"),
  emptyState: document.getElementById("emptyState"),
  reminderCount: document.getElementById("reminderCount"),
  reminderBadge: document.getElementById("reminderBadge"),
  enableNotifications: document.getElementById("enableNotifications"),
  notificationStatus: document.getElementById("notificationStatus"),
  toast: document.getElementById("toast"),
};

const repeatIntervals = { "2m": 2 * 60_000, "30m": 30 * 60_000, "1h": 60 * 60_000 };
let reminders = loadReminders();
let toastTimer;

function loadReminders() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((item) => item && typeof item.title === "string" && ["once", "2m", "30m", "1h", "daily"].includes(item.repeat))
      .map((item) => ({
        id: String(item.id ?? `${Date.now()}-${Math.random()}`),
        title: item.title.trim().slice(0, 72),
        repeat: item.repeat,
        nextAt: Number(item.nextAt) || null,
        dailyTime: /^\d{2}:\d{2}$/.test(item.dailyTime || "")
          ? item.dailyTime
          : item.nextAt
            ? new Date(item.nextAt).toTimeString().slice(0, 5)
            : "09:00",
        notified: Boolean(item.notified),
        snoozed: Boolean(item.snoozed),
      }));
  } catch {
    return [];
  }
}

function saveReminders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nextDailyTime(dateValue, timeValue, from = new Date()) {
  const candidate = new Date(`${dateValue}T${timeValue}:00`);
  if (candidate > from) return candidate.getTime();
  candidate.setDate(candidate.getDate() + 1);
  return candidate.getTime();
}

function nextDailyOccurrence(timeValue, from = new Date()) {
  const candidate = new Date(from);
  const [hour, minute] = timeValue.split(":").map(Number);
  candidate.setHours(hour, minute, 0, 0);
  if (candidate <= from) candidate.setDate(candidate.getDate() + 1);
  return candidate.getTime();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2300);
}

function repeatLabel(repeat) {
  return ({ once: "Just once", "2m": "Every 2 minutes", "30m": "Every 30 minutes", "1h": "Every hour", daily: "Every day" })[repeat];
}

function formatNextTime(reminder) {
  if (reminder.notified && reminder.repeat === "once") return "Nudge sent · waiting for you";
  if (!reminder.nextAt) return "Ready when you are";
  const next = new Date(reminder.nextAt);
  if (next.getTime() <= Date.now()) return "Nudge is ready";
  const date = localDateKey(next) === localDateKey() ? "Today" : localDateKey(next) === localDateKey(new Date(Date.now() + 86_400_000)) ? "Tomorrow" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(next);
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(next);
  return `${date} · ${time}`;
}

function reminderIcon(title) {
  if (/water|drink|sip/i.test(title)) return "💧";
  if (/study|read|exam|homework|class/i.test(title)) return "📚";
  return "⚡";
}

function makeAction(label, action, id, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `reminder-action ${className}`.trim();
  button.dataset.action = action;
  button.dataset.id = id;
  button.textContent = label;
  return button;
}

function render() {
  const sorted = [...reminders].sort((a, b) => (a.nextAt || Number.MAX_SAFE_INTEGER) - (b.nextAt || Number.MAX_SAFE_INTEGER));
  elements.reminderList.replaceChildren();

  for (const reminder of sorted) {
    const item = document.createElement("article");
    item.className = "reminder-item";
    const icon = document.createElement("span");
    icon.className = "reminder-symbol";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = reminderIcon(reminder.title);
    const copy = document.createElement("div");
    copy.className = "reminder-item-copy";
    const title = document.createElement("h3");
    title.className = "reminder-title";
    title.textContent = reminder.title;
    const time = document.createElement("p");
    time.className = "reminder-time";
    time.textContent = formatNextTime(reminder);
    const frequency = document.createElement("p");
    frequency.className = "reminder-repeat";
    frequency.textContent = repeatLabel(reminder.repeat);
    copy.append(title, time, frequency);

    const actions = document.createElement("div");
    actions.className = "reminder-actions";
    actions.append(makeAction("Done", "done", reminder.id, "done"));
    actions.append(makeAction("Snooze 10m", "snooze", reminder.id));
    if (reminder.repeat !== "once") actions.append(makeAction("Skip this one", "skip", reminder.id));
    actions.append(makeAction("×", "delete", reminder.id, "remove"));
    item.append(icon, copy, actions);
    elements.reminderList.append(item);
  }

  const count = reminders.length;
  elements.emptyState.hidden = count > 0;
  elements.reminderCount.textContent = count ? `${count} reminder${count === 1 ? "" : "s"} to keep in mind` : "Nothing to remember yet";
  elements.reminderBadge.textContent = String(count);
}

function updateScheduleFields() {
  const repeat = elements.repeat.value;
  const needsTime = repeat === "once" || repeat === "daily";
  const needsDate = repeat === "once" || repeat === "daily";
  elements.scheduleFields.hidden = !needsTime && !needsDate;
  elements.date.hidden = !needsDate;
  elements.time.hidden = !needsTime;
  elements.dateLabel.hidden = !needsDate;
  document.querySelector(".time-label").hidden = !needsTime;
  elements.date.required = needsDate;
  elements.time.required = needsTime;
  elements.dateLabel.textContent = repeat === "daily" ? "Start date" : "Date";

  const hints = {
    once: "For example: study biology once today at 7:00 pm.",
    "2m": "Your first nudge will arrive in 2 minutes. Great for trying it out.",
    "30m": "Your first nudge will arrive in 30 minutes.",
    "1h": "Your first nudge will arrive in 1 hour.",
    daily: "For example: drink water every day at 10:00 am.",
  };
  elements.scheduleHint.textContent = hints[repeat];
}

function updateNotificationStatus() {
  if (!("Notification" in window)) {
    elements.enableNotifications.disabled = true;
    elements.notificationStatus.textContent = "This browser does not support desktop notifications.";
    return;
  }
  if (Notification.permission === "granted") {
    elements.enableNotifications.textContent = "Reminders are on ✓";
    elements.notificationStatus.textContent = "PikaHabit can nudge you while this page is open. Your device controls notification sounds.";
  } else if (Notification.permission === "denied") {
    elements.enableNotifications.textContent = "Notifications blocked";
    elements.notificationStatus.textContent = "You can allow notifications for this site in your browser settings.";
  } else {
    elements.enableNotifications.textContent = "Enable reminders ↗";
    elements.notificationStatus.textContent = "You’ll be asked before notifications are enabled.";
  }
}

function notify(reminder) {
  const notification = new Notification(reminder.title, { body: "A gentle nudge from PikaHabit.", icon: "pk.png", tag: `pikahabit-${reminder.id}` });
  notification.addEventListener("click", () => {
    window.focus();
    window.location.hash = "reminders";
    notification.close();
  });
}

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = Date.now();
  let changed = false;
  for (const reminder of reminders) {
    if (!reminder.nextAt || reminder.nextAt > now) continue;
    notify(reminder);
    changed = true;
    if (reminder.repeat === "once") {
      reminder.nextAt = null;
      reminder.notified = true;
    } else if (reminder.repeat === "daily") {
      reminder.nextAt = nextDailyOccurrence(reminder.dailyTime, new Date(now));
      reminder.snoozed = false;
    } else {
      reminder.nextAt = now + repeatIntervals[reminder.repeat];
      reminder.snoozed = false;
    }
  }
  if (changed) {
    saveReminders();
    render();
  }
}

elements.repeat.addEventListener("change", updateScheduleFields);
elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = elements.title.value.trim();
  const repeat = elements.repeat.value;
  if (!title) return;

  let nextAt;
  if (repeat === "once") {
    nextAt = new Date(`${elements.date.value}T${elements.time.value}:00`).getTime();
    if (nextAt <= Date.now()) {
      showToast("Choose a time in the future.");
      return;
    }
  } else if (repeat === "daily") {
    nextAt = nextDailyTime(elements.date.value, elements.time.value);
  } else {
    nextAt = Date.now() + repeatIntervals[repeat];
  }

  reminders.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.slice(0, 72),
    repeat,
    nextAt,
    dailyTime: repeat === "daily" ? elements.time.value : null,
    notified: false,
    snoozed: false,
  });
  saveReminders();
  render();
  elements.form.reset();
  elements.date.value = localDateKey();
  updateScheduleFields();
  showToast("Reminder added. You can relax; PikaHabit remembers.");
});

elements.reminderList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const reminder = reminders.find((item) => item.id === button.dataset.id);
  if (!reminder) return;

  if (button.dataset.action === "delete" || (button.dataset.action === "done" && reminder.repeat === "once")) {
    reminders = reminders.filter((item) => item.id !== reminder.id);
    showToast(button.dataset.action === "done" ? "Nice. One less thing to remember." : "Reminder removed.");
  } else if (button.dataset.action === "snooze") {
    reminder.nextAt = Date.now() + 10 * 60_000;
    reminder.notified = false;
    reminder.snoozed = true;
    showToast("Okay, I’ll nudge you in 10 minutes.");
  } else if (button.dataset.action === "done" || button.dataset.action === "skip") {
    reminder.nextAt = reminder.repeat === "daily"
      ? nextDailyOccurrence(reminder.dailyTime, new Date(Math.max(Date.now(), reminder.nextAt || 0)))
      : Date.now() + repeatIntervals[reminder.repeat];
    reminder.notified = false;
    reminder.snoozed = false;
    showToast(button.dataset.action === "done" ? "Done for now. Your next nudge is set." : "Skipped. I’ll remind you next time.");
  }

  saveReminders();
  render();
});

elements.enableNotifications.addEventListener("click", async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    showToast("Gentle reminders are on.");
    return;
  }
  const permission = await Notification.requestPermission();
  updateNotificationStatus();
  showToast(permission === "granted" ? "Reminders are on. You’re all set." : "No worries. You can still use PikaHabit here.");
});

elements.date.min = localDateKey();
elements.date.value = localDateKey();
updateScheduleFields();
updateNotificationStatus();
render();
window.setInterval(checkReminders, 15_000);
document.addEventListener("visibilitychange", checkReminders);
