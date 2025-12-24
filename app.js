/*
  Midjourney Review Progress Calendar
  Author: AI Assistant
  Description: Multi-task daily tracker with persistent storage, import/export,
               and modern UI for Midjourney workflows.
*/

const STORAGE_KEYS = {
  tasks: 'mj-calendar:tasks',
  days: 'mj-calendar:days'
};

const DEFAULT_TASKS = [
  { id: 'review-images', label: 'Review images + upscale' },
  { id: 'review-videos', label: 'Review videos + extend' },
  { id: 'publish-favorites', label: 'Publish favourite images' }
];

class MidjourneyCalendar {
  constructor() {
    this.currentDate = new Date();
    this.viewDate = new Date();
    this.selectedDate = new Date();

    this.tasks = this.loadFromStorage(STORAGE_KEYS.tasks, DEFAULT_TASKS);
    this.days = this.loadFromStorage(STORAGE_KEYS.days, {});

    this.dom = this.bindDom();
    this.setupEventListeners();
    this.renderCalendar();
    this.renderTaskPanel();
    this.updateProgressStats();
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
      taskList: document.getElementById('taskList'),
      taskSummary: document.getElementById('taskSummary'),
      selectedDateLabel: document.getElementById('selectedDateLabel'),
      addTaskForm: document.getElementById('addTaskForm'),
      addTaskInput: document.getElementById('addTaskInput'),
      presetsList: document.getElementById('presetsList')
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

  getDayEntry(date) {
    const key = this.formatDateKey(date);
    if (!this.days[key]) {
      this.days[key] = { tasks: {} };
    }
    return { key, entry: this.days[key] };
  }

  toggleTask(date, taskId, value) {
    const { entry } = this.getDayEntry(date);
    entry.tasks[taskId] = value;
    this.persistState();
    this.renderCalendar();
    this.renderTaskPanel();
    this.updateProgressStats();
  }

  addTask(label) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `task-${Date.now()}`;
    const exists = this.tasks.some((t) => t.id === id || t.label.toLowerCase() === trimmed.toLowerCase());
    if (exists) return alert('Task already exists.');

    this.tasks.push({ id, label: trimmed });
    Object.keys(this.days).forEach((key) => {
      this.days[key].tasks[id] = false;
    });
    this.persistState();
    this.renderCalendar();
    this.renderTaskPanel();
    this.renderPresets();
  }

  getDayProgress(date) {
    const { entry } = this.getDayEntry(date);
    const total = this.tasks.length || 1;
    const completed = this.tasks.reduce((sum, task) => sum + (entry.tasks[task.id] ? 1 : 0), 0);
    const pct = completed / total;
    return { completed, total, pct };
  }

  renderCalendar(flashDateKey = null) {
    const { calendarGrid, monthYear } = this.dom;
    calendarGrid.innerHTML = '';

    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    monthYear.textContent = `${monthNames[month]} ${year}`;

    const firstOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstOfMonth);
    startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const cellKey = this.formatDateKey(cellDate);
      const isCurrentMonth = cellDate.getMonth() === month;

      const { pct, completed, total } = this.getDayProgress(cellDate);
      const hue = Math.round(pct * 120); // 0 = red, 120 = green
      const saturation = 80;
      const lightness = 90 - Math.round(pct * 25);
      const borderLightness = Math.max(lightness - 18, 32);

      const btn = document.createElement('button');
      btn.className = 'calendar-day';
      btn.textContent = cellDate.getDate();
      btn.setAttribute('type', 'button');
      btn.dataset.date = cellKey;
      btn.style.setProperty('--day-hue', hue);
      btn.style.setProperty('--day-lightness', `${lightness}%`);
      btn.style.setProperty('--day-border-lightness', `${borderLightness}%`);
      btn.dataset.pct = pct.toFixed(2);
      btn.title = `${completed}/${total} tasks done`;

      if (!isCurrentMonth) btn.classList.add('calendar-day--other-month');
      if (this.isToday(cellDate)) btn.classList.add('calendar-day--today');
      if (pct === 1) btn.classList.add('calendar-day--complete');
      if (pct > 0 && pct < 1) btn.classList.add('calendar-day--partial');
      if (pct === 0) btn.classList.add('calendar-day--empty');
      if (flashDateKey && cellKey === flashDateKey) {
        btn.classList.add('calendar-day--flash');
        btn.addEventListener('animationend', () => btn.classList.remove('calendar-day--flash'), { once: true });
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectedDate = cellDate;
        this.renderTaskPanel();
        this.highlightSelection(cellKey);
      });

      if (!isCurrentMonth) {
        btn.disabled = true;
        btn.setAttribute('tabindex', '-1');
      }

      calendarGrid.appendChild(btn);
    }

    this.highlightSelection(this.formatDateKey(this.selectedDate));
  }

  highlightSelection(targetKey) {
    const buttons = this.dom.calendarGrid.querySelectorAll('.calendar-day');
    buttons.forEach((btn) => {
      const key = btn.dataset.date;
      if (key === targetKey) {
        btn.classList.add('calendar-day--selected');
      } else {
        btn.classList.remove('calendar-day--selected');
      }
    });
  }

  renderTaskPanel() {
    const { taskList, selectedDateLabel, taskSummary } = this.dom;
    const { entry } = this.getDayEntry(this.selectedDate);
    const { completed, total, pct } = this.getDayProgress(this.selectedDate);

    selectedDateLabel.textContent = new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(this.selectedDate);
    taskSummary.textContent = `${completed}/${total} tasks done (${Math.round(pct * 100)}%)`;

    taskList.innerHTML = '';
    this.tasks.forEach((task) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'task-row';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(entry.tasks[task.id]);
      checkbox.addEventListener('change', () => this.toggleTask(this.selectedDate, task.id, checkbox.checked));

      const title = document.createElement('span');
      title.textContent = task.label;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(title);
      taskList.appendChild(wrapper);
    });

    const meterBars = document.querySelectorAll('.task-meter span');
    const activeSegments = Math.round(pct * meterBars.length);
    meterBars.forEach((bar, idx) => {
      if (idx < activeSegments) {
        bar.style.background = `linear-gradient(135deg, #7ae3ff, #9d7bff)`;
      } else {
        bar.style.background = 'rgba(255,255,255,0.12)';
      }
    });
  }

  renderPresets() {
    const { presetsList } = this.dom;
    presetsList.innerHTML = '';
    this.tasks.forEach((task) => {
      const chip = document.createElement('span');
      chip.className = 'pill';
      chip.textContent = task.label;
      presetsList.appendChild(chip);
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

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(visibleYear, visibleMonth, day);
      const { completed, total, pct } = this.getDayProgress(date);
      totalTasks += total;
      completedTasks += completed;
      if (pct === 1) completedDays += 1;
      else if (pct > 0) partialDays += 1;
    }

    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    progressStats.textContent = `${completedDays} complete days, ${partialDays} in-progress — ${completedTasks}/${totalTasks} tasks (${pct}%) this month`;
    progressStats.className = 'status';
    if (pct >= 80) progressStats.classList.add('status--success');
    else if (pct >= 40) progressStats.classList.add('status--warning');
    else progressStats.classList.add('status--info');
  }

  setupEventListeners() {
    const {
      prevBtn, nextBtn, jumpMonthInput, jumpDateInput,
      exportBtn, importBtn, importInput, clearAllBtn,
      addTaskForm, addTaskInput
    } = this.dom;

    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.viewDate.setMonth(this.viewDate.getMonth() - 1);
      this.renderCalendar();
      this.updateProgressStats();
      this.syncJumpInputs();
    });

    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.viewDate.setMonth(this.viewDate.getMonth() + 1);
      this.renderCalendar();
      this.updateProgressStats();
      this.syncJumpInputs();
    });

    jumpMonthInput.addEventListener('change', () => {
      if (!jumpMonthInput.value) return;
      const [year, month] = jumpMonthInput.value.split('-').map(Number);
      this.viewDate = new Date(year, month - 1, 1);
      this.renderCalendar();
      this.updateProgressStats();
      jumpDateInput.value = '';
    });

    jumpDateInput.addEventListener('change', () => {
      if (!jumpDateInput.value) return;
      const [year, month, day] = jumpDateInput.value.split('-').map(Number);
      this.viewDate = new Date(year, month - 1, 1);
      const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      this.selectedDate = new Date(year, month - 1, day);
      this.renderCalendar(key);
      this.updateProgressStats();
      this.syncJumpInputs();
      this.renderTaskPanel();
    });

    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.exportData();
    });

    importBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      importInput.click();
    });

    importInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this.importData(file);
    });

    clearAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm('Clear all tasks and progress?')) {
        this.tasks = [...DEFAULT_TASKS];
        this.days = {};
        this.persistState();
        this.renderCalendar();
        this.renderTaskPanel();
        this.renderPresets();
        this.updateProgressStats();
        this.syncJumpInputs();
      }
    });

    addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTask(addTaskInput.value);
      addTaskInput.value = '';
    });

    document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

    this.syncJumpInputs();
    this.renderPresets();
  }

  syncJumpInputs() {
    const y = this.viewDate.getFullYear();
    const m = String(this.viewDate.getMonth() + 1).padStart(2, '0');
    this.dom.jumpMonthInput.value = `${y}-${m}`;
  }

  handleKeyboardNavigation(e) {
    const focused = document.activeElement;
    if (!focused || !focused.classList.contains('calendar-day')) return;

    const gridButtons = Array.from(this.dom.calendarGrid.querySelectorAll('.calendar-day:not([disabled])'));
    if (!gridButtons.length) return;

    const currentIndex = gridButtons.indexOf(focused);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;

    switch (e.key) {
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
        e.preventDefault();
        focused.click();
        return;
      default:
        return;
    }

    if (targetIndex !== currentIndex && targetIndex >= 0 && targetIndex < gridButtons.length) {
      e.preventDefault();
      gridButtons[targetIndex].focus();
    }
  }

  exportData() {
    const payload = {
      version: '1.1.0',
      tasks: this.tasks,
      days: this.days
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `midjourney-review-${new Date().toISOString().split('T')[0]}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') throw new Error('Invalid file');
      if (!Array.isArray(data.tasks) || !data.days || typeof data.days !== 'object') {
        throw new Error('Missing required keys');
      }

      this.tasks = data.tasks;
      this.days = data.days;
      this.persistState();
      this.renderCalendar();
      this.renderTaskPanel();
      this.renderPresets();
      this.updateProgressStats();
      alert('Import successful!');
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      this.dom.importInput.value = '';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => new MidjourneyCalendar());
