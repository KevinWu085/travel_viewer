/* * APP LOGIC FILE
 * Handles all functionality + FIREBASE SYNCING + EDITABLE TITLE + TAB SYNC
 */

// --- Global State ---
let currentDayIndex = 0;
let currentLang = 'en';
let currentTab = 'timeline';
let activeTripData = tripData; 
let currentTripTitle = "2026 Jan London/Spain/Lisbon"; // Default title

// --- 👇 FIREBASE SETUP (YOUR KEYS) 👇 ---
const firebaseConfig = {
    apiKey: "AIzaSyCdSkde68rfs8bRD7YTnyDbaFaqnt37dww",
    authDomain: "travelviewer-ddcad.firebaseapp.com",
    projectId: "travelviewer-ddcad",
    storageBucket: "travelviewer-ddcad.firebasestorage.app",
    messagingSenderId: "973734746656",
    appId: "1:973734746656:web:9065b2c66798b5c83ffa45",
    measurementId: "G-3CYPNNPCB7"
};

// Initialize Firebase
let db;
let tripDocRef;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Firebase
    if (window.firebaseImports) {
        const { initializeApp, getFirestore, doc, onSnapshot } = window.firebaseImports;
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        tripDocRef = doc(db, "trips", "mainTrip");

        // 2. LISTEN for Cloud Updates
        onSnapshot(tripDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                console.log("Cloud update received");
                
                // Update Events
                if (data.days) activeTripData = data.days;
                
                // Update Title (if exists in cloud)
                if (data.tripTitle) {
                    currentTripTitle = data.tripTitle;
                    
                    // 👇 NEW: Update Browser Tab Title on Load 👇
                    document.title = currentTripTitle;
                    
                    // Update Input Field
                    const titleInput = document.getElementById('trip-title-input');
                    if (titleInput && document.activeElement !== titleInput) {
                        titleInput.value = currentTripTitle;
                    }
                }
                
                // Refresh UI
                renderDateSelector();
                if (currentTab === 'timeline') showDay(currentDayIndex);
                if (currentTab === 'category') renderCategory(document.getElementById('category-select').value);
            } else {
                // If cloud is empty, save default data
                saveToCloud();
            }
        });
    }

    updateUIStrings();
    renderDateSelector();
    
    // Add touch listeners
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
});

/**
 * SAVES Title and Events to Cloud
 */
async function saveToCloud() {
    if (!tripDocRef || !window.firebaseImports) return;
    const { setDoc } = window.firebaseImports;
    
    try {
        await setDoc(tripDocRef, { 
            days: activeTripData,
            tripTitle: currentTripTitle 
        });
        console.log("Saved to cloud!");
    } catch (e) {
        console.error("Error saving:", e);
    }
}

/**
 * Handles saving the title when user clicks away
 */
function handleTitleSave(inputElement) {
    const newTitle = inputElement.value.trim();
    if (newTitle && newTitle !== currentTripTitle) {
        currentTripTitle = newTitle;
        
        // 👇 NEW: Update Browser Tab Title Immediately 👇
        document.title = currentTripTitle;
        
        saveToCloud(); // Push new title to phone/PC
    }
}

// --- Standard App Logic Below ---

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
    
    if(document.getElementById('ui-location-label')) document.getElementById('ui-location-label').innerText = t.location;
    if(document.getElementById('lang-btn-text')) document.getElementById('lang-btn-text').innerText = t.langToggle;
    
    // View Titles
    if(document.getElementById('ui-category-view-title')) document.getElementById('ui-category-view-title').innerText = t.categoryView;
    if(document.getElementById('ui-category-desc')) document.getElementById('ui-category-desc').innerText = t.categoryDesc;
    if(document.getElementById('ui-filter-label')) document.getElementById('ui-filter-label').innerText = t.filterBy;
    if(document.getElementById('ui-memos-title')) document.getElementById('ui-memos-title').innerText = t.memos;
    if(document.getElementById('ui-memos-desc')) document.getElementById('ui-memos-desc').innerText = t.memosDesc;
    
    if(document.getElementById('ui-gdoc-title')) document.getElementById('ui-gdoc-title').innerText = t.gdocTitle;
    if(document.getElementById('ui-gdoc-sub')) document.getElementById('ui-gdoc-sub').innerText = t.gdocSub;
    if(document.getElementById('ui-gdoc-btn')) document.getElementById('ui-gdoc-btn').innerText = t.open;
    
    if(document.getElementById('ui-reminders-label')) document.getElementById('ui-reminders-label').innerText = t.reminders;
    if(document.getElementById('ui-reminders-list')) document.getElementById('ui-reminders-list').innerHTML = t.remindersContent;
    
    if(document.getElementById('ui-nav-journey')) document.getElementById('ui-nav-journey').innerText = t.journey;
    if(document.getElementById('ui-nav-category')) document.getElementById('ui-nav-category').innerText = t.category;
    if(document.getElementById('ui-nav-memos')) document.getElementById('ui-nav-memos').innerText = t.memos;

    const headerTitle = document.getElementById('app-header-title');
    if (currentTab === 'timeline') headerTitle.innerText = t.journey;
    else if (currentTab === 'category') headerTitle.innerText = t.category;
    else headerTitle.innerText = t.memos;

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

// --- Event Actions ---

function openAddModal() {
    const modal = document.getElementById('add-modal');
    modal.classList.remove('hidden');
    const dateSelect = document.getElementById('new-date-idx');
    dateSelect.innerHTML = activeTripData.map((d, i) => `
        <option value="${i}" ${i === currentDayIndex ? 'selected' : ''}>
            ${d.display} - ${d.city}
        </option>
    `).join('');
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

    const dayIdx = parseInt(document.getElementById('new-date-idx').value);
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

    activeTripData[dayIdx].events.push(newEvent);
    saveToCloud();

    closeAddModal();
    document.getElementById('add-event-form').reset();
    
    if (dayIdx === currentDayIndex) showDay(currentDayIndex);
    else showDay(dayIdx);
}

function deleteEvent(event, dayIdx, evtIdx) {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;
    activeTripData[dayIdx].events.splice(evtIdx, 1);
    saveToCloud();
}

// --- Rendering ---

function renderDateSelector() {
    const container = document.getElementById('date-scroll-container');
    container.innerHTML = activeTripData.map((d, i) => `
        <button onclick="showDay(${i})" id="date-pill-${i}" 
            class="date-pill flex-shrink-0 px-4 py-2 rounded-2xl border border-gray-300 bg-white text-center transition-all theme-transition">
            <div class="date-subtext text-[10px] font-bold uppercase text-secondary opacity-60">${currentLang === 'en' ? d.day : d.dayZh}</div>
            <div class="date-maintext text-sm font-bold text-text">${d.display}</div>
        </button>
    `).join('');
    showDay(currentDayIndex);
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