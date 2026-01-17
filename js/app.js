// ================= IMMEDIATE UPDATE LISTENER =================
// Keep this at the VERY TOP (Line 1)
// ================= IMMEDIATE UPDATE LISTENER =================
// Keep this at the VERY TOP of app.js (Line 1)
if ("serviceWorker" in navigator) {
    
    // 1. Listen for the "Reload" command from the Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FORCE_RELOAD') {
            console.log("Force Update Triggered");
            window.location.reload();
        }
    });

    // 2. Listen for a new Service Worker taking control
    // (This ensures the "Rename Trick" refreshes the page instantly)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log("New Service Worker active. Reloading...");
        window.location.reload();
    });

    // 3. Register the NEW filename
    navigator.serviceWorker.register("./sw.js") // <--- NEW NAME
        .then(reg => {
             // Force a check immediately on load
             reg.update();
             console.log("SW Registered");
        })
        .catch(err => console.log("SW Fail", err));
        
    // 4. Check connection recovery
    window.addEventListener('online', () => {
         fetch('./js/data.js', { cache: 'no-store' }).catch(() => {});
    });
}
// ================= END SERVICE WORKER SETUP =================
// ==================== ROOM POPUP LOGIC ====================
// Define the global function immediately
window.showRoomPopup = function(event, code) {
    event.stopPropagation();
    let popup = document.getElementById('room-info-popup');
    
    // Create it if it doesn't exist yet
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'room-info-popup';
        document.body.appendChild(popup);
    }

    const location = (typeof ROOM_LOCATIONS !== 'undefined' && ROOM_LOCATIONS[code]) 
                     ? ROOM_LOCATIONS[code] 
                     : "Location details not available";

    popup.innerHTML = `<div><span style="color:var(--accent-color)">${code}:</span> ${location}</div>`;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    popup.style.display = 'block';
    popup.style.top = `${rect.bottom + scrollTop + 8}px`;
    popup.style.left = `${rect.left + scrollLeft}px`;

    // Handle overflow
    if (rect.left + 220 > window.innerWidth) {
        popup.style.left = 'auto';
        popup.style.right = '10px';
    }
};

// Global hider
document.addEventListener('click', () => {
    const popup = document.getElementById('room-info-popup');
    if (popup) popup.style.display = 'none';
});
document.addEventListener('scroll', () => {
    const popup = document.getElementById('room-info-popup');
    if (popup) popup.style.display = 'none';
}, {capture: true});

// ==================== TIMETABLE APPLICATION ====================
const TimetableApp = (function() {
  let state = {
    currentSchedule: [],
    currentDayIndex: 0,
    currentBatch: 'A1',
    currentView: 'swipe',
    isDragging: false,
    startX: 0,
    startY: 0,
    currentTranslate: 0,
    prevTranslate: 0,
    totalDays: 6,
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    activeHighlightInterval: null,
    isVerticalScroll: false,
    isVerticalScrollPossible: false,
    initialScrollTop: 0,
    isTeacherMode: false,
    wheelCooldown: false
  };

  const dom = {
    daysTrack: null,
    timetableContainer: null,
    compactContainer: null,
    tableBody: null,
    batchGrid: null,
    floatingBatch: null,
    filterArrow: null,
    filterPanel: null,
    dropdownContent: null
  };

  function init() {
    console.log('Initializing Timetable App...');
    cacheDOMElements();
    loadSavedPreferences();
    setupEventListeners();
    initializeBatchDropdown();
    
    const teacherBtn = document.getElementById('teacher-mode-btn');
    if(teacherBtn) teacherBtn.addEventListener('click', toggleTeacherMode);
    
    initTeacherSearch();
    renderInitialViews();
    startActiveHighlighting();

    // FIX LAYOUT
    setTimeout(() => {
        handleResize();
        jumpToDay(state.currentDayIndex);
        highlightActiveClass();
    }, 200);
  }

  function cacheDOMElements() {
    dom.daysTrack = document.getElementById('daysTrack');
    dom.timetableContainer = document.getElementById('timetable-container');
    dom.compactContainer = document.getElementById('compact-container');
    dom.tableBody = document.querySelector('.weekly-table tbody');
    dom.batchGrid = document.getElementById('batchGrid');
    dom.floatingBatch = document.getElementById('floating-batch');
    dom.filterArrow = document.getElementById('filter-arrow');
    dom.filterPanel = document.getElementById('filter-panel');
    dom.dropdownContent = document.getElementById('batch-dropdown-content');
  }

  function loadSavedPreferences() {
    const savedBatch = Storage.get('selectedBatch', 'A1');
    state.currentBatch = savedBatch;
    
    if (typeof scheduleMap !== 'undefined' && scheduleMap[savedBatch]) {
        state.currentSchedule = scheduleMap[savedBatch];
    } else {
        state.currentSchedule = (typeof scheduleA1 !== 'undefined') ? scheduleA1 : [];
    }
    
    state.currentView = Storage.get('preferredView', 'swipe');
    const savedTheme = Storage.get('theme', 'dark');
    document.body.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-btn');
    if(themeBtn) themeBtn.textContent = savedTheme === 'dark' ? '☀' : '🌙';
    
    const today = DateTime.getCurrentDay();
    state.currentDayIndex = (today >= 1 && today <= 6) ? today - 1 : 0;
  }

  function setupEventListeners() {
    if (dom.daysTrack) {
      dom.daysTrack.addEventListener('touchstart', handleTouchStart, { passive: false });
      dom.daysTrack.addEventListener('touchmove', handleTouchMove, { passive: false });
      dom.daysTrack.addEventListener('touchend', handleTouchEnd);
      dom.daysTrack.addEventListener('mousedown', handleMouseStart);
      dom.daysTrack.addEventListener('mousemove', handleMouseMove);
      dom.daysTrack.addEventListener('mouseup', handleMouseEnd);
      dom.daysTrack.addEventListener('mouseleave', handleMouseLeave);
    }
    if (dom.timetableContainer) {
        dom.timetableContainer.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('resize', debounce(handleResize, 200));
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyboardNavigation);
  }
  
  // ==================== RENDERING ====================
  function renderInitialViews() {
    updateBatchLabels(state.currentBatch);
    setViewMode(state.currentView); 
    renderMobileView();
    renderDesktopView();
  }

  function updateBatchLabels(batchName) {
    if (dom.floatingBatch) dom.floatingBatch.textContent = `BATCH ${batchName}`;
    const cornerLabel = document.getElementById('table-corner-label');
    if (cornerLabel) {
          cornerLabel.innerHTML = `
              <div style="display: inline-block; font-size: 0.9rem; color: var(--accent-color); font-weight: 800; border: 1px solid var(--accent-color); background: rgba(187, 134, 252, 0.1); border-radius: 6px; padding: 1px 8px; margin-bottom: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); letter-spacing: 0.5px;">
                  ${batchName}
              </div>
              <div style="font-size: 0.65rem; opacity: 0.6; font-weight: 600; letter-spacing: 1px;">TIME</div>
          `;
    }
  }

  function renderMobileView() {
    if (!dom.daysTrack) return;
    dom.daysTrack.innerHTML = '';
    for (let day = 1; day <= 6; day++) {
      dom.daysTrack.appendChild(createDayView(day));
    }
  }

  function createDayView(day) {
    const dayView = document.createElement('div');
    dayView.className = 'day-view';
    dayView.setAttribute('data-day-index', day);
    dayView.id = `day-${day}`;

    const header = document.createElement('h2');
    header.className = 'day-header';
    header.textContent = state.dayNames[day];
    dayView.appendChild(header);

    const dayClasses = state.currentSchedule
      .filter(s => s.day === day)
      .sort((a, b) => a.start - b.start);

    if (dayClasses.length === 0) {
      dayView.appendChild(createNoClassesCard());
    } else {
      renderDayClasses(dayView, dayClasses);
    }
    return dayView;
  }

  function renderDayClasses(container, classes) {
    let lastEndTime = classes[0].start;
    classes.forEach((cls, index) => {
      if (index > 0 && cls.start > lastEndTime) {
        const gapStart = lastEndTime;
        const gapEnd = cls.start;
        if (gapStart <= 12 && gapEnd >= 13) {
          if (12 > gapStart) container.appendChild(createBreakCard(gapStart, 12, "Break"));
          container.appendChild(createBreakCard(12, 13, "Lunch Break"));
          if (gapEnd > 13) container.appendChild(createBreakCard(13, gapEnd, "Break"));
        } else {
          container.appendChild(createBreakCard(gapStart, gapEnd, "Break"));
        }
      }
      container.appendChild(createClassCard(cls));
      lastEndTime = cls.start + cls.duration;
    });
  }

  function createNoClassesCard() {
    const card = document.createElement('div');
    card.className = 'break-card';
    card.innerHTML = `<div class="break-header">No Classes Today! 🥳</div>`;
    return card;
  }

 function createClassCard(cls) {
    const displayTeacher = getTeacherDisplayName(cls.teacher);
    const displayTitle = getSubjectFullTitle(cls.title, cls.type) || cls.title;
    
    const card = document.createElement('div');
    card.className = `class-card type-${cls.type}`;
    card.dataset.startHour = cls.start.toString();
    card.dataset.day = cls.day.toString();
    card.innerHTML = `
      <div class="time-slot">${formatTimeRange(cls.start, cls.duration)}</div>
      <div class="subject-name">${displayTitle}</div>
      <div class="card-footer">
        <span class="info-badge" style="cursor:pointer; display:inline-flex; align-items:center;" onclick="window.showRoomPopup(event, '${cls.code}')">
            🏛 ${cls.code} <span class="info-icon">i</span>
        </span>
        <span class="info-badge">👨‍🏫 ${displayTeacher}</span>
        <span class="info-badge">${cls.type.toUpperCase()}</span>
      </div>
    `;
    return card;
  }

  function createBreakCard(start, end, title) {
    const breakCard = document.createElement('div');
    breakCard.className = 'break-card';
    breakCard.innerHTML = `
      <div class="break-header">${title}</div>
      <div class="break-time-text">${formatTimeRange(start, end - start)}</div>
    `;
    return breakCard;
  }

  // --- DESKTOP VIEW ---
   function renderDesktopView() {
    if (!dom.tableBody) return;
    dom.tableBody.innerHTML = '';
    const hours = [9, 10, 11, 12, 13, 14, 15, 16];
    const occupiedCells = new Set();
    
    hours.forEach(hour => {
      const row = document.createElement('tr');
      row.setAttribute('data-hour', hour); 

      const timeCell = document.createElement('td');
      const displayHour = hour % 12 || 12;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hStr = displayHour < 10 ? '0' + displayHour : displayHour;

      timeCell.innerHTML = `
         <div style="line-height: 1.1;">
            ${hStr}:00<br>
            <span style="font-size: 0.85em; opacity: 0.7;">${hStr}:50</span>
        </div>
        <div style="font-size: 0.75em; margin-top: 4px; opacity: 0.6;">${ampm}</div>
      `;
      row.appendChild(timeCell);

      for (let day = 1; day <= 6; day++) {
        const cellKey = `${hour}-${day}`;
        if (occupiedCells.has(cellKey)) continue;
        
        const cls = state.currentSchedule.find(s => s.day === day && s.start === hour);
        
        if (cls) {
          const cell = createTableCell(cls);
          if (cls.duration > 1) {
            for (let i = 1; i < cls.duration; i++) occupiedCells.add(`${hour + i}-${day}`);
          }
          row.appendChild(cell);
        } else {
          const cell = createEmptyTableCell(day, hour);
          row.appendChild(cell);
        }
      }
      dom.tableBody.appendChild(row);
    });
    
    const hintRow = document.createElement('tr');
    const hintCell = document.createElement('td');
    hintCell.colSpan = "7";
    hintCell.style.cssText = `text-align: center; padding: 0px 12px 12px 12px; color: var(--accent-color); font-size: 0.8rem; border: none; opacity: 0.8; font-weight: 600; letter-spacing: 0.5px;`;
    hintCell.innerHTML = "☝️ Tap any class block for details";
    hintRow.appendChild(hintCell);
    dom.tableBody.appendChild(hintRow);
  }

  function createTableCell(cls) {
    const cell = document.createElement('td');
    cell.setAttribute('data-day', cls.day);
    cell.className = `cell-${cls.type}`;
    cell.style.cursor = 'pointer';
    cell.onclick = () => openDetailsModal(cls);

    if (cls.duration > 1) cell.rowSpan = cls.duration;
    
    const displayTitle = getSubjectFullTitle(cls.title, cls.type) || cls.title;
    const shortTitle = displayTitle.includes('(') ? displayTitle.split('(')[0].trim() : displayTitle;

    cell.innerHTML = `<span class="cell-subject" title="${displayTitle}">${shortTitle}</span><span class="cell-room">${cls.code}</span>`;
    return cell;
  }

  function createEmptyTableCell(day, hour) {
    const cell = document.createElement('td');
    cell.setAttribute('data-day', day);
    if (hour === 12) {
      cell.className = 'cell-break';
      cell.innerHTML = '<span style="font-size:0.6rem; opacity:0.5;">LUNCH</span>';
    }
    return cell;
  }

  // --- BATCH MANAGEMENT ---
  function initializeBatchDropdown() {
    const current = state.currentBatch;
    const is128 = /^[FEH]/.test(current); 
    
    // Apply Global Tag
    if (is128) {
        document.body.classList.add('series-128');
    } else {
        document.body.classList.remove('series-128');
    }

    const seriesBtn = document.getElementById('series-text');
    if (seriesBtn) seriesBtn.textContent = is128 ? "128 Series" : "62 Series";
    
    updateTriggerText();
    populateBatchGrid(is128 ? "128" : "62");
  }

  function toggleSeries() {
    const seriesText = document.getElementById('series-text');
    if (!seriesText) return;

    const isCurrently62 = seriesText.textContent.includes("62");
    const newType = isCurrently62 ? "128" : "62";

    if (newType === "128") {
        document.body.classList.add('series-128');
    } else {
        document.body.classList.remove('series-128');
    }

    seriesText.textContent = `${newType} Series`;
    populateBatchGrid(newType);
  }

  function toggleBatchGrid(forceState) {
    const grid = document.getElementById('floating-batch-grid');
    if (!grid) return;
    if (typeof forceState === 'boolean') {
        forceState ? grid.classList.remove('hidden') : grid.classList.add('hidden');
    } else {
        grid.classList.toggle('hidden');
    }
  }

  function populateBatchGrid(forcedType) {
    const grid = document.getElementById('floating-batch-grid');
    const seriesText = document.getElementById('series-text');
    const type = forcedType || (seriesText?.textContent.includes("128") ? "128" : "62");

    if (!grid || typeof scheduleMap === 'undefined') return;

    grid.innerHTML = '';
    const allBatches = Object.keys(scheduleMap);
    const filteredBatches = allBatches.filter(b => {
        return type === "128" ? /^[EFH]/.test(b) : /^[ABCDG]/.test(b);
    });

    filteredBatches.sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    filteredBatches.forEach(batch => {
        const btn = document.createElement('button');
        btn.className = 'batch-btn';
        if(batch === state.currentBatch) btn.classList.add('active-batch');
        btn.textContent = batch;
        btn.onclick = () => {
            selectBatch(batch);
            toggleBatchGrid(false); 
        };
        grid.appendChild(btn);
    });
    
    if(filteredBatches.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:10px;">No Data</div>';
    }
    updateGridSelection();
  }

  function updateTriggerText() {
      const btnText = document.getElementById('trigger-text');
      if(btnText) btnText.textContent = state.currentBatch;
  }
  
  function updateGridSelection() {
    document.querySelectorAll('.batch-btn').forEach(btn => {
      btn.classList.remove('active-batch');
      if (btn.textContent === state.currentBatch) {
        btn.classList.add('active-batch');
      }
    });
  }
  
  function selectBatch(batchName) {
    state.currentBatch = batchName;
    
    // Auto-detect Series
    const is128 = /^[FEH]/.test(batchName);
    if (is128) {
        document.body.classList.add('series-128');
    } else {
        document.body.classList.remove('series-128');
    }
    const seriesBtn = document.getElementById('series-text');
    if (seriesBtn) seriesBtn.textContent = is128 ? "128 Series" : "62 Series";

    if (typeof scheduleMap !== 'undefined' && scheduleMap[batchName]) {
        state.currentSchedule = scheduleMap[batchName];
    }
    Storage.set('selectedBatch', batchName);
    updateBatchLabels(batchName);
    updateTriggerText(); 
    updateGridSelection();
    renderMobileView();
    renderDesktopView();
    populateBatchGrid(is128 ? "128" : "62");
    
    setTimeout(() => {
        highlightActiveClass();
        jumpToDay(state.currentDayIndex);
    }, 50);
  }

  // ==================== VIEW MODE ====================
 function setViewMode(mode) {
    state.currentView = mode;
    Storage.set('preferredView', mode);
    document.querySelectorAll('#btn-swipe, #btn-table').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${mode}`);
    if(activeBtn) activeBtn.classList.add('active');
    if (mode === 'swipe') {
      dom.timetableContainer.classList.remove('hidden-view');
      dom.compactContainer.classList.add('hidden-view');
      setTimeout(() => {
          handleResize();
          jumpToDay(state.currentDayIndex);
      }, 50);
    } else {
      dom.timetableContainer.classList.add('hidden-view');
      dom.compactContainer.classList.remove('hidden-view');
    }
  }

  // ==================== NAVIGATION ====================
  function jumpToDay(index) {
    if (index < 0 || index >= state.totalDays) return;
    state.currentDayIndex = index;
    const trackWidth = dom.timetableContainer ? dom.timetableContainer.offsetWidth : window.innerWidth;
    state.currentTranslate = index * -trackWidth;
    state.prevTranslate = state.currentTranslate;
    if (dom.daysTrack) {
      dom.daysTrack.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1)';
      dom.daysTrack.style.transform = `translateX(${state.currentTranslate}px)`;
    }
    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.classList.toggle('active-day', parseInt(btn.dataset.day) === index + 1);
    });
  }

  function manualJumpToDay(dayNumber) {
    jumpToDay(dayNumber - 1);
  }

  // ==================== HIGHLIGHTING ====================
  function highlightActiveClass() {
    document.querySelectorAll('.active-now').forEach(el => el.classList.remove('active-now'));
    const currentDay = DateTime.getCurrentDay();
    const currentHour = DateTime.getCurrentHour();
    
    if (currentDay >= 1 && currentDay <= 6) {
      const activeClass = state.currentSchedule.find(cls => 
        cls.day === currentDay && 
        currentHour >= cls.start && 
        currentHour < (cls.start + cls.duration)
      );
      if (activeClass) {
        const dayView = document.querySelector(`#day-${currentDay}`);
        if (dayView) {
          const card = dayView.querySelector(`.class-card[data-start-hour="${activeClass.start}"]`);
          if (card) {
              card.classList.add('active-now');
              const dayViewEl = card.closest('.day-view');
              if (dayViewEl) {
                  dayViewEl.scrollTo({
                    top: card.offsetTop - dayViewEl.clientHeight / 2 + card.clientHeight / 2,
                    behavior: 'smooth'
                  });
              }
          }
        }
        const row = document.querySelector(`.weekly-table tr[data-hour="${activeClass.start}"]`);
        if (row) {
         const cell = row.querySelector(`td[data-day="${currentDay}"]`);
         if (cell && !cell.classList.contains('cell-break')) {
              cell.classList.add('active-now');
         }
        }
      }
    }
  }

  function startActiveHighlighting() {
    highlightActiveClass();
    state.activeHighlightInterval = setInterval(highlightActiveClass, 60000);
  }

  // ==================== SWIPE LOGIC ====================
  function handleTouchStart(e) {
    if (state.currentView !== 'swipe') return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
    const dayView = document.querySelector(`#day-${state.currentDayIndex + 1}`);
    if (dayView) {
      state.initialScrollTop = dayView.scrollTop;
      state.isVerticalScrollPossible = dayView.scrollHeight > dayView.clientHeight;
      state.isVerticalScroll = false;
    }
  }

  function handleTouchMove(e) {
    if (!state.isDragging || state.currentView !== 'swipe') return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - state.startX);
    const deltaY = Math.abs(touch.clientY - state.startY);
    if (state.isVerticalScrollPossible && deltaY > deltaX) {
        state.isVerticalScroll = true;
        state.isDragging = false;
        if (dom.timetableContainer) dom.timetableContainer.style.cursor = 'default';
        return;
    }
    if (deltaX > 5) {
        e.preventDefault();
        moveDrag(touch.clientX);
    }
  }

  function handleTouchEnd() {
    if (!state.isVerticalScroll) endDrag();
    else {
        state.isDragging = false;
        state.isVerticalScroll = false;
        if(dom.timetableContainer) dom.timetableContainer.style.cursor = 'grab';
    }
  }

  function handleMouseStart(e) { 
      if (state.currentView !== 'swipe') return;
      e.preventDefault();
      startDrag(e.clientX, e.clientY); 
  }
  function handleMouseMove(e) { if(state.isDragging) { e.preventDefault(); moveDrag(e.clientX); } }
  function handleMouseEnd() { endDrag(); }
  function handleMouseLeave() { if(state.isDragging) endDrag(); }

  function startDrag(x, y) {
    state.isDragging = true;
    state.startX = x;
    state.startY = y;
    if(dom.daysTrack) dom.daysTrack.style.transition = 'none';
  }

  function moveDrag(x) {
    state.currentTranslate = state.prevTranslate + (x - state.startX);
    if(dom.daysTrack) dom.daysTrack.style.transform = `translateX(${state.currentTranslate}px)`;
  }

  function endDrag() {
    if(!state.isDragging) return;
    state.isDragging = false;
    const movedBy = state.currentTranslate - state.prevTranslate;
    const containerWidth = dom.timetableContainer ? dom.timetableContainer.offsetWidth : window.innerWidth;
    const threshold = containerWidth / 4;
    
    if (movedBy < -threshold) {
      state.currentDayIndex = (state.currentDayIndex < state.totalDays - 1) ? state.currentDayIndex + 1 : 0;
    } else if (movedBy > threshold) {
      state.currentDayIndex = (state.currentDayIndex > 0) ? state.currentDayIndex - 1 : state.totalDays - 1;
    }
    jumpToDay(state.currentDayIndex);
  }

  // ==================== MODAL LOGIC ====================
  function openDetailsModal(cls) {
      const modal = document.getElementById('details-modal');
      if(!modal) return;

      const rawTitle = cls.title;
      const isFormatted = rawTitle.includes('('); 
      const displayTitle = isFormatted ? rawTitle : (getSubjectFullTitle(rawTitle, cls.type) || rawTitle);
      const displayTeacher = getTeacherDisplayName(cls.teacher);
      const displayTime = formatTimeRange(cls.start, cls.duration);
      
      let displayBatch = state.currentBatch;
      if (cls.batchNames && Array.isArray(cls.batchNames)) {
          displayBatch = cls.batchNames.join(', ');
      }

      document.getElementById('modal-subject').textContent = displayTitle;
      document.getElementById('modal-time').textContent = displayTime;
      document.getElementById('modal-type').textContent = cls.type.charAt(0).toUpperCase() + cls.type.slice(1);
      document.getElementById('modal-teacher').textContent = displayTeacher;
      document.getElementById('modal-batch').textContent = displayBatch;
      
      const roomEl = document.getElementById('modal-room');
      roomEl.innerHTML = `
        ${cls.code} 
        <span class="modal-glow-btn" onclick="window.showRoomPopup(event, '${cls.code}')">
          i
        </span>
      `;

      modal.classList.remove('hidden-modal');
      modal.setAttribute('aria-hidden', 'false');
      const closeBtn = document.getElementById('modal-close-btn');
      closeBtn.onclick = closeModal;
      modal.onclick = (e) => {
          if (e.target === modal) closeModal();
      };
  }

  function closeModal() {
      const modal = document.getElementById('details-modal');
      if(modal) {
          modal.classList.add('hidden-modal');
          modal.setAttribute('aria-hidden', 'true');
      }
  }

  // ==================== UI CONTROLS ====================
  function toggleFilterPanel() {
    const isExpanded = dom.filterPanel.classList.toggle('expanded');
    if (isExpanded) {
        const computedStyle = window.getComputedStyle(dom.filterPanel);
        if (computedStyle.position === 'static') dom.filterPanel.style.position = 'relative';
        dom.filterPanel.style.zIndex = '1001';
    } else {
        dom.filterPanel.style.zIndex = ''; 
        dom.filterPanel.style.position = '';
    }

    if (dom.filterArrow) {
      dom.filterArrow.textContent = isExpanded ? '▲' : '▼';
    }

    let backdrop = document.getElementById('filter-backdrop');
    if (isExpanded) {
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'filter-backdrop';
            backdrop.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1000; background: transparent; touch-action: none;`;
            
            const closeAndBlock = (e) => {
                if (e.cancelable) e.preventDefault();
                e.stopPropagation();
                toggleFilterPanel();
            };
            backdrop.addEventListener('click', closeAndBlock);
            backdrop.addEventListener('touchstart', closeAndBlock, { passive: false });
            backdrop.addEventListener('wheel', closeAndBlock, { passive: false });
            document.body.appendChild(backdrop);
        }
    } else {
        if (backdrop) backdrop.remove();
    }
    toggleBatchGrid(false);
  }

  function handleOutsideClick(e) {
    const filterPanel = dom.filterPanel;
    const toggleBtn = document.querySelector('.filter-toggle-btn');
    const teacherBtn = document.getElementById('teacher-mode-btn');
    if (filterPanel && filterPanel.classList.contains('expanded')) {
      if (!filterPanel.contains(e.target) && !toggleBtn.contains(e.target) && !teacherBtn.contains(e.target)) {
        toggleFilterPanel();
      }
    }
  }

  function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    Storage.set('theme', newTheme);
    const btn = document.getElementById('theme-btn');
    if(btn) btn.textContent = newTheme === 'dark' ? '☀' : '🌙';
  }

  function handleResize() {
    jumpToDay(state.currentDayIndex);
  }

  function handleKeyboardNavigation(e) {
    if (state.currentView !== 'swipe') return;
    if (e.key === 'ArrowRight') jumpToDay(state.currentDayIndex < 5 ? state.currentDayIndex + 1 : 0);
    if (e.key === 'ArrowLeft') jumpToDay(state.currentDayIndex > 0 ? state.currentDayIndex - 1 : 5);
  }

  // ==================== TEACHER MODE ====================
  function toggleTeacherMode() {
    state.isTeacherMode = !state.isTeacherMode;
    const btn = document.getElementById('teacher-mode-btn');
    const studentControls = document.getElementById('student-controls');
    const teacherControls = document.getElementById('teacher-controls');
    if (btn) btn.classList.toggle('active-mode', state.isTeacherMode);
    
    if (state.isTeacherMode) {
      if (studentControls) studentControls.classList.add('hidden');
      if (teacherControls) teacherControls.classList.remove('hidden');
      if (dom.filterPanel) {
          dom.filterPanel.classList.add('expanded');
          dom.filterPanel.style.zIndex = '100'; 
          if(dom.filterArrow) dom.filterArrow.textContent = '▲';
      }
      setTimeout(() => {
          const searchInput = document.getElementById('teacher-search');
          if (searchInput) searchInput.focus();
      }, 300);
    } else {
      if (studentControls) studentControls.classList.remove('hidden');
      if (teacherControls) teacherControls.classList.add('hidden');

      const viewModeButtons = document.querySelector('.filter-group:nth-child(2) .filter-options');
      const jumpToDayButtons = document.querySelector('.filter-group:nth-child(3) .filter-options');
      if (viewModeButtons) {
          viewModeButtons.style.visibility = 'visible';
          viewModeButtons.style.opacity = '1';
      }
      if (jumpToDayButtons) {
          jumpToDayButtons.style.visibility = 'visible';
          jumpToDayButtons.style.opacity = '1';
      }

      const searchInput = document.getElementById('teacher-search');
      const searchList = document.getElementById('search-suggestions');
      if (searchInput) searchInput.value = '';
      if (searchList) searchList.innerHTML = '';
      selectBatch(state.currentBatch);
    }
  }

  function initTeacherSearch() {
    const input = document.getElementById('teacher-search');
    const list = document.getElementById('search-suggestions');
    if (!input || !list) return;

    const toggleOtherGroups = (show) => {
        const group2 = document.querySelector('.filter-group:nth-child(2)');
        const group3 = document.querySelector('.filter-group:nth-child(3)');
        const displayValue = show ? 'flex' : 'none';
        if (group2) group2.style.display = displayValue;
        if (group3) group3.style.display = displayValue;
        
        if (!show) {
            list.style.position = 'relative';
            list.style.boxShadow = 'none';
            list.style.border = 'none';
        } else {
            list.style.position = '';
            list.style.boxShadow = '';
            list.style.border = '';
        }
    };

    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        list.innerHTML = ''; 

        if (val.length < 1) {
            toggleOtherGroups(true); 
            return;
        }
        toggleOtherGroups(false);

        let allFaculty = [];
        if (typeof facultyNames !== 'undefined') {
            Object.entries(facultyNames).forEach(([code, name]) => 
                allFaculty.push({ code, name, source: '62' }));
        }
        if (typeof facultyNames128 !== 'undefined') {
            Object.entries(facultyNames128).forEach(([code, name]) => 
                allFaculty.push({ code, name, source: '128' }));
        }

        let matches = allFaculty.filter(f => 
            f.code.toLowerCase().includes(val) || f.name.toLowerCase().includes(val)
        );

        matches.sort((a, b) => {
             const aCodeStart = a.code.toLowerCase().startsWith(val);
             const bCodeStart = b.code.toLowerCase().startsWith(val);
             if (aCodeStart && !bCodeStart) return -1;
             if (!aCodeStart && bCodeStart) return 1;
             return a.name.localeCompare(b.name);
        });

        if (matches.length === 0) {
            list.innerHTML = '<div style="padding:15px; opacity:0.6;">No teachers found</div>';
        } else {
             matches.slice(0, 15).forEach(f => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                const codeDisplay = f.source === '128' ? `${f.code} (128)` : f.code;
                div.innerHTML = `<span class="s-code">${codeDisplay}</span> <span class="s-name">${f.name}</span>`;
                div.onclick = () => {
                    loadTeacherSchedule(f.code, f.name);
                    input.value = `${f.name} (${codeDisplay})`;
                    list.innerHTML = '';
                    toggleFilterPanel(); 
                    setTimeout(() => toggleOtherGroups(true), 300);
                };
                list.appendChild(div);
            });
        }
    });
  }

  function handleWheel(e) {
    if (state.currentView !== 'swipe') return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      if (Math.abs(e.deltaX) < 20) return;
      if (state.wheelCooldown) return;
      state.wheelCooldown = true;
      setTimeout(() => { state.wheelCooldown = false; }, 800);
      if (e.deltaX > 0) {
        jumpToDay(state.currentDayIndex < state.totalDays - 1 ? state.currentDayIndex + 1 : 0);
      } else {
        jumpToDay(state.currentDayIndex > 0 ? state.currentDayIndex - 1 : state.totalDays - 1);
      }
    }
  }

  function loadTeacherSchedule(targetCode, teacherName) {
    if (dom.selectedBatchLabel) dom.selectedBatchLabel.textContent = `Teacher: ${targetCode}`;
    if (dom.floatingBatch) dom.floatingBatch.textContent = `PROF. ${targetCode}`;

    const slotMap = new Map();
    if (typeof scheduleMap !== 'undefined') {
      Object.keys(scheduleMap).forEach(batchName => {
        const batchClasses = scheduleMap[batchName];
        batchClasses.forEach(cls => {
           const teachers = cls.teacher.split('/').map(t => t.trim());
           if (teachers.includes(targetCode)) {
               const key = `${cls.day}-${cls.start}`;
               if (!slotMap.has(key)) {
                  slotMap.set(key, { ...cls, batchNames: [batchName] });
               } else {
                   const existing = slotMap.get(key);
                   if (!existing.batchNames.includes(batchName)) {
                       existing.batchNames.push(batchName);
                   }
               }
           }
        });
      });
    }

    const aggregatedSchedule = Array.from(slotMap.values()).map(cls => {
        const fullName = getSubjectFullTitle(cls.title, cls.type) || cls.title;
        const uniqueBatches = cls.batchNames.sort((a, b) => 
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );
        return {
            ...cls,
            title: `${fullName} (${uniqueBatches.join(', ')})` 
        };
    });
    state.currentSchedule = aggregatedSchedule;
    renderMobileView();
    renderDesktopView();
    jumpToDay(state.currentDayIndex);
  }
// --- NEW: Force Check Function ---
  function forceUpdateCheck() {
    console.log("Checking for updates...");
    // We add ?t=Timestamp to force the browser to actually ask the network
    fetch(`./js/data.js?t=${Date.now()}`)
        .then(() => console.log("Check complete"))
        .catch(() => console.log("Check failed (offline)"));
  }
  // Public API
  return {
    init,
    toggleFilterPanel,
    toggleTheme,
    selectBatch,
    setViewMode,
    manualJumpToDay,
    toggleSeries,
    toggleBatchGrid,
      forceUpdateCheck
  };
})();

// Start
document.addEventListener('DOMContentLoaded', () => {
    TimetableApp.init();
    
    // Check for updates immediately on load
    setTimeout(() => TimetableApp.forceUpdateCheck(), 1000); 
});

// Check for updates whenever internet comes back
window.addEventListener('online', () => {
    console.log("Back online! Checking for data...");
    TimetableApp.forceUpdateCheck();
});


