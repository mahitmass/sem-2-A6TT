// --- 1. Theme Toggle Logic ---
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const icon = document.getElementById('theme-icon');
  
  if (currentTheme === 'dark') {
    body.setAttribute('data-theme', 'light');
    icon.textContent = '🌙';
  } else {
    body.setAttribute('data-theme', 'dark');
    icon.textContent = '☀️';
  }
}

// --- 2. Clock & Highlight Logic ---
function highlightCurrentSlot() {
  // Get current time
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const hour = now.getHours(); // 0-23 (e.g., 14 is 2 PM)

  // Remove any existing highlights
  document.querySelectorAll('.highlight-now').forEach(el => {
    el.classList.remove('highlight-now');
  });

  // Find the cell matching today and this hour
  // We look for cells where data-day matches TODAY
  // AND data-hour contains the current HOUR
  
  let selector;
  
  if (hour === 12) {
    // Special case for Lunch (applies to all days)
    selector = `[data-hour="12"]`;
  } else {
    // Normal classes
    // The syntax [data-hour*="${hour}"] checks if the hour number is inside the list
    selector = `td[data-day="${day}"][data-hour*="${hour}"]`; 
  }

  const activeCell = document.querySelector(selector);

  if (activeCell) {
    activeCell.classList.add('highlight-now');
  }
}

// Run immediately on load
highlightCurrentSlot();

// Run every minute (60,000 ms) to keep it accurate
setInterval(highlightCurrentSlot, 60000);
