/* * APP LOGIC FILE
 * Handles all functionality + FIREBASE SYNCING + EDITABLE TITLE + DASHBOARD
 */

// --- Global State ---
let currentDayIndex = 0;
let currentLang = 'en';
let currentTab = 'timeline';
let activeTripData = []; // Starts empty, loads on selection
let currentTripTitle = "Trip"; 
let currentTripId = null; // Track which trip is active
let unsubscribeTripListener = null; // To stop listening when switching trips

// --- 👇 FIREBASE CONFIG 👇 ---
const firebaseConfig = {
    apiKey: "AIzaSyCdSkde68rfs8bRD7YTnyDbaFaqnt37dww",
    authDomain: "travelviewer-ddcad.firebaseapp.com",
    projectId: "travelviewer-ddcad",
    storageBucket: "travelviewer-ddcad.firebasestorage.app",
    messagingSenderId: "973734746656",
    appId: "1:973734746656:web:9065b2c66798b5c83ffa45",
    measurementId: "G-3CYPNNPCB7"
};

// Initialize Firebase Variables
let db;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App Loaded. Initializing...");

    // 1. Initialize Firebase
    if (window.firebaseImports) {
        const { initializeApp, getFirestore } = window.firebaseImports;
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        // 2. Load Dashboard first
        await loadDashboard();
    } else {
        // Fallback for offline dev
        console.warn("Firebase imports not found.");
        activeTripData = tripData; // Fallback to data.js
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('trip-view').classList.remove('hidden');
        initTripView();
    }
});

// --- DASHBOARD LOGIC ---

async function loadDashboard() {
    // Show Dashboard, Hide Trip
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('trip-view').classList.add('hidden');
    document.title = "My Trips";

    if (unsubscribeTripListener) {
        unsubscribeTripListener(); // Stop listening to specific trip
        unsubscribeTripListener = null;
    }

    const container = document.getElementById('trips-list-container');
    const { collection, getDocs } = window.firebaseImports;
    
    try {
        const querySnapshot = await getDocs(collection(db, "trips"));
        const trips = [];
        querySnapshot.forEach((doc) => {
            trips.push({ id: doc.id, ...doc.data() });
        });

        if (trips.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400">No trips found.<br>Create one above!</div>`;
            return;
        }

        container.innerHTML = trips.map(trip => `
            <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 active:scale-95 transition-transform relative group overflow-hidden">
                 <button onclick="deleteTrip(event, '${trip.id}')" class="absolute top-4 right-4 z-20 bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>

                 <div onclick="openTrip('${trip.id}')" class="cursor-pointer">
                    <div class="flex items-center space-x-4 mb-2">
                        <div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">✈️</div>
                        <div>
                            <h3 class="font-bold text-lg leading-tight text-gray-800">${trip.tripTitle || "Untitled Trip"}</h3>
                            <p class="text-xs text-secondary font-bold uppercase tracking-wider">${trip.days ? trip.days.length : 0} Days Planned</p>
                        </div>
                    </div>
                 </div>
            </div>
        `).join('');

    } catch (e) {
        console.error("Error loading trips:", e);
        container.innerHTML = `<div class="text-red-500 text-center">Error loading trips.</div>`;
    }
}

async function createNewTrip() {
    const title = prompt("Enter a name for your new trip:");
    if (!title) return;

    const { collection, addDoc } = window.firebaseImports;
    try {
        await addDoc(collection(db, "trips"), {
            tripTitle: title,
            days: [] // Empty start
        });
        loadDashboard(); // Refresh list
    } catch (e) {
        alert("Error creating trip: " + e.message);
    }
}

async function deleteTrip(event, tripId) {
    event.stopPropagation();
    if(!confirm("Delete this entire trip? This cannot be undone.")) return;

    const { doc, deleteDoc } = window.firebaseImports;
    try {
        await deleteDoc(doc(db, "trips", tripId));
        loadDashboard();
    } catch(e) {
        console.error(e);
    }
}

function openTrip(tripId) {
    currentTripId = tripId;
    
    // Switch Views
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('trip-view').classList.remove('hidden');

    const { doc, onSnapshot } = window.firebaseImports;
    const tripRef = doc(db, "trips", tripId);

    // Subscribe to this specific trip
    unsubscribeTripListener = onSnapshot(tripRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            activeTripData = data.days || [];
            currentTripTitle = data.tripTitle || "Untitled Trip";
            
            // Update UI
            document.title = currentTripTitle.toUpperCase();
            const titleInput = document.getElementById('trip-title-input');
            if (titleInput && document.activeElement !== titleInput) {
                titleInput.value = currentTripTitle;
            }

            initTripView(); // Re-render the timeline view
        } else {
            // Doc deleted while viewing? Back to dashboard
            backToDashboard();
        }
    });
}

function backToDashboard() {
    currentTripId = null;
    activeTripData = [];
    loadDashboard();
}

// --- TRIP VIEW INITIALIZATION ---

function initTripView() {
    updateUIStrings();
    renderDateSelector();
    enableDragScroll(); 
    
    if (currentTab === 'timeline') showDay(currentDayIndex);
    if (currentTab === 'category') renderCategory(document.getElementById('category-select').value);
    
    // Attach touch events
    const timeline = document.getElementById('view-timeline');
    if (timeline) {
        // Remove old listeners to prevent stacking? 
        // Simple way: just overwrite onclick/ontouch or clone node. 
        // For now, simple add is okay as page doesn't fully reload often.
    }
}

// --- CORE APP LOGIC (Previously in app.js, modified for generic data) ---

async function saveToCloud() {
    if (!currentTripId || !window.firebaseImports) return;
    const { doc, setDoc } = window.firebaseImports;
    
    try {
        await setDoc(doc(db, "trips", currentTripId), { 
            days: activeTripData,
            tripTitle: currentTripTitle 
        }, { merge: true });
        console.log("Saved to cloud.");
    } catch (e) {
        console.error("Error saving:", e);
    }
}

function handleTitleSave(inputElement) {
    const newTitle = inputElement.value.trim();
    if (newTitle && newTitle !== currentTripTitle) {
        currentTripTitle = newTitle;
        document.title = currentTripTitle.toUpperCase();
        saveToCloud();
    }
}

// ... (KEEP ALL HELPERS LIKE getDayData, updateTheme, etc. EXACTLY AS THEY WERE) ...
// ... Copying them below for completeness ...

const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const daysZh = ["日", "一", "二", "三", "四", "五", "六"];
const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDayData(dateStr) {
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayIdx = d.getDay();
    const dateNum = d.getDate();
    const monthIdx = d.getMonth();

    return {
        display: `${String(dateNum).padStart(2, '0')} ${monthsEn[monthIdx]}`,
        day: daysEn[dayIdx],
        dayZh: daysZh[dayIdx]
    };
}

let touchStartX, touchStartY, touchEndX, touchEndY;

function updateTheme(city) {
    const color = themes[city] || themes["Transit"];
    document.documentElement.style.setProperty('--primary-color', color);
}

function toggleLang() {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    updateUIStrings();
    renderDateSelector();
    if (currentTab === 'category') renderCategory(document.getElementById('category-select').value);
    if (currentTab === 'timeline') showDay(currentDayIndex);
}

function validateTimeField(inputElement) {
    const value = inputElement.value.trim();
    const errorMsg = document.getElementById('time-error-msg');
    if (!value) return true;
    const hasNumber = /\d/.test(value);
    if (!hasNumber) return true;
    
    const strictTimeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm|AM|PM)$/i;
    if (strictTimeRegex.test(value)) {
        inputElement.classList.remove('border-red-500', 'focus:ring-red-500');
        if(errorMsg) errorMsg.classList.add('hidden');
        return true;
    } else {
        inputElement.classList.add('border-red-500', 'focus:ring-red-500');
        if (errorMsg) {
            errorMsg.innerText = "Time must include AM or PM (e.g. '5:00 PM')";
            errorMsg.classList.remove('hidden');
        }
        return false;
    }
}

function updateUIStrings() {
    const t = translations[currentLang];
    
    const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };
    const setHtml = (id, htm) => { const el = document.getElementById(id); if(el) el.innerHTML = htm; };

    setTxt('ui-location-label', t.location);
    setTxt('lang-btn-text', t.langToggle);
    setTxt('ui-category-view-title', t.categoryView);
    setTxt('ui-category-desc', t.categoryDesc);
    setTxt('ui-filter-label', t.filterBy);
    setTxt('ui-memos-title', t.memos);
    setTxt('ui-memos-desc', t.memosDesc);
    setTxt('ui-gdoc-title', t.gdocTitle);
    setTxt('ui-gdoc-sub', t.gdocSub);
    setTxt('ui-gdoc-btn', t.open);
    setTxt('ui-reminders-label', t.reminders);
    setHtml('ui-reminders-list', t.remindersContent);
    setTxt('ui-nav-journey', t.journey);
    setTxt('ui-nav-category', t.category);
    setTxt('ui-nav-memos', t.memos);

    const headerTitle = document.getElementById('app-header-title');
    if (headerTitle) {
        if (currentTab === 'timeline') headerTitle.innerText = t.journey;
        else if (currentTab === 'category') headerTitle.innerText = t.category;
        else headerTitle.innerText = t.memos;
    }

    const sel = document.getElementById('category-select');
    if (sel) {
        const currentVal = sel.value || 'flight';
        sel.innerHTML = `
            <option value="flight">${t.catFlights}</option>
            <option value="hotel">${t.catHotels}</option>
            <option value="dining">${t.catMeals}</option>
            <option value="activity">${t.catTours}</option>
        `;
        sel.value = currentVal;
    }
}

function openAddModal() {
    const modal = document.getElementById('add-modal');
    modal.classList.remove('hidden');
    const currentDay = activeTripData[currentDayIndex];
    if (currentDay) {
        document.getElementById('new-date-picker').value = currentDay.date;
        document.getElementById('new-city').value = currentDay.city;
    }
}

function closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden');
    const timeInput = document.getElementById('new-time');
    if(timeInput) timeInput.classList.remove('border-red-500', 'focus:ring-red-500');
}

function handleNewEvent(e) {
    e.preventDefault();
    const timeInput = document.getElementById('new-time');
    if (!validateTimeField(timeInput)) {
        timeInput.focus();
        alert("⚠️ Invalid Time Format!\nPlease use AM/PM (e.g. '7:00 PM').");
        return; 
    }

    const inputDate = document.getElementById('new-date-picker').value;
    const inputCity = document.getElementById('new-city').value;
    const type = document.getElementById('new-type').value;
    const time = document.getElementById('new-time').value;
    const title = document.getElementById('new-title').value;
    const details = document.getElementById('new-details').value;

    const newEvent = {
        type: type,
        title: title,
        titleZh: title, 
        time: time,
        details: details,
        sub: "",
        mapUrl: "" 
    };

    let targetDayIndex = activeTripData.findIndex(d => d.date === inputDate);

    if (targetDayIndex !== -1) {
        activeTripData[targetDayIndex].events.push(newEvent);
    } else {
        const dayInfo = getDayData(inputDate);
        const newDay = {
            date: inputDate,
            display: dayInfo.display,
            day: dayInfo.day,
            dayZh: dayInfo.dayZh,
            city: inputCity,
            cityZh: inputCity, 
            events: [newEvent]
        };
        activeTripData.push(newDay);
        activeTripData.sort((a, b) => a.date.localeCompare(b.date));
        targetDayIndex = activeTripData.findIndex(d => d.date === inputDate);
    }

    saveToCloud();
    closeAddModal();
    document.getElementById('add-event-form').reset();
    showDay(targetDayIndex);
}

function deleteEvent(event, dayIdx, evtIdx) {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;

    activeTripData[dayIdx].events.splice(evtIdx, 1);

    if (activeTripData[dayIdx].events.length === 0) {
        activeTripData.splice(dayIdx, 1);
        if (currentDayIndex >= activeTripData.length) {
            currentDayIndex = Math.max(0, activeTripData.length - 1);
        }
    }

    saveToCloud();
    renderDateSelector(); 
    if (activeTripData.length > 0) showDay(currentDayIndex);
}

function deleteCurrentDay() {
    if (activeTripData.length === 0) return;
    const currentDay = activeTripData[currentDayIndex];
    if (!currentDay) return;

    const msg = `Are you sure you want to delete EVERYTHING for ${currentDay.display} (${currentDay.city})?\n\nThis cannot be undone.`;
    if (!confirm(msg)) return;

    activeTripData.splice(currentDayIndex, 1);

    if (currentDayIndex >= activeTripData.length) {
        currentDayIndex = Math.max(0, activeTripData.length - 1);
    }

    saveToCloud();
    renderDateSelector();
    
    if (activeTripData.length === 0) {
        document.getElementById('day-content-container').innerHTML = 
            `<div class="text-center text-gray-400 mt-10 text-sm">No days planned.<br>Click "+" to add one.</div>`;
        document.getElementById('current-city-name').innerText = "Journey";
        updateTheme("Transit");
    } else {
        showDay(currentDayIndex);
    }
}
window.deleteCurrentDay = deleteCurrentDay;

function renderDateSelector() {
    const container = document.getElementById('date-scroll-container');
    if (!container) return;
    
    if (activeTripData.length === 0) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = activeTripData.map((d, i) => `
        <button onclick="showDay(${i})" id="date-pill-${i}" 
            class="date-pill flex-shrink-0 px-4 py-2 rounded-2xl border border-gray-300 bg-white text-center transition-all theme-transition select-none">
            <div class="date-subtext text-[10px] font-bold uppercase text-secondary opacity-60 pointer-events-none">${currentLang === 'en' ? d.day : d.dayZh}</div>
            <div class="date-maintext text-sm font-bold text-text pointer-events-none">${d.display}</div>
        </button>
    `).join('');
    
    if(activeTripData.length > 0 && !activeTripData[currentDayIndex]) {
        currentDayIndex = 0; // Reset if out of bounds
        showDay(0);
    }
}

function generateEventCard(e, dayIdx, evtIdx) {
    const t = translations[currentLang];
    const mapButton = e.mapUrl ? `
        <a href="${e.mapUrl}" target="_blank" class="mt-3 inline-flex items-center space-x-1 py-1 px-3 bg-primary/10 rounded-md border border-primary/30 text-primary theme-transition active:scale-95 transition-all">
            <span class="text-[10px] font-bold uppercase tracking-widest">${t.map}</span>
            <span class="text-[10px]">📍</span>
        </a>
    ` : '';
    const shouldRenderSub = e.sub && e.sub !== "User Added";

    return `
        <div class="bg-white p-5 rounded-3xl border border-gray-300 shadow-sm flex space-x-4 items-start active:scale-95 transition-transform slide-up relative group">
            <button onclick="deleteEvent(event, ${dayIdx}, ${evtIdx})" class="absolute top-2 right-2 bg-red-50 text-red-500 rounded-full p-2 hover:bg-red-100 hover:scale-110 z-20 transition-all shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div class="w-12 h-12 rounded-2xl ${colors[e.type] || 'bg-gray-50'} flex items-center justify-center text-xl flex-shrink-0">
                ${icons[e.type] || '📍'}
            </div>
            <div class="flex-grow pr-8"> <div class="flex justify-between items-center mb-1">
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

function showDay(idx) {
    if (activeTripData.length === 0) {
        document.getElementById('day-content-container').innerHTML = 
            `<div class="text-center text-gray-400 mt-10 text-sm">No days planned.<br>Click "+" to add one.</div>`;
        document.getElementById('current-city-name').innerText = "Journey";
        return;
    }

    if (idx >= activeTripData.length) idx = activeTripData.length - 1;
    if (idx < 0) idx = 0;
    
    currentDayIndex = idx;
    document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('date-pill-active'));
    const activeBtn = document.getElementById(`date-pill-${idx}`);
    if (activeBtn) {
        activeBtn.classList.add('date-pill-active');
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    const day = activeTripData[idx];
    if(day) {
        updateTheme(day.city);
        document.getElementById('current-city-name').innerText = currentLang === 'en' ? day.city : day.cityZh;
        const container = document.getElementById('day-content-container');
        container.innerHTML = day.events.map((e, evtIdx) => generateEventCard(e, idx, evtIdx)).join('');
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    const sections = ['timeline', 'category', 'memos'];
    sections.forEach(id => {
        document.getElementById(`view-${id}`).classList.toggle('hidden', id !== tabId);
        const nav = document.getElementById(`nav-${id}`);
        if(nav) {
            nav.classList.toggle('active-nav', id === tabId);
            nav.classList.toggle('text-gray-400', id !== tabId);
        }
    });
    
    const header = document.getElementById('app-header-title');
    const scroller = document.getElementById('date-scroll-container');
    const banner = document.getElementById('city-banner');
    const t = translations[currentLang];
    
    if (tabId === 'timeline') { 
        header.innerText = t.journey; 
        scroller.classList.remove('hidden'); 
        banner.classList.remove('hidden');
        if(activeTripData[currentDayIndex]) updateTheme(activeTripData[currentDayIndex].city);
    } else {
        scroller.classList.add('hidden');
        banner.classList.add('hidden');
        updateTheme("Transit");
        if (tabId === 'category') {
            header.innerText = t.category;
            renderCategory(document.getElementById('category-select').value);
        }
        if (tabId === 'memos') header.innerText = t.memos;
    }
}

function renderCategory(category) {
    const container = document.getElementById('category-results');
    const items = [];
    activeTripData.forEach((day, dayIdx) => {
        day.events.forEach((e, evtIdx) => {
            if (e.type === category) {
                const t = translations[currentLang];
                const shouldRenderSub = e.sub && e.sub !== "User Added";
                items.push(`
                    <div class="bg-white p-5 rounded-3xl border border-gray-300 shadow-sm flex space-x-4 items-start fade-in relative group">
                        <button onclick="deleteEvent(event, ${dayIdx}, ${evtIdx})" class="absolute top-2 right-2 bg-red-50 text-red-500 rounded-full p-2 hover:bg-red-100 hover:scale-110 z-20 transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div class="w-10 h-10 rounded-xl ${colors[category]} flex items-center justify-center text-lg flex-shrink-0">${icons[category]}</div>
                        <div class="flex-grow pr-8">
                            <div class="flex justify-between items-center mb-1">
                                <p class="text-[10px] font-bold text-primary theme-transition uppercase">${currentLang === 'en' ? day.day : day.dayZh} ${day.display} • ${currentLang === 'en' ? day.city : day.cityZh}</p>
                                <span class="text-[10px] font-bold text-secondary opacity-60">${e.time}</span>
                            </div>
                            <h4 class="font-bold text-sm leading-tight">${currentLang === 'en' ? e.title : (e.titleZh || e.title)}</h4>
                            <p class="text-[11px] text-secondary mt-1">${e.details}</p>
                            <div class="flex flex-wrap items-center gap-2">
                                ${shouldRenderSub ? `<p class="text-[10px] text-primary theme-transition mt-1 font-bold">${e.sub}</p>` : ''}
                            </div>
                        </div>
                    </div>
                `);
            }
        });
    });
    container.innerHTML = items.length ? items.join('') : `<p class="text-center text-secondary text-xs p-8 italic">No items found.</p>`;
}

function handleSwipe() {
    if (currentTab !== 'timeline') return;
    const xDiff = touchEndX - touchStartX;
    const yDiff = touchEndY - touchStartY;
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
        if (xDiff < 0) { 
            if (currentDayIndex < activeTripData.length - 1) showDay(currentDayIndex + 1); 
        } else { 
            if (currentDayIndex > 0) showDay(currentDayIndex - 1); 
        }
    }
}

function enableDragScroll() {
    const slider = document.getElementById('date-scroll-container');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false; 

    // Styles for grab cursor and NO TEXT SELECTION
    slider.style.cursor = 'grab';
    slider.style.userSelect = 'none'; 
    slider.style.webkitUserSelect = 'none';

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false; 
        slider.style.cursor = 'grabbing';
        
        e.preventDefault(); 
        slider.style.scrollBehavior = 'auto';

        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'grab';
        slider.style.scrollBehavior = 'smooth';
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'grab';
        slider.style.scrollBehavior = 'smooth';
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        
        e.preventDefault(); 
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX); 
        
        if (Math.abs(walk) > 3) {
            isDragging = true;
            slider.scrollLeft = scrollLeft - walk;
        }
    });

    slider.addEventListener('click', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = false; 
        }
    }, true); 
}
// Attach dashboard functions to window
window.createNewTrip = createNewTrip;
window.deleteTrip = deleteTrip;
window.openTrip = openTrip;
window.backToDashboard = backToDashboard;