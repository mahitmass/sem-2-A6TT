function highlightCurrentSlot() {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const currentHour = now.getHours(); // 0-23 format

  // 1. Create a unique ID string based on current time
  // Example ID structure: "day-1-hour-14"
  const slotId = `day-${dayIndex}-hour-${currentHour}`;

  // 2. Find the element
  const activeSlot = document.getElementById(slotId);

  // 3. Highlight it
  if (activeSlot) {
    // Remove old highlights first
    document.querySelectorAll('.active-class').forEach(el => el.classList.remove('active-class'));
    // Add new highlight
    activeSlot.classList.add('active-class');
  }
}

// Run every minute to update automatically
setInterval(highlightCurrentSlot, 60000);
highlightCurrentSlot(); // Run once immediately on load