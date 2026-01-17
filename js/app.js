// ==================== ROOM POPUP LOGIC ====================
// 1. Create the popup element once and add to body
const roomPopup = document.createElement('div');
roomPopup.id = 'room-info-popup';
document.body.appendChild(roomPopup);

// 2. Function to Show Popup
window.showRoomPopup = function(event, code) {
    // Stop the tap from immediately triggering the "hide" listener
    event.stopPropagation();

    // Get Data
    // Ensure ROOM_LOCATIONS is defined (from data.js)
    const location = (typeof ROOM_LOCATIONS !== 'undefined' && ROOM_LOCATIONS[code]) 
                     ? ROOM_LOCATIONS[code] 
                     : "Location details not available";

    // Set Content
    roomPopup.innerHTML = `<div><span style="color:var(--accent-color)">${code}:</span> ${location}</div>`;
    
    // Position it
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    roomPopup.style.display = 'block';
    roomPopup.style.top = `${rect.bottom + scrollTop + 8}px`; // 8px below the badge
    roomPopup.style.left = `${rect.left + scrollLeft}px`;

    // Handle right edge overflow
    if (rect.left + 220 > window.innerWidth) {
        roomPopup.style.left = 'auto';
        roomPopup.style.right = '10px';
    }
};

// 3. Global Listener to HIDE on ANY interaction
function hidePopup() {
    if (roomPopup.style.display === 'block') {
        roomPopup.style.display = 'none';
    }
}

// Hide on tap, click, or scroll start
document.addEventListener('click', hidePopup);
document.addEventListener('touchstart', hidePopup);
document.addEventListener('wheel', hidePopup);
document.addEventListener('scroll', hidePopup, {capture: true});

// ==================== GLOBAL HELPERS ====================
window.showRoomLocation = function(code) {
    if (typeof ROOM_LOCATIONS === 'undefined') {
        alert("Room data is loading...");
        return;
    }
    const location = ROOM_LOCATIONS[code] || "Location details not available.";
    
    // Simple, clean alert
    alert(`📍 Classroom Location:\n\n${code}\n${location}`);
};
// ==================== TIMETABLE APPLICATION ====================
const TimetableApp = (function() {
  // Private state
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
    totalDays: 6, // Mon-Sat
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    activeHighlightInterval: null,
    isVerticalScroll: false,
    isVerticalScrollPossible: false,
    initialScrollTop: 0,
    isTeacherMode: false,
    wheelCooldown: false
  };

  // DOM Elements cache
  const dom = {
    daysTrack: null,
    timetableContainer: null,
    compactContainer: null,
    tableBody: null,
    batchGrid: null,
    selectedBatchLabel: null,
    floatingBatch: null,
    filterArrow: null,
    filterPanel: null,
    dropdownArrow: null,
    dropdownContent: null,
    batchDropdownTrigger: null
  };

  // ==================== INITIALIZATION ====================
  function init() {
    console.log('Initializing Timetable App...');
    cacheDOMElements();
    loadSavedPreferences();
    setupEventListeners();
    initializeBatchDropdown();
    document.getElementById('teacher-mode-btn').addEventListener('click', toggleTeacherMode);
    initTeacherSearch();
    // RENDER
    renderInitialViews();
    
    // START SERVICES
    startActiveHighlighting();
    setupServiceWorker();
    
    // FIX LAYOUT & HIGHLIGHT AFTER LOAD
    setTimeout(() => {
        handleResize(); // Fixes "half-view" alignment
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
    //dom.selectedBatchLabel = document.getElementById('selected-batch-label');
    dom.floatingBatch = document.getElementById('floating-batch');
    dom.filterArrow = document.getElementById('filter-arrow');
    dom.filterPanel = document.getElementById('filter-panel');
    //dom.dropdownArrow = document.getElementById('dropdown-arrow');
    dom.dropdownContent = document.getElementById('batch-dropdown-content');
    //dom.batchDropdownTrigger = document.getElementById('batch-dropdown-trigger');
  }

  function loadSavedPreferences() {
    // 1. Load Batch
    const savedBatch = Storage.get('selectedBatch', 'A1');
    state.currentBatch = savedBatch;
    
    // Load schedule from global variable in data.js
    if (typeof scheduleMap !== 'undefined' && scheduleMap[savedBatch]) {
        state.currentSchedule = scheduleMap[savedBatch];
    } else {
        // Safe fallback if data.js isn't ready yet
        state.currentSchedule = (typeof scheduleA1 !== 'undefined') ? scheduleA1 : [];
    }
    
    // 2. Load View Mode
    const savedView = Storage.get('preferredView', 'swipe');
    state.currentView = savedView;
    
    // 3. Load Theme
    const savedTheme = Storage.get('theme', 'dark');
    document.body.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-btn');
    if(themeBtn) themeBtn.textContent = savedTheme === 'dark' ? '☀' : '🌙';
    
    // 4. Set Day to Today
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
  

  function setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js")
        .then(reg => console.log("SW Registered"))
        .catch(err => console.log("SW Fail", err));

      // LISTEN FOR THE FORCED RELOAD COMMAND
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FORCE_RELOAD') {
            console.log("New data found. Force reloading...");
            // Reload the page automatically to show new data
            window.location.reload();
        }
      });

      // Check for updates when coming back online
      window.addEventListener('online', () => {
          fetch('./js/data.js', { cache: 'no-store' }).catch(() => {});
      });
    }
  }
  // ==================== RENDERING ====================
  function renderInitialViews() {
    updateBatchLabels(state.currentBatch);
    updateBatchUI();
    setViewMode(state.currentView); 
    renderMobileView();
    renderDesktopView();
  }

  function updateBatchLabels(batchName) {
      if (dom.selectedBatchLabel) dom.selectedBatchLabel.textContent = `Batch ${batchName}`;
      if (dom.floatingBatch) dom.floatingBatch.textContent = `BATCH ${batchName}`;
    const cornerLabel = document.getElementById('table-corner-label');
      if (cornerLabel) {
          cornerLabel.innerHTML = `
              <div style="
                  display: inline-block;
                  font-size: 0.9rem; 
                  color: var(--accent-color); 
                  font-weight: 800;
                  border: 1px solid var(--accent-color);
                  background: rgba(187, 134, 252, 0.1); 
                  border-radius: 6px;
                  padding: 1px 8px;
                  margin-bottom: 2px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  letter-spacing: 0.5px;
              ">
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
      const dayView = createDayView(day);
      dom.daysTrack.appendChild(dayView);
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
      // Logic for gaps/breaks
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
    
    // Attributes used by Highlighter
    card.dataset.startHour = cls.start.toString();
    card.dataset.day = cls.day.toString();
    
    // UPDATED HTML: Added onclick event for the floating popup
    card.innerHTML = `
      <div class="time-slot">${formatTimeRange(cls.start, cls.duration)}</div>
      <div class="subject-name">${displayTitle}</div>
      <div class="card-footer">
        <span class="info-badge" style="cursor:pointer; display:inline-flex; align-items:center;" 
              onclick="window.showRoomPopup(event, '${cls.code}')">
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

      // DELETE the old timeCell.textContent line and PASTE this instead:
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
          // Fix for empty cells
          const cell = createEmptyTableCell(day, hour);
          row.appendChild(cell);
        }
      }
      dom.tableBody.appendChild(row);
    });
     const hintRow = document.createElement('tr');
    const hintCell = document.createElement('td');
    hintCell.colSpan = "7"; // Spans Time + Mon-Sat
    hintCell.style.cssText = `
        text-align: center; 
        padding: 0px 12px 12px 12px;  
        color: var(--accent-color); 
        font-size: 0.8rem; 
        border: none; 
        opacity: 0.8; 
        font-weight: 600;
        letter-spacing: 0.5px;
    `;
    hintCell.innerHTML = "☝️ Tap any class block for details";
    
    hintRow.appendChild(hintCell);
    dom.tableBody.appendChild(hintRow);
  }

  function createTableCell(cls) {
    const cell = document.createElement('td');
    cell.setAttribute('data-day', cls.day);
    cell.className = `cell-${cls.type}`;
    
    // Add Click Listener for Modal
    cell.style.cursor = 'pointer'; // Visual cue
    cell.onclick = () => openDetailsModal(cls); // <--- THIS IS NEW

    if (cls.duration > 1) cell.rowSpan = cls.duration;
    
    // Display Logic
    // If it's teacher mode, the title might be long, so we might want to truncate or show code
    // For now, we use the standard display logic
    const displayTitle = getSubjectFullTitle(cls.title, cls.type) || cls.title;
    
    // Clean up title for the small cell if it's too long (Teacher Mode specific)
    // If title has parenthesis (Teacher Mode), split and take the first part
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

// --- BATCH MANAGEMENT WITH TABS ---
  
  let currentBatchType = '62'; // Default to 62 series

  // --- NEW BATCH LOGIC ---

  // --- NEW CUSTOM UI BATCH LOGIC ---

 // --- BATCH MANAGEMENT (FIXED SORTING & LOGIC) ---

  function initializeBatchDropdown() {
    const current = state.currentBatch;
    // Auto-detect series (128 if starts with F, E, H)
    const is128 = /^[FEH]/.test(current);
    
    const seriesBtn = document.getElementById('series-text');
    if (seriesBtn) seriesBtn.textContent = is128 ? "128 Series" : "62 Series";
    
    updateTriggerText();
    populateBatchGrid(is128 ? "128" : "62");
  }

  function toggleSeries() {
    const seriesText = document.getElementById('series-text');
    if (!seriesText) return;

    // 1. Toggle the Logic
    const isCurrently62 = seriesText.textContent.includes("62");
    const newType = isCurrently62 ? "128" : "62";

    // 2. Update the Button Text
    seriesText.textContent = `${newType} Series`;

    // 3. Update the Grid Data silently (DO NOT OPEN)
    populateBatchGrid(newType);
    
    // (Removed the line that forced it to open)
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
    
    // Determine type (use forced, or read from button)
    const type = forcedType || (seriesText?.textContent.includes("128") ? "128" : "62");

    if (!grid || typeof scheduleMap === 'undefined') return;

    grid.innerHTML = '';

    // 1. Get Keys
    const allBatches = Object.keys(scheduleMap);

    // 2. Filter by Type
    const filteredBatches = allBatches.filter(b => {
        return type === "128" ? /^[EFH]/.test(b) : /^[ABCDG]/.test(b);
    });

    // 3. NATURAL SORT (The Fix for A1 -> A2 -> A10)
    filteredBatches.sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    // 4. Generate Buttons
    filteredBatches.forEach(batch => {
        const btn = document.createElement('button');
        btn.className = 'batch-btn';
        if(batch === state.currentBatch) btn.classList.add('active-batch');
        btn.textContent = batch;
        
        btn.onclick = () => {
            selectBatch(batch);
            toggleBatchGrid(false); // Close menu
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

  // Ensure selectBatch updates everything
  const originalSelectBatch = selectBatch; // Backup if needed logic exists there
  
  function selectBatch(batchName) {
    // NO GATEKEEPER HERE! Just normal logic.
    state.currentBatch = batchName;
    if (typeof scheduleMap !== 'undefined' && scheduleMap[batchName]) {
        state.currentSchedule = scheduleMap[batchName];
    }
    Storage.set('selectedBatch', batchName);
    updateBatchLabels(batchName);
    updateTriggerText(); 
    updateGridSelection();
    renderMobileView();
    renderDesktopView();
    setTimeout(() => {
        highlightActiveClass();
        jumpToDay(state.currentDayIndex);
    }, 50);
  }

  function updateBatchUI() {
    document.querySelectorAll('.batch-btn').forEach(btn => {
      btn.classList.toggle('active-batch', btn.textContent === state.currentBatch);
    });
  }

  // ==================== VIEW MODE ====================
 function setViewMode(mode) {
    // NO GATEKEEPER HERE!
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

  // ==================== NAVIGATION (FIXED LOOP & WIDTH) ====================
  function jumpToDay(index) {
    if (index < 0 || index >= state.totalDays) return;
    state.currentDayIndex = index;
    
    // FIX: Use offsetWidth instead of window.innerWidth to handle scrollbars/notches
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
        // Highlight Mobile
        const dayView = document.querySelector(`#day-${currentDay}`);
        if (dayView) {
          const card = dayView.querySelector(`.class-card[data-start-hour="${activeClass.start}"]`);
          if (card) {
              card.classList.add('active-now');
   const dayView = card.closest('.day-view');
if (dayView) {
  dayView.scrollTo({
    top: card.offsetTop - dayView.clientHeight / 2 + card.clientHeight / 2,
    behavior: 'smooth'
  });
}
          }
        }
        // Highlight Table
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

  // ==================== SWIPE LOGIC (FIXED LOOP) ====================
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
    
    // FIX: ADDED LOOP LOGIC HERE
    if (movedBy < -threshold) {
      // Next Day (Loop to Mon if at Sat)
      state.currentDayIndex = (state.currentDayIndex < state.totalDays - 1) ? state.currentDayIndex + 1 : 0;
    } else if (movedBy > threshold) {
      // Prev Day (Loop to Sat if at Mon)
      state.currentDayIndex = (state.currentDayIndex > 0) ? state.currentDayIndex - 1 : state.totalDays - 1;
    }
    
    jumpToDay(state.currentDayIndex);
  }

  // ==================== MODAL LOGIC ====================
  function openDetailsModal(cls) {
      const modal = document.getElementById('details-modal');
      if(!modal) return;

      // 1. Get Data
      const rawTitle = cls.title;
      // If the title contains '(', it's likely already formatted by our Teacher Mode logic
      const isFormatted = rawTitle.includes('('); 
      const displayTitle = isFormatted ? rawTitle : (getSubjectFullTitle(rawTitle, cls.type) || rawTitle);
      
      const displayTeacher = getTeacherDisplayName(cls.teacher);
      const displayTime = formatTimeRange(cls.start, cls.duration);
      
      // Batches Logic
      let displayBatch = state.currentBatch;
      if (cls.batchNames && Array.isArray(cls.batchNames)) {
          // Teacher Mode: Join the batches (e.g., "A1, A2")
          displayBatch = cls.batchNames.join(', ');
      }

      // 2. Populate UI
      document.getElementById('modal-subject').textContent = displayTitle;
      document.getElementById('modal-time').textContent = displayTime;
      document.getElementById('modal-type').textContent = cls.type.charAt(0).toUpperCase() + cls.type.slice(1); // Capitalize
      document.getElementById('modal-teacher').textContent = displayTeacher;
      document.getElementById('modal-batch').textContent = displayBatch;
      
      // --- UPDATED ROOM SECTION ---
      // We use innerHTML to add the Room Code + The Clickable 'i' Icon
      const roomEl = document.getElementById('modal-room');
      roomEl.innerHTML = `
        ${cls.code} 
        <span class="modal-glow-btn" onclick="window.showRoomPopup(event, '${cls.code}')">
          i
        </span>
      `;
      // ----------------------------

      // 3. Show Modal
      modal.classList.remove('hidden-modal');
      modal.setAttribute('aria-hidden', 'false');
      
      // Close Logic
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
    
    // 1. FORCE PANEL ON TOP (Z-Index Fix)
    // Ensures the panel is always clickable and above the backdrop
    if (isExpanded) {
        const computedStyle = window.getComputedStyle(dom.filterPanel);
        if (computedStyle.position === 'static') dom.filterPanel.style.position = 'relative';
        dom.filterPanel.style.zIndex = '1001';
    } else {
        dom.filterPanel.style.zIndex = ''; 
        dom.filterPanel.style.position = ''; 
    }

    // 2. Update Arrow Icon
    if (dom.filterArrow) {
      dom.filterArrow.textContent = isExpanded ? '▲' : '▼';
    }

    // 3. THE "CATCH-ALL" BACKDROP
    let backdrop = document.getElementById('filter-backdrop');
    
    if (isExpanded) {
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'filter-backdrop';
            backdrop.style.cssText = `
                position: fixed; top: 0; left: 0; 
                width: 100vw; height: 100vh;
                z-index: 1000; background: transparent;
                touch-action: none; /* Helps prevent browser scrolling */
            `;
            
            // This helper function closes the panel immediately on ANY interaction
            const closeAndBlock = (e) => {
                if (e.cancelable) e.preventDefault(); // Stop the touch/click from passing through
                e.stopPropagation(); // Stop global listeners
                toggleFilterPanel();
            };

            // A. Catch Taps (Clicks)
            backdrop.addEventListener('click', closeAndBlock);
            
            // B. Catch Swipes (Touchstart fires immediately when finger touches screen)
            backdrop.addEventListener('touchstart', closeAndBlock, { passive: false });
            
            // C. Catch Scrolls (Mouse wheel or Trackpad)
            backdrop.addEventListener('wheel', closeAndBlock, { passive: false });

            document.body.appendChild(backdrop);
        }
    } else {
        if (backdrop) backdrop.remove();
    }

    // 4. Close the other grid if open
    toggleBatchGrid(false);
  }

  function handleOutsideClick(e) {
    const filterPanel = dom.filterPanel;
    const toggleBtn = document.querySelector('.filter-toggle-btn'); // The "FILTERS" button
    const teacherBtn = document.getElementById('teacher-mode-btn');
    // Check if the panel is currently OPEN
    if (filterPanel && filterPanel.classList.contains('expanded')) {
      
      // logic: If the click is NOT inside the panel AND NOT on the button itself...
      if (!filterPanel.contains(e.target) && 
    !toggleBtn.contains(e.target) && 
    !teacherBtn.contains(e.target)) {
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
// ==================== TEACHER MODE LOGIC ====================

  // ==================== IMPROVED TEACHER MODE LOGIC ====================

  function toggleTeacherMode() {
    state.isTeacherMode = !state.isTeacherMode;
    const btn = document.getElementById('teacher-mode-btn');
    const studentControls = document.getElementById('student-controls');
    const teacherControls = document.getElementById('teacher-controls');

    // 1. Visual Toggle
    if (btn) btn.classList.toggle('active-mode', state.isTeacherMode);

   if (state.isTeacherMode) {
    // ENTER TEACHER MODE
    if (studentControls) studentControls.classList.add('hidden');
    if (teacherControls) teacherControls.classList.remove('hidden');
    
    // FIX: Explicitly OPEN the panel with proper timing
    if (dom.filterPanel) {
        dom.filterPanel.classList.add('expanded');
        dom.filterPanel.style.zIndex = '100'; // Ensure it's on top
        if(dom.filterArrow) dom.filterArrow.textContent = '▲';
    }
    
    // Focus search with slight delay to ensure CSS animation is done
    setTimeout(() => {
        const searchInput = document.getElementById('teacher-search');
        if (searchInput) searchInput.focus();
    }, 300);

    } else {
      // EXIT TEACHER MODE
     if (studentControls) studentControls.classList.remove('hidden');
if (teacherControls) teacherControls.classList.add('hidden');

// RESTORE button containers visibility
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

// Clear inputs
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

    // Helper to toggle visibility of the other groups
    const toggleOtherGroups = (show) => {
        // We target the entire group div (Label + Buttons)
        // Group 2 is View Mode, Group 3 is Jump to Day
        const group2 = document.querySelector('.filter-group:nth-child(2)');
        const group3 = document.querySelector('.filter-group:nth-child(3)');
        
        const displayValue = show ? 'flex' : 'none';
        
        if (group2) group2.style.display = displayValue;
        if (group3) group3.style.display = displayValue;
        
        // CRITICAL: Switch suggestions from absolute to relative 
        // so they take up real space and allow scrolling
        if (!show) {
            list.style.position = 'relative';
            list.style.boxShadow = 'none'; // Optional: remove shadow when inline
            list.style.border = 'none';
        } else {
            // Reset to default CSS values
            list.style.position = ''; 
            list.style.boxShadow = '';
            list.style.border = '';
        }
    };

    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        list.innerHTML = ''; // Clear previous

        if (val.length < 1) {
            toggleOtherGroups(true); // Show buttons again
            return;
        }

        // HIDE buttons to make room
        toggleOtherGroups(false);

        // 1. Prepare Data
        let allFaculty = [];
        if (typeof facultyNames !== 'undefined') {
            Object.entries(facultyNames).forEach(([code, name]) => 
                allFaculty.push({ code, name, source: '62' }));
        }
        if (typeof facultyNames128 !== 'undefined') {
            Object.entries(facultyNames128).forEach(([code, name]) => 
                allFaculty.push({ code, name, source: '128' }));
        }

        // 2. Filter Matches
        let matches = allFaculty.filter(f => 
            f.code.toLowerCase().includes(val) || f.name.toLowerCase().includes(val)
        );

        // 3. Sort
        matches.sort((a, b) => {
             const aCodeStart = a.code.toLowerCase().startsWith(val);
             const bCodeStart = b.code.toLowerCase().startsWith(val);
             if (aCodeStart && !bCodeStart) return -1;
             if (!aCodeStart && bCodeStart) return 1;
             return a.name.localeCompare(b.name);
        });

        // 4. Render
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
                    toggleFilterPanel(); // Close panel
                    
                    // Restore buttons after selection
                    setTimeout(() => toggleOtherGroups(true), 300);
                };
                list.appendChild(div);
            });
        }
    });
  }
// ==================== TRACKPAD SWIPE LOGIC ====================
  function handleWheel(e) {
    // Only active in Swipe view
    if (state.currentView !== 'swipe') return;

    // Check if movement is horizontal (horizontal delta > vertical delta)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      
      // Prevent browser back/forward navigation
      e.preventDefault();

      // Threshold check (ignore tiny accidental movements)
      if (Math.abs(e.deltaX) < 20) return;

      // Cooldown check (prevent one swipe triggering 10 day jumps)
      if (state.wheelCooldown) return;

      // Set cooldown
      state.wheelCooldown = true;
      setTimeout(() => { state.wheelCooldown = false; }, 800); // 800ms delay

      // Determine Direction
      if (e.deltaX > 0) {
        // Swiping Right -> Go to Next Day
        jumpToDay(state.currentDayIndex < state.totalDays - 1 ? state.currentDayIndex + 1 : 0);
      } else {
        // Swiping Left -> Go to Prev Day
        jumpToDay(state.currentDayIndex > 0 ? state.currentDayIndex - 1 : state.totalDays - 1);
      }
    }
  }
  function loadTeacherSchedule(targetCode, teacherName) {
    // UI Updates
    if (dom.selectedBatchLabel) dom.selectedBatchLabel.textContent = `Teacher: ${targetCode}`;
    if (dom.floatingBatch) dom.floatingBatch.textContent = `PROF. ${targetCode}`;

    const slotMap = new Map(); // Key: "day-start", Value: Merged Class Object

    if (typeof scheduleMap !== 'undefined') {
      Object.keys(scheduleMap).forEach(batchName => {
        const batchClasses = scheduleMap[batchName];
        
        batchClasses.forEach(cls => {
           // 1. Check if Teacher Matches (Strict)
           const teachers = cls.teacher.split('/').map(t => t.trim());
           if (teachers.includes(targetCode)) {
               
               // Create a unique key for this time slot
               const key = `${cls.day}-${cls.start}`;

               if (!slotMap.has(key)) {
                   // First time seeing this slot -> Add it
                   slotMap.set(key, {
                       ...cls, // Copy all original properties
                       batchNames: [batchName] // Start a list of batches
                   });
               } else {
                   // Slot exists! -> Merge this batch into it
                   const existing = slotMap.get(key);
                   // Avoid duplicates if data is messy
                   if (!existing.batchNames.includes(batchName)) {
                       existing.batchNames.push(batchName);
                   }
               }
           }
        });
      });
    }

    // Convert Map back to Array & Format Titles
    const aggregatedSchedule = Array.from(slotMap.values()).map(cls => {
        // 1. Get the REAL Subject Name (e.g., HS111 -> UHV)
        // We use the helper function directly here
        const fullName = getSubjectFullTitle(cls.title, cls.type) || cls.title;

        // 2. Sort Batches naturally (A1, A2... not A1, A10)
        const uniqueBatches = cls.batchNames.sort((a, b) => 
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );
        
        // 3. Create the Display Title: "UHV (A5, A6)"
        const finalTitle = `${fullName} (${uniqueBatches.join(', ')})`;

        return {
            ...cls,
            title: finalTitle 
            // We update 'title' so the renderer just displays it as-is
        };
    });

    state.currentSchedule = aggregatedSchedule;
    renderMobileView();
    renderDesktopView();
    jumpToDay(state.currentDayIndex);
  }
 // Public API
  return {
    init,
    toggleFilterPanel,
    toggleTheme,
    selectBatch,
    setViewMode,
    manualJumpToDay,
    // ENSURE THESE ARE HERE:
    toggleSeries,
    toggleBatchGrid
  };
})();
// Start
document.addEventListener('DOMContentLoaded', TimetableApp.init);





















