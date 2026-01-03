/* * APP LOGIC FILE
 * Handles all functionality + FIREBASE SYNCING + EDITABLE TITLE + DASHBOARD + SORTING + SEARCH
 */

// --- Global State ---
let currentDayIndex = 0;
let currentLang = 'en';
let currentTab = 'timeline';
let activeTripData = []; 
let currentTripTitle = "Trip"; 
let currentTripId = null; 
let unsubscribeTripListener = null; 
let currentSort = 'closest'; 
let currentSearch = '';
let cachedTrips = []; // Cache for instant searching

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

let db;

function waitForFirebase() {
    return new Promise(resolve => {
        if (window.firebaseImports) return resolve(true);
        console.log("Waiting for Firebase...");
        let checks = 0;
        const interval = setInterval(() => {
            checks++;
            if (window.firebaseImports) {
                clearInterval(interval);
                resolve(true);
            }
            if (checks > 30) { 
                clearInterval(interval);
                resolve(false);
            }
        }, 100);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App Loaded. Initializing...");

    const firebaseReady = await waitForFirebase();

    if (firebaseReady) {
        const { initializeApp, getFirestore } = window.firebaseImports;
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        await loadDashboard();
    } else {
        console.warn("Firebase imports timed out. Loading default view.");
        if (typeof tripData !== 'undefined') activeTripData = tripData;
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('trip-view').classList.remove('hidden');
        initTripView();
    }
});

// --- DASHBOARD LOGIC ---

function handleSearch(val) {
    currentSearch = val.toLowerCase();
    renderDashboardList(); // Filter locally, instant response
}

function changeSort(sortType) {
    currentSort = sortType;
    renderDashboardList(); // Sort locally
}

async function loadDashboard() {
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('trip-view').classList.add('hidden');
    document.title = "My Trips";

    if (unsubscribeTripListener) {
        unsubscribeTripListener(); 
        unsubscribeTripListener = null;
    }

    const container = document.getElementById('trips-list-container');
    
    if (!window.firebaseImports.collection || !window.firebaseImports.getDocs) {
        container.innerHTML = `<div class="text-red-500 text-center font-bold p-5">⚠️ Critical Error: Missing Imports</div>`;
        return;
    }

    const { collection, getDocs } = window.firebaseImports;
    
    try {
        // Fetch ONCE and cache
        const querySnapshot = await getDocs(collection(db, "trips"));
        cachedTrips = [];
        querySnapshot.forEach((doc) => {
            cachedTrips.push({ id: doc.id, ...doc.data() });
        });

        renderDashboardList();

    } catch (e) {
        console.error("Error loading trips:", e);
        container.innerHTML = `<div class="text-red-500 text-center">Error loading trips: ${e.message}</div>`;
    }
}

// Separate Render function for instant Sort/Search
function renderDashboardList() {
    const container = document.getElementById('trips-list-container');

    // 1. Filter
    let filteredTrips = cachedTrips.filter(trip => {
        const title = (trip.tripTitle || "").toLowerCase();
        return title.includes(currentSearch);
    });

    if (filteredTrips.length === 0) {
        if (cachedTrips.length === 0) {
            // No trips at all
             container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300">
                    <p class="text-gray-400 mb-4 text-sm font-bold uppercase tracking-wider">No cloud trips found</p>
                    <button onclick="importDefaultTrip()" class="bg-gray-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wide shadow-lg hover:scale-105 transition-all">
                        Import Default Trip (London 2026)
                    </button>
                </div>`;
        } else {
             // No search results
             container.innerHTML = `<div class="text-center py-10 text-gray-400 text-sm">No trips match "${currentSearch}"</div>`;
        }
        return;
    }

    // 2. Sort
    filteredTrips.sort((a, b) => {
        if (currentSort === 'alpha') {
            const titleA = (a.tripTitle || "").toLowerCase();
            const titleB = (b.tripTitle || "").toLowerCase();
            return titleA.localeCompare(titleB);
        } 
        else if (currentSort === 'newest') {
            return (b.createdAt || 0) - (a.createdAt || 0);
        } 
        else if (currentSort === 'closest') {
            const getDist = (t) => {
                if (!t.days || t.days.length === 0) return Infinity; 
                // We use first day as approximate start
                const startDate = new Date(t.days[0].date);
                // Difference in milliseconds, treat past trips as 'far' or use Math.abs?
                // Usually "Closest Upcoming". If pure absolute distance:
                return Math.abs(startDate - new Date());
            };
            return getDist(a) - getDist(b);
        }
        return 0;
    });

    // 3. Render
    container.innerHTML = filteredTrips.map(trip => `
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
}

async function importDefaultTrip() {
    const { collection, addDoc } = window.firebaseImports;
    
    if (typeof tripData === 'undefined') {
        alert("Error: tripData not found. Make sure data.js is loaded.");
        return;
    }
    
    try {
        const btn = document.querySelector('button[onclick="importDefaultTrip()"]');
        if(btn) btn.innerText = "Importing...";

        await addDoc(collection(db, "trips"), {
            tripTitle: "2026 Jan London/Spain/Lisbon", 
            days: tripData,
            createdAt: Date.now()
        });
        
        loadDashboard(); 
    } catch(e) {
        console.error(e);
        alert("Error importing: " + e.message);
    }
}

async function createNewTrip() {
    const title = prompt("Enter a name for your new trip:");
    if (!title) return;

    const { collection, addDoc } = window.firebaseImports;
    try {
        await addDoc(collection(db, "trips"), {
            tripTitle: title,
            days: [],
            createdAt: Date.now()
        });
        loadDashboard(); 
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
    document.getElementById('dashboard-search').value = ""; // Clear search when entering trip
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('trip-view').classList.remove('hidden');

    const { doc, onSnapshot } = window.firebaseImports;
    const tripRef = doc(db, "trips", tripId);

    unsubscribeTripListener = onSnapshot(tripRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            activeTripData = data.days || [];
            currentTripTitle = data.tripTitle || "Untitled Trip";
            
            document.title = currentTripTitle.toUpperCase();
            const titleInput = document.getElementById('trip-title-input');
            if (titleInput && document.activeElement !== titleInput) {
                titleInput.value = currentTripTitle;
            }

            initTripView(); 
        } else {
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
}

// --- CORE APP LOGIC ---

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

// ... HELPERS ...

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
window.deleteCurrentDay = deleteCurrentDay;

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
window.handleSearch = handleSearch;
window.changeSort = changeSort;
window.createNewTrip = createNewTrip;
window.deleteTrip = deleteTrip;
window.openTrip = openTrip;
window.backToDashboard = backToDashboard;
window.importDefaultTrip = importDefaultTrip;
