/* * APP LOGIC FILE
 * Handles all functionality:
 * - Rendering the UI
 * - Switching languages
 * - Swipe navigation
 * - Tab switching
 * - Adding & Removing events (Grouped together)
 */

// --- Global State ---
let currentDayIndex = 0;
let currentLang = 'en';
let currentTab = 'timeline';

// --- Local Storage Initialization ---
// Try to load saved data, otherwise fallback to the hardcoded 'tripData' from data.js
let activeTripData = JSON.parse(localStorage.getItem('myTripData')) || tripData;

// --- Touch State for Swiping ---
let touchStartX, touchStartY, touchEndX, touchEndY;

// --- Helper Functions ---

/**
 * Updates the CSS variable --primary-color based on the city.
 */
function updateTheme(city) {
    const color = themes[city] || themes["Transit"];
    document.documentElement.style.setProperty('--primary-color', color);
}

/**
 * Toggles between English ('en') and Chinese ('zh').
 * Re-renders the UI to show the new language immediately.
 */
function toggleLang() {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    updateUIStrings();
    renderDateSelector();
    
    // If on the category tab, re-render it to update text
    if (currentTab === 'category') {
        renderCategory(document.getElementById('category-select').value);
    }
    
    // Re-render the current day to update titles
    if (currentTab === 'timeline') {
        showDay(currentDayIndex);
    }
}

/**
 * Updates all static text elements (headers, buttons, descriptions)
 * based on the currentLang.
 */
function updateUIStrings() {
    const t = translations[currentLang];
    
    // Header & Info
    if(document.getElementById('ui-tour-label')) document.getElementById('ui-tour-label').innerText = t.tourLabel;
    if(document.getElementById('ui-location-label')) document.getElementById('ui-location-label').innerText = t.location;
    if(document.getElementById('lang-btn-text')) document.getElementById('lang-btn-text').innerText = t.langToggle;

    // View Titles & Descriptions
    if(document.getElementById('ui-category-view-title')) document.getElementById('ui-category-view-title').innerText = t.categoryView;
    if(document.getElementById('ui-category-desc')) document.getElementById('ui-category-desc').innerText = t.categoryDesc;
    if(document.getElementById('ui-filter-label')) document.getElementById('ui-filter-label').innerText = t.filterBy;
    
    if(document.getElementById('ui-memos-title')) document.getElementById('ui-memos-title').innerText = t.memos;
    if(document.getElementById('ui-memos-desc')) document.getElementById('ui-memos-desc').innerText = t.memosDesc;
    
    // Google Doc Section
    if(document.getElementById('ui-gdoc-title')) document.getElementById('ui-gdoc-title').innerText = t.gdocTitle;
    if(document.getElementById('ui-gdoc-sub')) document.getElementById('ui-gdoc-sub').innerText = t.gdocSub;
    if(document.getElementById('ui-gdoc-btn')) document.getElementById('ui-gdoc-btn').innerText = t.open;
    
    // Reminders Section
    if(document.getElementById('ui-reminders-label')) document.getElementById('ui-reminders-label').innerText = t.reminders;
    if(document.getElementById('ui-reminders-list')) document.getElementById('ui-reminders-list').innerHTML = t.remindersContent;
    
    // Navigation Bar Labels
    if(document.getElementById('ui-nav-journey')) document.getElementById('ui-nav-journey').innerText = t.journey;
    if(document.getElementById('ui-nav-category')) document.getElementById('ui-nav-category').innerText = t.category;
    if(document.getElementById('ui-nav-memos')) document.getElementById('ui-nav-memos').innerText = t.memos;

    // Main App Header Title logic
    const headerTitle = document.getElementById('app-header-title');
    if (currentTab === 'timeline') headerTitle.innerText = t.journey;
    else if (currentTab === 'category') headerTitle.innerText = t.category;
    else headerTitle.innerText = t.memos;

    // Populate Category Dropdown
    const sel = document.getElementById('category-select');
    const currentVal = sel.value || 'flight';
    sel.innerHTML = `
        <option value="flight">${t.catFlights}</option>
        <option value="hotel">${t.catHotels}</option>
        <option value="dining">${t.catMeals}</option>
        <option value="activity">${t.catTours}</option>
    `;
    sel.value = currentVal;
}

// ---------------------------------------------------------
// --- ADDING & REMOVING EVENTS (GROUPED FOR REFERENCE) ---
// ---------------------------------------------------------

/**
 * Opens the "Add New Event" modal and populates the date selector.
 */
function openAddModal() {
    const modal = document.getElementById('add-modal');
    modal.classList.remove('hidden');
    
    // Populate the date dropdown with active trip dates
    const dateSelect = document.getElementById('new-date-idx');
    dateSelect.innerHTML = activeTripData.map((d, i) => `
        <option value="${i}" ${i === currentDayIndex ? 'selected' : ''}>
            ${d.display} - ${d.city}
        </option>
    `).join('');
}

/**
 * Closes the "Add New Event" modal.
 */
function closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden');
}

/**
 * Handles the submission of the "Add Event" form.
 * Creates a new event, saves it to Local Storage, and updates the UI.
 */
function handleNewEvent(e) {
    e.preventDefault(); // Stop form refresh

    // 1. Get Values
    const dayIdx = parseInt(document.getElementById('new-date-idx').value);
    const type = document.getElementById('new-type').value;
    const time = document.getElementById('new-time').value;
    const title = document.getElementById('new-title').value;
    const details = document.getElementById('new-details').value;

    // 2. Create Event Object
    const newEvent = {
        type: type,
        title: title,
        titleZh: title, // Fallback for Chinese
        time: time,
        details: details,
        sub: "", // Empty string means no badge will show
        mapUrl: "" 
    };

    // 3. Add to Data
    activeTripData[dayIdx].events.push(newEvent);

    // 4. Save to Local Storage (Persist Data)
    localStorage.setItem('myTripData', JSON.stringify(activeTripData));

    // 5. Refresh UI
    closeAddModal();
    document.getElementById('add-event-form').reset();
    
    // If we added to the current day, re-render immediately
    if (dayIdx === currentDayIndex) {
        showDay(currentDayIndex);
    } else {
        // If added to another day, jump to that day
        showDay(dayIdx);
    }
    
    // Re-render categories if open
    if (currentTab === 'category') {
        renderCategory(document.getElementById('category-select').value);
    }
}

/**
 * Deletes a specific event.
 * @param {Event} event - The click event (to prevent bubbling)
 * @param {number} dayIdx - Index of the day in activeTripData
 * @param {number} evtIdx - Index of the event within that day
 */
function deleteEvent(event, dayIdx, evtIdx) {
    event.stopPropagation(); // Prevent triggering other clicks
    if (!confirm("Are you sure you want to delete this task?")) return;

    // Remove event from the specific day's list
    activeTripData[dayIdx].events.splice(evtIdx, 1);
    
    // Update Local Storage
    localStorage.setItem('myTripData', JSON.stringify(activeTripData));

    // Refresh View
    if (currentTab === 'timeline') {
        showDay(currentDayIndex);
    } else if (currentTab === 'category') {
        renderCategory(document.getElementById('category-select').value);
    }
}

// ---------------------------------------------------------
// --- RENDERING FUNCTIONS ---
// ---------------------------------------------------------

/**
 * Generates the horizontal date scroll bar at the top.
 */
function renderDateSelector() {
    const container = document.getElementById('date-scroll-container');
    container.innerHTML = activeTripData.map((d, i) => `
        <button onclick="showDay(${i})" id="date-pill-${i}" 
            class="date-pill flex-shrink-0 px-4 py-2 rounded-2xl border border-gray-300 bg-white text-center transition-all theme-transition">
            <div class="date-subtext text-[10px] font-bold uppercase text-secondary opacity-60">${currentLang === 'en' ? d.day : d.dayZh}</div>
            <div class="date-maintext text-sm font-bold text-text">${d.display}</div>
        </button>
    `).join('');
    
    // Highlight the current day after rendering
    showDay(currentDayIndex);
}

/**
 * Creates the HTML string for a single event card.
 */
function generateEventCard(e, dayIdx, evtIdx) {
    const t = translations[currentLang];
    const mapButton = e.mapUrl ? `
        <a href="${e.mapUrl}" target="_blank" class="mt-3 inline-flex items-center space-x-1 py-1 px-3 bg-primary/10 rounded-md border border-primary/30 text-primary theme-transition active:scale-95 transition-all">
            <span class="text-[10px] font-bold uppercase tracking-widest">${t.map}</span>
            <span class="text-[10px]">📍</span>
        </a>
    ` : '';

    // IGNORE "User Added" label if it exists in old data
    const shouldRenderSub = e.sub && e.sub !== "User Added";

    return `
        <div class="bg-white p-5 rounded-3xl border border-gray-300 shadow-sm flex space-x-4 items-start active:scale-95 transition-transform slide-up relative group">
            
            <button onclick="deleteEvent(event, ${dayIdx}, ${evtIdx})" class="absolute top-3 right-3 text-gray-300 hover:text-red-500 z-10 p-2 active:scale-90 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div class="w-12 h-12 rounded-2xl ${colors[e.type] || 'bg-gray-50'} flex items-center justify-center text-xl flex-shrink-0">
                ${icons[e.type] || '📍'}
            </div>
            <div class="flex-grow pr-6">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-50">${e.type}</span>
                    <span class="text-xs font-bold text-primary theme-transition">${e.time}</span>
                </div>
                <h3 class="font-bold text-lg leading-tight">${currentLang === 'en' ? e.title : (e.titleZh || e.title)}</h3>
                <p class="text-xs text-secondary mt-1">${e.details}</p>
                <div class="flex flex-wrap items-center gap-2">
                    ${shouldRenderSub ? `<div class="mt-3 text-[10px] py-1 px-2 bg-gray-50 inline-block rounded-md border border-gray-300 font-bold text-secondary uppercase">${e.sub}</div>` : ''}
                    ${mapButton}
                </div>
            </div>
        </div>
    `;
}

/**
 * Displays the specific day in the Timeline view.
 */
function showDay(idx) {
    currentDayIndex = idx;
    
    // Update pill styling
    document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('date-pill-active'));
    const activeBtn = document.getElementById(`date-pill-${idx}`);
    if (activeBtn) {
        activeBtn.classList.add('date-pill-active');
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    
    // Update Content using ACTIVE data
    const day = activeTripData[idx];
    updateTheme(day.city);
    document.getElementById('current-city-name').innerText = currentLang === 'en' ? day.city : day.cityZh;
    
    const container = document.getElementById('day-content-container');
    // Pass indices to generateEventCard
    container.innerHTML = day.events.map((e, evtIdx) => generateEventCard(e, idx, evtIdx)).join('');
}

/**
 * Switches between the 3 main tabs: Timeline, Category, Memos.
 */
function switchTab(tabId) {
    currentTab = tabId;
    const sections = ['timeline', 'category', 'memos'];
    
    // Toggle Visibility
    sections.forEach(id => {
        document.getElementById(`view-${id}`).classList.toggle('hidden', id !== tabId);
        
        const nav = document.getElementById(`nav-${id}`);
        if(nav) {
            nav.classList.toggle('active-nav', id === tabId);
            nav.classList.toggle('text-gray-400', id !== tabId);
        }
    });
    
    // Update Header and Global UI
    const header = document.getElementById('app-header-title');
    const scroller = document.getElementById('date-scroll-container');
    const banner = document.getElementById('city-banner');
    const t = translations[currentLang];
    
    if (tabId === 'timeline') { 
        header.innerText = t.journey; 
        scroller.classList.remove('hidden'); 
        banner.classList.remove('hidden');
        updateTheme(activeTripData[currentDayIndex].city);
    } else {
        scroller.classList.add('hidden');
        banner.classList.add('hidden');
        updateTheme("Transit"); // Neutral theme for other tabs
        
        if (tabId === 'category') {
            header.innerText = t.category;
            renderCategory(document.getElementById('category-select').value);
        }
        if (tabId === 'memos') {
            header.innerText = t.memos;
        }
    }
}

/**
 * Renders the filtered Category view.
 */
function renderCategory(category) {
    const container = document.getElementById('category-results');
    const items = [];
    
    activeTripData.forEach((day, dayIdx) => {
        day.events.forEach((e, evtIdx) => {
            if (e.type === category) {
                const t = translations[currentLang];
                const mapBtn = e.mapUrl ? `
                    <a href="${e.mapUrl}" target="_blank" class="mt-3 inline-flex items-center space-x-1 py-1 px-2 bg-primary/10 rounded-md border border-primary/30 text-primary theme-transition active:scale-95 transition-all">
                        <span class="text-[9px] font-bold uppercase tracking-widest">${t.map}</span>
                        <span class="text-[9px]">📍</span>
                    </a>
                ` : '';

                const shouldRenderSub = e.sub && e.sub !== "User Added";

                items.push(`
                    <div class="bg-white p-5 rounded-3xl border border-gray-300 shadow-sm flex space-x-4 items-start fade-in relative group">
                        
                        <button onclick="deleteEvent(event, ${dayIdx}, ${evtIdx})" class="absolute top-3 right-3 text-gray-300 hover:text-red-500 z-10 p-2 active:scale-90 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div class="w-10 h-10 rounded-xl ${colors[category]} flex items-center justify-center text-lg flex-shrink-0">
                            ${icons[category]}
                        </div>
                        <div class="flex-grow pr-6">
                            <div class="flex justify-between items-center mb-1">
                                <p class="text-[10px] font-bold text-primary theme-transition uppercase">${currentLang === 'en' ? day.day : day.dayZh} ${day.display} • ${currentLang === 'en' ? day.city : day.cityZh}</p>
                                <span class="text-[10px] font-bold text-secondary opacity-60">${e.time}</span>
                            </div>
                            <h4 class="font-bold text-sm leading-tight">${currentLang === 'en' ? e.title : (e.titleZh || e.title)}</h4>
                            <p class="text-[11px] text-secondary mt-1">${e.details}</p>
                            <div class="flex flex-wrap items-center gap-2">
                                ${shouldRenderSub ? `<p class="text-[10px] text-primary theme-transition mt-1 font-bold">${e.sub}</p>` : ''}
                                ${mapBtn}
                            </div>
                        </div>
                    </div>
                `);
            }
        });
    });
    
    container.innerHTML = items.length ? items.join('') : `<p class="text-center text-secondary text-xs p-8 italic">No items found.</p>`;
}

// --- Event Listeners & Initialization ---

function handleSwipe() {
    if (currentTab !== 'timeline') return;
    const xDiff = touchEndX - touchStartX;
    const yDiff = touchEndY - touchStartY;
    
    // Threshold for swipe (must be horizontal and long enough)
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
        if (xDiff < 0) { 
            // Swipe Left -> Next Day
            if (currentDayIndex < activeTripData.length - 1) showDay(currentDayIndex + 1); 
        } else { 
            // Swipe Right -> Previous Day
            if (currentDayIndex > 0) showDay(currentDayIndex - 1); 
        }
    }
}

// Wait for HTML to load before running logic
document.addEventListener('DOMContentLoaded', () => {
    // Add touch listeners to the timeline view
    const timeline = document.getElementById('view-timeline');
    if (timeline) {
        timeline.addEventListener('touchstart', e => { 
            touchStartX = e.changedTouches[0].screenX; 
            touchStartY = e.changedTouches[0].screenY; 
        }, false);
        
        timeline.addEventListener('touchend', e => { 
            touchEndX = e.changedTouches[0].screenX; 
            touchEndY = e.changedTouches[0].screenY; 
            handleSwipe(); 
        }, false);
    }

    // Initial render of the app
    updateUIStrings();
    renderDateSelector();
});