/*
  Midjourney Review Progress Calendar
  Author: Perplexity AI Assistant
  Description: Single-page application allowing users to track reviewed calendar days,
               jump between months/dates, and import/export progress as JSON.
*/

class MidjourneyCalendar {
  constructor() {
    // Core state
    this.currentDate = new Date(); // System today
    this.viewDate = new Date(); // Month currently displayed

    // Persisted review data, key = 'YYYY-MM-DD', value = true
    this.reviewData = {};

    // Cached DOM references
    this.dom = {
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
      clearAllBtn: document.getElementById('clearAllBtn')
    };

    // Initialize application
    this.setupEventListeners();
    this.renderCalendar();
    this.updateProgressStats();
  }

  /* ==============================
     Helper / Utility Functions
  ============================== */

  /**
   * formatDateKey
   * Converts a JS Date object to ISO string key YYYY-MM-DD
   */
  formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Checks if provided date is today (system date) */
  isToday(date) {
    return this.formatDateKey(date) === this.formatDateKey(this.currentDate);
  }

  /** Checks if date has been marked reviewed */
  isReviewed(date) {
    return this.reviewData[this.formatDateKey(date)] === true;
  }

  /** Toggle the reviewed state of a date */
  toggleReview(date) {
    const key = this.formatDateKey(date);
    if (this.reviewData[key]) {
      delete this.reviewData[key];
    } else {
      this.reviewData[key] = true;
    }
    this.updateProgressStats();
  }

  /* ==============================
     Rendering Functions
  ============================== */

  /**
   * renderCalendar
   * Generates 6-week (42-day) grid starting Sunday before month 1st.
   */
  renderCalendar(flashDateKey = null) {
    const { calendarGrid, monthYear } = this.dom;
    calendarGrid.innerHTML = '';

    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    // Header text
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    monthYear.textContent = `${monthNames[month]} ${year}`;

    // Determine the first cell date (Sunday before the 1st)
    const firstOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstOfMonth);
    startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    // Create 42 day cells
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const cellKey = this.formatDateKey(cellDate);
      const isCurrentMonth = cellDate.getMonth() === month;

      const btn = document.createElement('button');
      btn.className = 'calendar-day';
      btn.textContent = cellDate.getDate();
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-pressed', this.isReviewed(cellDate));

      // State classes
      if (!isCurrentMonth) btn.classList.add('calendar-day--other-month');
      if (this.isToday(cellDate)) btn.classList.add('calendar-day--today');
      if (this.isReviewed(cellDate)) btn.classList.add('calendar-day--reviewed');
      if (flashDateKey && cellKey === flashDateKey) {
        btn.classList.add('calendar-day--flash');
        // Remove flash class after animation end to allow future flashes
        btn.addEventListener('animationend', () => btn.classList.remove('calendar-day--flash'), { once: true });
      }

      // Only current month days are interactive
      if (isCurrentMonth) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleReview(cellDate);
          // Re-render to update styles consistently
          this.renderCalendar();
        });
      } else {
        btn.disabled = true;
        btn.setAttribute('tabindex', '-1');
      }

      calendarGrid.appendChild(btn);
    }
  }

  /**
   * updateProgressStats
   * Updates the statistics banner with counts & styling.
   */
  updateProgressStats() {
    const { progressStats } = this.dom;

    const visibleYear = this.viewDate.getFullYear();
    const visibleMonth = this.viewDate.getMonth();
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();

    // Count reviewed days in the current visible month
    let monthReviewed = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(visibleYear, visibleMonth, day);
      const key = this.formatDateKey(date);
      if (this.reviewData[key] === true) {
        monthReviewed++;
      }
    }

    const totalReviewed = Object.keys(this.reviewData).length;
    const percentage = daysInMonth > 0 ? Math.round((monthReviewed / daysInMonth) * 100) : 0;
    
    progressStats.textContent = `Reviewed ${monthReviewed} / ${daysInMonth} days this month (${percentage}%) — Total: ${totalReviewed}`;

    // Adjust status type classes
    progressStats.className = 'status';
    const pct = (monthReviewed / daysInMonth);
    if (pct >= 0.8) progressStats.classList.add('status--success');
    else if (pct >= 0.4) progressStats.classList.add('status--warning');
    else progressStats.classList.add('status--info');
  }

  /* ==============================
     Navigation & Event Binding
  ============================== */
  setupEventListeners() {
    const {
      prevBtn, nextBtn, jumpMonthInput, jumpDateInput,
      exportBtn, importBtn, importInput, clearAllBtn
    } = this.dom;

    // Month navigation - using event delegation to prevent interference
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

    // Jump to month input
    jumpMonthInput.addEventListener('change', () => {
      if (!jumpMonthInput.value) return;
      const [year, month] = jumpMonthInput.value.split('-').map(Number);
      this.viewDate = new Date(year, month - 1, 1);
      this.renderCalendar();
      this.updateProgressStats();
      // Clear specific date highlight
      jumpDateInput.value = '';
    });

    // Jump to date input
    jumpDateInput.addEventListener('change', () => {
      if (!jumpDateInput.value) return;
      const [year, month, day] = jumpDateInput.value.split('-').map(Number);
      this.viewDate = new Date(year, month - 1, 1);
      const key = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      this.renderCalendar(key); // Flash this date
      this.updateProgressStats();
      this.syncJumpInputs();
    });

    // Export JSON - prevent event bubbling
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.exportData();
    });

    // Import JSON
    importBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      importInput.click();
    });
    
    importInput.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (file) this.importData(file);
    });

    // Clear all data
    clearAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm('Clear all reviewed days?')) {
        this.reviewData = {};
        this.renderCalendar();
        this.updateProgressStats();
      }
    });

    // Keyboard arrow navigation inside grid
    document.addEventListener('keydown', e => this.handleKeyboardNavigation(e));

    // Initialize jumpMonth input with current month
    this.syncJumpInputs();
  }

  /** Sync jump inputs with the current visible month */
  syncJumpInputs() {
    const y = this.viewDate.getFullYear();
    const m = String(this.viewDate.getMonth() + 1).padStart(2,'0');
    this.dom.jumpMonthInput.value = `${y}-${m}`;
  }

  /** Handle arrow key navigation across day cells */
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

  /* ==============================
     Import / Export
  ============================== */
  exportData() {
    try {
      const json = JSON.stringify(this.reviewData, null, 2);
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

      setTimeout(() => alert('Export successful!'), 150);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid JSON format');
      // Merge
      this.reviewData = { ...this.reviewData, ...data };
      this.renderCalendar();
      this.updateProgressStats();
      alert('Import successful!');
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      this.dom.importInput.value = '';
    }
  }
}

// Bootstrap when DOM ready
window.addEventListener('DOMContentLoaded', () => new MidjourneyCalendar());