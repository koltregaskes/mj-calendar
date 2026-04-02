const STORAGE_KEYS = {
  tasks: 'mj-calendar:tasks',
  days: 'mj-calendar:days'
};

const DEFAULT_TASKS = [
  { id: 'review-images', label: 'Review images' },
  { id: 'videos', label: 'Videos' },
  { id: 'upscales', label: 'Upscales' },
  { id: 'publish', label: 'Publish' }
];

class MidjourneyCalendar {
  constructor() {
    this.currentDate = new Date();
    this.viewDate = new Date();
    this.selectedDate = new Date();

    this.tasks = this.normalizeTasks(this.loadFromStorage(STORAGE_KEYS.tasks, DEFAULT_TASKS));
    this.days = this.normalizeDays(this.loadFromStorage(STORAGE_KEYS.days, {}), this.tasks);

    this.dom = this.bindDom();
    this.persistState();
    this.setupEventListeners();
    this.renderCalendar();
    this.renderTaskPanel();
    this.renderPresets();
    this.updateProgressStats();
    this.syncJumpInputs();
  }

  bindDom() {
    return {
      monthYear: document.getElementById('monthYear'),
      calendarGrid: document.getElementById('calendarGrid'),
      progressStats: document.getElementById('progressStats'),
      prevBtn: document.getElementById('prevMonthBtn'),
      nextBtn: document.getElementById('nextMonthBtn'),
      jumpMonthInput: document.getElementById('jumpMonthInput'),
      jumpDateInput: document.getElementById('jumpDateInput'),
      exportBtn: document.getElementById('exportBtn'),
      importBtn: document.getElementById('importBtn'),
      importInput: document.getElementById('importInput'),
      clearAllBtn: document.getElementById('clearAllBtn'),
      resetDayBtn: document.getElementById('resetDayBtn'),
      taskList: document.getElementById('taskList'),
      taskSummary: document.getElementById('taskSummary'),
      dayNotesInput: document.getElementById('dayNotesInput'),
      selectedDateLabel: document.getElementById('selectedDateLabel'),
      addTaskForm: document.getElementById('addTaskForm'),
      addTaskInput: document.getElementById('addTaskInput'),
      presetsList: document.getElementById('presetsList'),
      restoreDefaultsBtn: document.getElementById('restoreDefaultsBtn')
    };
  }

  loadFromStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  persistState() {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(this.tasks));
    localStorage.setItem(STORAGE_KEYS.days, JSON.stringify(this.days));
  }

  formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  isToday(date) {
    return this.formatDateKey(date) === this.formatDateKey(this.currentDate);
  }

  slugify(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  buildUniqueTaskId(baseId, seenIds) {
    const root = baseId || `task-${Date.now()}`;
    let candidate = root;
    let suffix = 2;

    while (seenIds.has(candidate)) {
      candidate = `${root}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  normalizeTasks(rawTasks) {
    const source = Array.isArray(rawTasks) ? rawTasks : DEFAULT_TASKS;
    const normalized = [];
    const seenIds = new Set();

    source.forEach((task) => {
      const labelSource = typeof task === 'string' ? task : task?.label;
      const label = typeof labelSource === 'string' ? labelSource.trim() : '';

      if (!label) {
        return;
      }

      const rawId =
        typeof task === 'object' && task && typeof task.id === 'string'
          ? this.slugify(task.id)
          : this.slugify(label);
      const id = this.buildUniqueTaskId(rawId, seenIds);

      seenIds.add(id);
      normalized.push({ id, label });
    });

    if (normalized.length > 0) {
      return normalized;
    }

    return DEFAULT_TASKS.map((task) => ({ ...task }));
  }

  normalizeDays(rawDays, tasks) {
    if (!rawDays || typeof rawDays !== 'object' || Array.isArray(rawDays)) {
      return {};
    }

    const normalized = {};

    Object.entries(rawDays).forEach(([dateKey, entry]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return;
      }

      const taskState = {};
      tasks.forEach((task) => {
        taskState[task.id] = Boolean(entry?.tasks?.[task.id]);
      });

      normalized[dateKey] = {
        tasks: taskState,
        notes: typeof entry?.notes === 'string' ? entry.notes : ''
      };
    });

    return normalized;
  }

  buildEmptyTaskState() {
    return Object.fromEntries(this.tasks.map((task) => [task.id, false]));
  }

  buildEmptyDayEntry() {
    return {
      tasks: this.buildEmptyTaskState(),
      notes: ''
    };
  }

  getDayEntry(date, createIfMissing = true) {
    const key = this.formatDateKey(date);

    if (!this.days[key] && createIfMissing) {
      this.days[key] = this.buildEmptyDayEntry();
    }

    return {
      key,
      entry: this.days[key] || this.buildEmptyDayEntry()
    };
  }

  refreshUi(flashDateKey = null) {
    this.persistState();
    this.renderCalendar(flashDateKey);
    this.renderTaskPanel();
    this.renderPresets();
    this.updateProgressStats();
    this.syncJumpInputs();
  }

  toggleTask(date, taskId, value) {
    const { key, entry } = this.getDayEntry(date);
    entry.tasks[taskId] = value;
    this.refreshUi(key);
  }

  addTask(label) {
    const trimmed = label.trim();

    if (!trimmed) {
      return;
    }

    const exists = this.tasks.some((task) => task.label.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      alert('That preset already exists.');
      return;
    }

    const nextTask = {
      id: this.buildUniqueTaskId(this.slugify(trimmed), new Set(this.tasks.map((task) => task.id))),
      label: trimmed
    };

    this.tasks.push(nextTask);
    Object.values(this.days).forEach((entry) => {
      entry.tasks[nextTask.id] = false;
    });

    this.refreshUi(this.formatDateKey(this.selectedDate));
  }

  deleteTask(taskId) {
    const task = this.tasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete the preset "${task.label}"? This will also remove its saved progress from every day.`
    );

    if (!shouldDelete) {
      return;
    }

    this.tasks = this.tasks.filter((item) => item.id !== taskId);
    Object.values(this.days).forEach((entry) => {
      delete entry.tasks[taskId];
    });

    this.refreshUi(this.formatDateKey(this.selectedDate));
  }

  resetSelectedDay() {
    const { key, entry } = this.getDayEntry(this.selectedDate);

    Object.keys(entry.tasks).forEach((taskId) => {
      entry.tasks[taskId] = false;
    });
    entry.notes = '';

    this.refreshUi(key);
  }

  updateDayNotes(value) {
    const { key, entry } = this.getDayEntry(this.selectedDate);
    entry.notes = value.trim();
    this.refreshUi(key);
  }

  restoreDefaultTasks() {
    this.tasks = DEFAULT_TASKS.map((task) => ({ ...task }));
    this.days = this.normalizeDays(this.days, this.tasks);
    this.refreshUi(this.formatDateKey(this.selectedDate));
  }

  getDayProgress(date) {
    const { entry } = this.getDayEntry(date, false);
    const total = this.tasks.length;
    const completed = this.tasks.reduce((sum, task) => sum + (entry.tasks[task.id] ? 1 : 0), 0);
    const pct = total > 0 ? completed / total : 0;
    return { completed, total, pct };
  }

  renderCalendar(flashDateKey = null) {
    const { calendarGrid, monthYear } = this.dom;
    calendarGrid.innerHTML = '';

    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    monthYear.textContent = `${monthNames[month]} ${year}`;

    const firstOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstOfMonth);
    startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    for (let index = 0; index < 42; index += 1) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + index);

      const cellKey = this.formatDateKey(cellDate);
      const isCurrentMonth = cellDate.getMonth() === month;
      const { pct, completed, total } = this.getDayProgress(cellDate);
      const hue = Math.round(pct * 130);
      const lightness = 91 - Math.round(pct * 28);
      const borderLightness = Math.max(lightness - 18, 28);

      const button = document.createElement('button');
      button.className = 'calendar-day';
      button.type = 'button';
      button.textContent = cellDate.getDate();
      button.dataset.date = cellKey;
      button.dataset.pct = pct.toFixed(2);
      button.title = total > 0 ? `${completed}/${total} tasks done` : 'No presets yet';
      button.style.setProperty('--day-hue', hue);
      button.style.setProperty('--day-lightness', `${lightness}%`);
      button.style.setProperty('--day-border-lightness', `${borderLightness}%`);

      if (!isCurrentMonth) button.classList.add('calendar-day--other-month');
      if (this.isToday(cellDate)) button.classList.add('calendar-day--today');
      if (pct === 1 && total > 0) button.classList.add('calendar-day--complete');
      if (pct > 0 && pct < 1) button.classList.add('calendar-day--partial');
      if (pct === 0) button.classList.add('calendar-day--empty');

      if (flashDateKey && flashDateKey === cellKey) {
        button.classList.add('calendar-day--flash');
        button.addEventListener(
          'animationend',
          () => button.classList.remove('calendar-day--flash'),
          { once: true }
        );
      }

      button.addEventListener('click', () => {
        this.selectedDate = new Date(cellDate);
        this.renderTaskPanel();
        this.highlightSelection(cellKey);
        this.syncJumpInputs();
      });

      if (!isCurrentMonth) {
        button.disabled = true;
        button.setAttribute('tabindex', '-1');
      }

      calendarGrid.appendChild(button);
    }

    this.highlightSelection(this.formatDateKey(this.selectedDate));
  }

  highlightSelection(targetKey) {
    const buttons = this.dom.calendarGrid.querySelectorAll('.calendar-day');

    buttons.forEach((button) => {
      button.classList.toggle('calendar-day--selected', button.dataset.date === targetKey);
    });
  }

  renderTaskPanel() {
    const { taskList, selectedDateLabel, taskSummary } = this.dom;
    const { entry } = this.getDayEntry(this.selectedDate);
    const { completed, total, pct } = this.getDayProgress(this.selectedDate);
    const hasNotes = Boolean(entry.notes);
    const noteSummary = hasNotes ? ' Note saved for this day.' : '';

    selectedDateLabel.textContent = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full' }).format(this.selectedDate);
    taskSummary.textContent =
      total > 0
        ? `${completed}/${total} tasks done (${Math.round(pct * 100)}%).${noteSummary}`
        : `No task presets yet. Add one below to start tracking.${noteSummary}`;
    this.dom.resetDayBtn.disabled = completed === 0 && !hasNotes;
    this.dom.dayNotesInput.value = entry.notes || '';

    taskList.innerHTML = '';

    if (this.tasks.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = '<p>No presets yet.</p><span>Add a preset to create a reusable checklist for every day.</span>';
      taskList.appendChild(emptyState);
    } else {
      this.tasks.forEach((task) => {
        const wrapper = document.createElement('label');
        wrapper.className = 'task-row';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(entry.tasks[task.id]);
        checkbox.addEventListener('change', () => this.toggleTask(this.selectedDate, task.id, checkbox.checked));

        const text = document.createElement('span');
        text.className = 'task-row__label';
        text.textContent = task.label;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(text);
        taskList.appendChild(wrapper);
      });
    }

    const meterBars = document.querySelectorAll('.task-meter span');
    const activeSegments = Math.round(pct * meterBars.length);

    meterBars.forEach((bar, index) => {
      bar.style.background =
        index < activeSegments
          ? 'linear-gradient(135deg, #9fe8ff, #f7b267)'
          : 'rgba(255, 255, 255, 0.12)';
    });
  }

  renderPresets() {
    const { presetsList } = this.dom;
    presetsList.innerHTML = '';

    if (this.tasks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'subtle';
      empty.textContent = 'No presets saved yet.';
      presetsList.appendChild(empty);
      return;
    }

    this.tasks.forEach((task) => {
      const pill = document.createElement('div');
      pill.className = 'pill';

      const label = document.createElement('span');
      label.textContent = task.label;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'pill__remove';
      removeButton.textContent = 'Remove';
      removeButton.setAttribute('aria-label', `Delete preset ${task.label}`);
      removeButton.addEventListener('click', () => this.deleteTask(task.id));

      pill.appendChild(label);
      pill.appendChild(removeButton);
      presetsList.appendChild(pill);
    });
  }

  updateProgressStats() {
    const { progressStats } = this.dom;
    const visibleYear = this.viewDate.getFullYear();
    const visibleMonth = this.viewDate.getMonth();
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();

    let completedDays = 0;
    let partialDays = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(visibleYear, visibleMonth, day);
      const { completed, total, pct } = this.getDayProgress(date);
      totalTasks += total;
      completedTasks += completed;

      if (pct === 1 && total > 0) {
        completedDays += 1;
      } else if (pct > 0) {
        partialDays += 1;
      }
    }

    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    progressStats.textContent = `${completedDays} complete days, ${partialDays} in progress, ${completedTasks}/${totalTasks} tasks (${pct}%) this month`;
    progressStats.className = 'status';

    if (pct >= 80) {
      progressStats.classList.add('status--success');
    } else if (pct >= 40) {
      progressStats.classList.add('status--warning');
    } else {
      progressStats.classList.add('status--info');
    }
  }

  setupEventListeners() {
    const {
      prevBtn,
      nextBtn,
      jumpMonthInput,
      jumpDateInput,
      exportBtn,
      importBtn,
      importInput,
      clearAllBtn,
      resetDayBtn,
      addTaskForm,
      addTaskInput,
      dayNotesInput,
      restoreDefaultsBtn
    } = this.dom;

    prevBtn.addEventListener('click', () => {
      this.viewDate.setMonth(this.viewDate.getMonth() - 1);
      this.renderCalendar();
      this.updateProgressStats();
      this.syncJumpInputs();
    });

    nextBtn.addEventListener('click', () => {
      this.viewDate.setMonth(this.viewDate.getMonth() + 1);
      this.renderCalendar();
      this.updateProgressStats();
      this.syncJumpInputs();
    });

    jumpMonthInput.addEventListener('change', () => {
      if (!jumpMonthInput.value) {
        return;
      }

      const [year, month] = jumpMonthInput.value.split('-').map(Number);
      this.viewDate = new Date(year, month - 1, 1);
      this.renderCalendar();
      this.updateProgressStats();
      this.syncJumpInputs();
    });

    jumpDateInput.addEventListener('change', () => {
      if (!jumpDateInput.value) {
        return;
      }

      const [year, month, day] = jumpDateInput.value.split('-').map(Number);
      const flashDateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      this.viewDate = new Date(year, month - 1, 1);
      this.selectedDate = new Date(year, month - 1, day);
      this.renderCalendar(flashDateKey);
      this.renderTaskPanel();
      this.updateProgressStats();
      this.syncJumpInputs();
    });

    exportBtn.addEventListener('click', () => this.exportData());
    importBtn.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) {
        this.importData(file);
      }
    });

    clearAllBtn.addEventListener('click', () => {
      if (!window.confirm('Clear all presets and saved progress?')) {
        return;
      }

      this.tasks = DEFAULT_TASKS.map((task) => ({ ...task }));
      this.days = {};
      this.refreshUi(this.formatDateKey(this.selectedDate));
    });

    resetDayBtn.addEventListener('click', () => {
      const { completed } = this.getDayProgress(this.selectedDate);
      const { entry } = this.getDayEntry(this.selectedDate, false);
      const hasNotes = Boolean(entry?.notes);

      if (completed === 0 && !hasNotes) {
        return;
      }

      if (window.confirm('Reset every checkbox and clear the note for the selected day?')) {
        this.resetSelectedDay();
      }
    });

    addTaskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this.addTask(addTaskInput.value);
      addTaskInput.value = '';
      addTaskInput.focus();
    });

    dayNotesInput.addEventListener('change', () => {
      this.updateDayNotes(dayNotesInput.value);
    });

    restoreDefaultsBtn.addEventListener('click', () => {
      if (!window.confirm('Restore the standard Review images / Videos / Upscales / Publish workflow? Custom presets will be removed.')) {
        return;
      }

      this.restoreDefaultTasks();
    });

    document.addEventListener('keydown', (event) => this.handleKeyboardNavigation(event));
  }

  syncJumpInputs() {
    const viewYear = this.viewDate.getFullYear();
    const viewMonth = String(this.viewDate.getMonth() + 1).padStart(2, '0');
    const selectedYear = this.selectedDate.getFullYear();
    const selectedMonth = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const selectedDay = String(this.selectedDate.getDate()).padStart(2, '0');

    this.dom.jumpMonthInput.value = `${viewYear}-${viewMonth}`;
    this.dom.jumpDateInput.value = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  }

  handleKeyboardNavigation(event) {
    const focused = document.activeElement;

    if (!focused || !focused.classList.contains('calendar-day')) {
      return;
    }

    const gridButtons = Array.from(this.dom.calendarGrid.querySelectorAll('.calendar-day:not([disabled])'));

    if (gridButtons.length === 0) {
      return;
    }

    const currentIndex = gridButtons.indexOf(focused);

    if (currentIndex === -1) {
      return;
    }

    let targetIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        targetIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        targetIndex = Math.min(gridButtons.length - 1, currentIndex + 1);
        break;
      case 'ArrowUp':
        targetIndex = Math.max(0, currentIndex - 7);
        break;
      case 'ArrowDown':
        targetIndex = Math.min(gridButtons.length - 1, currentIndex + 7);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        focused.click();
        return;
      default:
        return;
    }

    if (targetIndex !== currentIndex) {
      event.preventDefault();
      gridButtons[targetIndex].focus();
    }
  }

  exportData() {
    const payload = {
      version: '1.2.0',
      tasks: this.tasks,
      days: this.days
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `midjourney-review-${new Date().toISOString().split('T')[0]}.json`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    window.setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid file.');
      }

      if (!Array.isArray(data.tasks) || !data.days || typeof data.days !== 'object') {
        throw new Error('Missing tasks or days data.');
      }

      this.tasks = this.normalizeTasks(data.tasks);
      this.days = this.normalizeDays(data.days, this.tasks);
      this.refreshUi(this.formatDateKey(this.selectedDate));
      alert('Import successful.');
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    } finally {
      this.dom.importInput.value = '';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MidjourneyCalendar();
});
