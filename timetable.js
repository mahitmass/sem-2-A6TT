// ==================== 1. DATA SECTION ====================

// BATCH A6 SCHEDULE
const scheduleA6 = [
  { day: 1, start: 10, duration: 2, title: "Physics Lab-2", code: "PL2", teacher: "Dr. Navendu / Dr. Indrani", type: "lab" },
  { day: 1, start: 14, duration: 1, title: "UHV", code: "G1", teacher: "Dr. Manoj Tripathi", type: "lec" },
  { day: 2, start: 9, duration: 1, title: "Workshop", code: "TS16", teacher: "Dr. Gorav Patel", type: "tut" },
  { day: 2, start: 10, duration: 2, title: "Workshop Lab", code: "EW2", teacher: "Dr. Gorav Patel", type: "lab" },
  { day: 2, start: 13, duration: 1, title: "Mathematics-2", code: "G1", teacher: "Dr. Arpita Nayek", type: "lec" },
  { day: 2, start: 14, duration: 1, title: "Physics-2", code: "G1", teacher: "Dr. Sandeep Mishra", type: "lec" },
  { day: 2, start: 15, duration: 1, title: "SDF-2", code: "FF1", teacher: "Rohit Kumar Soni", type: "lec" },
  { day: 3, start: 9, duration: 1, title: "UHV", code: "F10", teacher: "Dr. Yogita Naruka", type: "tut" },
  { day: 3, start: 13, duration: 1, title: "Physics-2", code: "CS5", teacher: "Dr. Sandeep Mishra", type: "lec" },
  { day: 3, start: 14, duration: 1, title: "Mathematics-2", code: "FF3", teacher: "Dr. Arpita Nayek", type: "lec" },
  { day: 3, start: 15, duration: 2, title: "SDF Lab", code: "CL02", teacher: "Meenal / Prateek", type: "lab" },
  { day: 4, start: 10, duration: 1, title: "SDF-2", code: "G1", teacher: "Rohit Kumar Soni", type: "lec" },
  { day: 4, start: 11, duration: 1, title: "UHV", code: "G1", teacher: "Dr. Manoj Tripathi", type: "lec" },
  { day: 4, start: 13, duration: 2, title: "Life Skills Lab", code: "LL", teacher: "Prof. Mukta Mani", type: "lab" },
  { day: 5, start: 11, duration: 1, title: "Physics-2", code: "FF4", teacher: "Dr. Sandeep Mishra", type: "lec" },
  { day: 5, start: 13, duration: 1, title: "Physics-2", code: "TS8", teacher: "Dr.Bhubesh Chander Joshi", type: "tut" },
  { day: 5, start: 14, duration: 1, title: "Mathematics-2", code: "TS8", teacher: "Dr. Neha Singhal", type: "tut" },
  { day: 5, start: 15, duration: 1, title: "SDF-2", code: "TS6", teacher: "Shardha Porwal", type: "tut" },
  { day: 6, start: 10, duration: 1, title: "SDF-2", code: "FF1", teacher: "Rohit Kumar Soni", type: "lec" },
  { day: 6, start: 11, duration: 1, title: "Mathematics-2", code: "FF1", teacher: "Dr. Arpita Nayek", type: "lec" },
];

// BATCH A5 SCHEDULE
const scheduleA5 = [
  { day: 1, start: 10, duration: 2, title: "Physics Lab-2", code: "PL1", teacher: "Dr.Manoj Kumar / Dr.Manoj Tripathi", type: "lab" },
  { day: 1, start: 14, duration: 1, title: "UHV", code: "G1", teacher: "Dr. Manoj Tripathi", type: "lec" },
  { day: 2, start: 9, duration: 1, title: "Workshop", code: "TS13", teacher: "Mr. Shwetabh Singh", type: "tut" },
  { day: 2, start: 10, duration: 2, title: "Workshop Lab", code: "EW1", teacher: "Mr. Shwetabh Singh", type: "lab" },
  { day: 2, start: 13, duration: 1, title: "Mathematics-2", code: "G1", teacher: "Dr. Arpita Nayek", type: "lec" },
  { day: 2, start: 14, duration: 1, title: "Physics-2", code: "G1", teacher: "Dr. Sandeep Mishra", type: "lec" },
  { day: 2, start: 15, duration: 1, title: "SDF-2", code: "FF1", teacher: "Rohit Kumar Soni", type: "lec" },
  { day: 3, start: 9, duration: 1, title: "UHV", code: "TS6", teacher: "Dr. Priya", type: "tut" },
  { day: 3, start: 13, duration: 1, title: "Physics-2", code: "CS5", teacher: "Dr. Sandeep Mishra", type: "lec" },
  { day: 3, start: 14, duration: 1, title: "Mathematics-2", code: "FF3", teacher: "Dr. Arpita Nayek", type: "lec" },
  { day: 3, start: 15, duration: 2, title: "SDF Lab", code: "CL01", teacher: "Dr. Tanvee Gautam / Mr. Imran Rashid", type: "lab" },
  { day: 4, start: 10, duration: 1, title: "SDF-2", code: "G1", teacher: "Rohit Kumar Soni", type: "lec" },
  { day: 4, start: 11, duration: 1, title: "UHV", code: "G1", teacher: "Dr. Manoj Tripathi", type: "lec" },
  { day: 4, start: 13, duration: 2, title: "Life Skills Lab", code: "LL1", teacher: "Dr. Kanupriya Misra", type: "lab" },
  { day: 5, start: 9, duration: 1, title: "SDF-2", code: "TS8", teacher: "Dr. Amanpreet Kaur", type: "tut" },
  { day: 5, start: 11, duration: 1, title: "Physics-2", code: "FF4", teacher: "Dr. Sandeep Mishra", type: "lec" },
  { day: 5, start: 13, duration: 1, title: "Mathematics-2", code: "TS7", teacher: "Dr. Neha Singhal", type: "tut" },
  { day: 5, start: 14, duration: 1, title: "Physics-2", code: "TS7", teacher: "Dr. Ravi Gupta", type: "tut" },
  { day: 6, start: 10, duration: 1, title: "SDF-2", code: "FF1", teacher: "Rohit Kumar Soni", type: "lec" },
  { day: 6, start: 11, duration: 1, title: "Mathematics-2", code: "FF1", teacher: "Dr. Arpita Nayek", type: "lec" },
];

// BATCH B12 SCHEDULE
const scheduleB12 = [
  { day: 1, start: 10, duration: 1, title: "UHV", code: "TS10", teacher: "Dr.ILA Joshi", type: "tut" },
  { day: 1, start: 11, duration: 1, title: "Physics-2", code: "TS10", teacher: "Rakesh Kumar Dwivedi", type: "tut" },
  { day: 1, start: 13, duration: 1, title: "Mathematics-2", code: "TS6", teacher: "Dr.Himani Pant", type: "tut" },
  { day: 1, start: 15, duration: 1, title: "SDF-2", code: "G1", teacher: "Dr.Asish Mishra", type: "lec" },
  { day: 2, start: 9, duration: 1, title: "SDF-2", code: "TS6", teacher: "Dr.Kavita Pandey", type: "tut" },
  { day: 2, start: 13, duration: 1, title: "Mathematics-2", code: "FF3", teacher: "Dr.Himani Pant", type: "lec" },
  { day: 2, start: 14, duration: 1, title: "SDF-2", code: "FF3", teacher: "Dr.Asish Mishra", type: "lec" },
  { day: 2, start: 15, duration: 1, title: "Physics-2", code: "FF2", teacher: "Dr.Navendu Goswami", type: "lec" },
  { day: 3, start: 10, duration: 2, title: "Physics Lab-2", code: "PL2", teacher: "Narinder Kaur/Anuraj Panwar", type: "lab" },
  { day: 3, start: 13, duration: 1, title: "Physics-2", code: "G1", teacher: "Dr.Navendu Goswami", type: "lec" },
  { day: 3, start: 14, duration: 1, title: "Mathematics-2", code: "CS5", teacher: "Dr.Himani Pant", type: "lec" },
  { day: 4, start: 10, duration: 1, title: "SDF-2", code: "CS5", teacher: "Dr.Asish Mishra", type: "lec" },
  { day: 4, start: 13, duration: 2, title: "SDF Lab", code: "CL07", teacher: "Ms.Anupama Padha/Dr.Anita Sahoo", type: "lab" },
  { day: 4, start: 15, duration: 2, title: "Life Skills Lab", code: "LL1", teacher: "Mohua Dutta", type: "lab" },
  { day: 5, start: 10, duration: 1, title: "UHV", code: "FF3", teacher: "Dr.Amanpreet Kaur", type: "lec" },
  { day: 5, start: 11, duration: 1, title: "Physics-2", code: "FF3", teacher: "Dr.Navendu Goswami", type: "lec" },
  { day: 5, start: 13, duration: 1, title: "Workshop", code: "TS11", teacher: "Ms.Madhu Jharia", type: "tut" },
  { day: 5, start: 15, duration: 2, title: "Workshop Lab", code: "EW2", teacher: "Ms.Madhu Jharia", type: "lab" },
  { day: 6, start: 9, duration: 1, title: "UHV", code: "FF1", teacher: "Dr.Amanpreet Kaur", type: "lec" },
  { day: 6, start: 11, duration: 1, title: "Mathematics-2", code: "FF2", teacher: "Dr.Himani Pant", type: "lec" },
];

// ==================== 2. LOGIC SECTION ====================

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let currentSchedule = scheduleA6; // Default to A6

window.switchBatch = function(batch) {
    if (batch === 'A5') currentSchedule = scheduleA5;
    else if (batch === 'B12') currentSchedule = scheduleB12;
    else currentSchedule = scheduleA6;

    // Save to local storage
    localStorage.setItem('selectedBatch', batch);
    
    // Update Floating Badge
    const floatBadge = document.getElementById('floating-batch');
    if(floatBadge) floatBadge.textContent = `BATCH ${batch}`;

    // Update Buttons UI
    document.querySelectorAll('.filter-group:first-child .toggle-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-${batch}`);
    if(btn) btn.classList.add('active');

    // Re-render
    renderMobileView();
    renderDesktopView();
    setTimeout(highlightActiveClass, 100);
    setTimeout(scrollToActiveClass, 200);
}

// Check if a class object is happening right now
function isClassActive(cls) {
    const now = new Date();
    const currentDay = now.getDay(); 
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (cls.day !== currentDay) return false;
    
    const classEndHour = cls.start + cls.duration - 1;
    const classEndMinute = 50; 
    
    // Before Start
    if (currentHour < cls.start) return false;
    // After End
    if (currentHour > classEndHour) return false;
    // In End Hour but past 50 mins
    if (currentHour === classEndHour && currentMinute > classEndMinute) return false;
    
    return true;
}

// Highlight logic using Data Attributes (Safest method)
function highlightActiveClass() {
    // Clear old highlights
    document.querySelectorAll('.active-now').forEach(el => el.classList.remove('active-now'));
    
    const now = new Date();
    const currentDay = now.getDay(); 
    const currentHour = now.getHours();
    
    if (currentDay >= 1 && currentDay <= 6) {
        // Find which class in current schedule is active
        const activeClass = currentSchedule.find(cls => isClassActive(cls));
        
        if (activeClass) {
            // --- Mobile Card Highlight ---
            const dayView = document.getElementById(`day-${currentDay}`);
            if (dayView) {
                // Find card with matching start hour
                const card = dayView.querySelector(`.class-card[data-start="${activeClass.start}"]`);
                if (card) card.classList.add('active-now');
            }

            // --- Table Cell Highlight ---
            // Find row by data-hour
            const row = document.querySelector(`.weekly-table tr[data-hour="${activeClass.start}"]`);
            if (row) {
                // Determine column index (Mon=2, Tue=3 ... so currentDay+1)
                const cell = row.querySelector(`td:nth-child(${currentDay + 1})`);
                if (cell) cell.classList.add('active-now');
            }
        }
    }
}

function renderMobileView() {
    const track = document.getElementById('daysTrack');
    if (!track) return;
    track.innerHTML = '';

    for (let d = 1; d <= 6; d++) {
        const dayView = document.createElement('div');
        dayView.className = 'day-view';
        dayView.id = `day-${d}`;

        const h2 = document.createElement('h2');
        h2.className = 'day-header';
        h2.innerText = dayNames[d];
        dayView.appendChild(h2);

        const dayClasses = currentSchedule.filter(s => s.day === d).sort((a, b) => a.start - b.start);

        if (dayClasses.length === 0) {
            dayView.innerHTML += `<div class="break-card"><div class="break-header">No Classes Today! 🥳</div></div>`;
        } else {
            let lastEndTime = dayClasses[0].start;
            dayClasses.forEach((cls, index) => {
                if (index > 0 && cls.start > lastEndTime) {
                    let gapStart = lastEndTime;
                    let gapEnd = cls.start;
                    if (gapStart <= 12 && gapEnd >= 13) {
                        if (12 > gapStart) createBreakCard(dayView, gapStart, 12, "Break");
                        createBreakCard(dayView, 12, 13, "Lunch Break");
                        if (gapEnd > 13) createBreakCard(dayView, 13, gapEnd, "Break");
                    } else {
                        createBreakCard(dayView, gapStart, gapEnd, "Break");
                    }
                }
                createClassCard(dayView, cls);
                lastEndTime = cls.start + cls.duration;
            });
        }
        track.appendChild(dayView);
    }
}

function createClassCard(container, cls) {
    const formatTime = (h) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        const startStr = `${hr < 10 ? '0' + hr : hr}:00`;
        const endHr = (h + cls.duration - 1) % 12 || 12;
        const endStr = `${endHr < 10 ? '0' + endHr : endHr}:50`;
        return `${startStr} - ${endStr} ${ampm}`;
    };
    
    const card = document.createElement('div');
    card.className = `class-card type-${cls.type}`;
    // Add data-start for highlighter to find it easily
    card.setAttribute('data-start', cls.start);
    
    if (isClassActive(cls)) {
        card.classList.add('active-now');
    }
    
    card.innerHTML = `
        <div class="time-slot">${formatTime(cls.start)}</div>
        <div class="subject-name">${cls.title}</div>
        <div class="card-footer">
            <span class="info-badge">🏛 ${cls.code}</span>
            <span class="info-badge">👨‍🏫 ${cls.teacher}</span>
            <span class="info-badge">${cls.type.toUpperCase()}</span>
        </div>`;
    container.appendChild(card);
}

function createBreakCard(container, start, end, title) {
    const formatTime = (h) => { const hr = h % 12 || 12; return `${hr < 10 ? '0' + hr : hr}:00 ${h >= 12 ? 'PM' : 'AM'}`; };
    const breakDiv = document.createElement('div');
    breakDiv.className = 'break-card';
    breakDiv.innerHTML = `<div class="break-header">${title}</div><div class="break-time-text">${formatTime(start)} - ${formatTime(end)}</div>`;
    container.appendChild(breakDiv);
}

// FIXED: Removed the hardcoded Lunch row that breaks tables
function renderDesktopView() {
    const tbody = document.querySelector('.weekly-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const hours = [9, 10, 11, 12, 13, 14, 15, 16];
    hours.forEach(hour => {
        const tr = document.createElement('tr');
        // Add data-hour for highlighter
        tr.setAttribute('data-hour', hour);

        const tdTime = document.createElement('td');
        const displayHour = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        tdTime.innerText = `${displayHour < 10 ? '0' + displayHour : displayHour}:00 ${ampm}`;
        tr.appendChild(tdTime);

        for (let d = 1; d <= 6; d++) {
            const cls = currentSchedule.find(s => s.day === d && s.start === hour);
            if (cls) {
                const td = document.createElement('td');
                td.className = `cell-${cls.type}`;
                
                if (isClassActive(cls)) {
                    td.classList.add('active-now');
                }
                
                if (cls.duration > 1) td.rowSpan = cls.duration;
                td.innerHTML = `<span class="cell-subject">${cls.title}</span><span class="cell-room">${cls.code}</span>`;
                tr.appendChild(td);
            } else {
                // Check if occupied by previous long class
                const isOccupied = currentSchedule.some(s => s.day === d && s.start < hour && (s.start + s.duration) > hour);
                if (!isOccupied) {
                    const td = document.createElement('td');
                    // Add subtle lunch text if 12pm
                    if (hour === 12) {
                        td.className = 'cell-break';
                        td.innerHTML = '<span style="font-size:0.6rem; opacity:0.5;">LUNCH</span>';
                    }
                    tr.appendChild(td);
                }
            }
        }
        tbody.appendChild(tr);
    });
}

// ==================== 3. UI & INITIALIZATION ====================

// Init function
window.addEventListener('DOMContentLoaded', () => {
    // Load Batch
    const savedBatch = localStorage.getItem('selectedBatch') || 'A6';
    switchBatch(savedBatch);

    // Load Theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-btn').textContent = savedTheme === 'dark' ? '☀' : '🌙';

    // Load View Mode
    const savedView = localStorage.getItem('preferredView') || 'swipe';
    setViewMode(savedView);

    // Init Swipe
    initSwipeLogic();

    // Start Auto Refresh
    setInterval(() => {
        renderMobileView(); 
        renderDesktopView();
        highlightActiveClass();
    }, 60000);
});

// UI Helper Functions
window.setViewMode = function(mode) {
    const swipeContainer = document.getElementById('timetable-container');
    const compactContainer = document.getElementById('compact-container');
    const btnSwipe = document.getElementById('btn-swipe');
    const btnTable = document.getElementById('btn-table');

    if (mode === 'swipe') {
        swipeContainer.classList.remove('hidden-view');
        compactContainer.classList.add('hidden-view');
        btnSwipe.classList.add('active');
        btnTable.classList.remove('active');
        setTimeout(() => jumpToDay(currentDayIndex), 50);
    } else {
        swipeContainer.classList.add('hidden-view');
        compactContainer.classList.remove('hidden-view');
        btnSwipe.classList.remove('active');
        btnTable.classList.add('active');
    }
    localStorage.setItem('preferredView', mode);
}

window.toggleTheme = function() {
    const body = document.body;
    const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    document.getElementById('theme-btn').textContent = newTheme === 'dark' ? '☀' : '🌙';
    localStorage.setItem('theme', newTheme);
}

window.toggleFilterPanel = function() {
    const panel = document.getElementById('filter-panel');
    const arrow = document.getElementById('filter-arrow');
    panel.classList.toggle('expanded');
    arrow.textContent = panel.classList.contains('expanded') ? '🔼' : '🔽';
}

// Swipe Logic
let isDragging = false, startX = 0, currentTranslate = 0, prevTranslate = 0, currentDayIndex = 0;
const totalDays = 6;

function initSwipeLogic() {
    const track = document.getElementById('daysTrack');
    if(!track) return;
    
    // Jump to today
    const today = new Date().getDay();
    currentDayIndex = (today === 0 || today === 7) ? 0 : today - 1;
    jumpToDay(currentDayIndex);

    track.addEventListener('touchstart', e => { isDragging=true; startX=e.touches[0].clientX; track.style.transition='none'; });
    track.addEventListener('touchmove', e => { if(!isDragging) return; const diff = e.touches[0].clientX - startX; currentTranslate = prevTranslate + diff; track.style.transform = `translateX(${currentTranslate}px)`; });
    track.addEventListener('touchend', () => { isDragging=false; const moved = currentTranslate - prevTranslate; if(moved < -80 && currentDayIndex < 5) currentDayIndex++; else if(moved > 80 && currentDayIndex > 0) currentDayIndex--; jumpToDay(currentDayIndex); });
}

window.manualJumpToDay = function(day) {
    currentDayIndex = day - 1;
    jumpToDay(currentDayIndex);
}

function jumpToDay(index) {
    const track = document.getElementById('daysTrack');
    if(track) {
        currentTranslate = index * -window.innerWidth;
        prevTranslate = currentTranslate;
        track.style.transition = 'transform 0.3s ease-out';
        track.style.transform = `translateX(${currentTranslate}px)`;
    }
    document.querySelectorAll('.day-btn').forEach(btn => btn.classList.toggle('active-day', parseInt(btn.dataset.day) === index + 1));
}

function scrollToActiveClass() {
    const activeCard = document.querySelector('.class-card.active-now');
    if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
