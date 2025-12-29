https://planner-mass.vercel.app/
## ✨ Key Features

### 1. 🔄 Multi-Batch Support
* Dynamically switch between different batch schedules (e.g., A5, A6, B12, etc.).
* The app instantly updates the schedule data without reloading the page.
* **Persistent Storage:** Your selected batch is saved in local storage, so you don't have to re-select it every time you open the app.

### 2. 📱 Dual View Modes
The app adapts to your device and preference:
* **Swipe Cards (Mobile Focus):** A day-by-day view where you can swipe left/right to navigate between days. Perfect for checking "What's next?" on a phone.
* **Table View (Desktop Focus):** A classic weekly grid layout that shows the entire week at a glance. Includes logic to handle empty slots and "Lunch Breaks" intelligently.

### 3. 🟣 "Active Now" Smart Highlighting
* **Real-time Tracking:** The app checks the current system time against the schedule.
* **Visual Cue:** If a class is currently in progress, the card (in Swipe View) or the cell (in Table View) glows with a purple border and shadow.
* **Auto-Scroll:** On mobile, the app automatically scrolls to the current active class when loaded.

### 4. 🌗 Dark & Light Theme
* Fully integrated theme switcher.
* Toggles between a modern dark mode (OLED friendly) and a clean light mode.
* Preference is saved automatically.

### 5. ⚡ PWA & Offline Support
* Built as a **Progressive Web App (PWA)**.
* Includes a `manifest.json` and Service Worker (`sw.js`).
* Can be installed on your phone's home screen and works completely offline.

### 6. ⏭️ Quick Navigation
* **Day Jump Buttons:** Quickly jump to Monday, Tuesday, etc., using the `M | T | W...` buttons in the filter panel.
* **Auto-Today:** The app automatically opens to the current day of the week.

---

## 🛠️ How It Works

### The Interface
1.  **Header:** Contains the Logo, App Title, Filter Toggle, and Theme Toggle.
2.  **Filter Panel:** A collapsible menu where you select your **Batch**, change the **View Mode**, or **Jump to a specific day**.
3.  **View Container:** Displays either the Swipe Track or the Compact Table based on your selection.

### The Code Logic
* **Data Structure:** Schedules are stored as JSON arrays in `timetable.js`. Each class object contains the `day`, `start` time, `duration`, `title`, `room code`, and `teacher`.
* **Time Calculation:** The `isClassActive()` function calculates if the current hour falls within a class's start and end duration (handling 1-hour lectures and 2-hour labs).
* **Rendering:**
    * `renderMobileView()`: Generates card elements and handles "Break" cards for empty slots.
    * `renderDesktopView()`: Generates a grid, managing `rowSpan` for long labs and ensuring the "Lunch" row doesn't break the layout.

---

## 🚀 Installation & Setup

If you want to run this locally:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/mahitmass/planner-mass.git](https://github.com/mahitmass/planner-mass.git)
    ```
2.  **Open the folder:**
    Go to the directory where you cloned the files.
3.  **Run:**
    Simply open `index.html` in your browser.

To test PWA features (Service Worker), you need a local server (e.g., Live Server in VS Code).

---

## 📂 File Structure

* `index.html`: The main structure and CSS styles.
* `timetable.js`: Contains all schedule data, rendering logic, and UI interactivity.
* `manifest.json`: Configuration for the PWA (App name, icons, theme color).
* `sw.js`: Service Worker for caching files and enabling offline use.
* `Logo.png`: The application icon.

---

## 👨‍💻 Credits

**Developed by:** Mass~MAHIT A6
