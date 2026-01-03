// js/trip.js
import { db } from './firebase-config.js';
import { getDayData, updateTheme, enableDragScroll } from './utils.js';
import { loadDashboard } from './dashboard.js';

// Global state for the active trip
export let activeTripData = [];
export let currentTripId = null;
export let currentTripTitle = "";

let currentDayIndex = 0;
let currentLang = 'en';
let currentTab = 'timeline';
let unsubscribeListener = null;

// --- Initialization ---

export function openTrip(tripId) {
    console.log("Opening trip:", tripId);
    currentTripId = tripId;
    
    // Switch UI Views
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('trip-view').classList.remove('hidden');

    const { doc, onSnapshot } = window.firebaseImports;
    
    // Unsubscribe from previous listener if exists
    if (unsubscribeListener) unsubscribeListener();

    // Listen to this specific trip document
    unsubscribeListener = onSnapshot(doc(db, "trips", tripId), (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            console.log("Trip data loaded:", data);
            
            activeTripData = data.days || [];
            currentTripTitle = data.tripTitle || "Trip";
            
            // Update Title
            document.title = currentTripTitle.toUpperCase();
            const titleInput = document.getElementById('trip-title-input');
            if(titleInput && document.activeElement !== titleInput) {
                titleInput.value = currentTripTitle;
            }

            initTripView(); 
        } else {
            console.warn("Trip document not found!");
            loadDashboard(); 
        }
    });
}

function initTripView() {
    console.log("Initializing Trip View...");
    
    updateUIStrings();

    renderDateSelector();
    
    // Set theme based on current day's city
    const city = (activeTripData[currentDayIndex]) ? activeTripData[currentDayIndex].city : "Transit";
    updateTheme(city);
    
    showDay(currentDayIndex);
    enableDragScroll(); 
}

// --- 👇 FIXED FUNCTION: Removed extra emojis ---
function updateUIStrings() {
    const t = (window.translations && window.translations[currentLang]) ? window.translations[currentLang] : {};
    
    const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.innerText = txt; };
    const setHtml = (id, htm) => { const el = document.getElementById(id); if(el) el.innerHTML = htm; };

    // Update Text Labels
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

    // Update Header Title based on current tab
    const headerTitle = document.getElementById('app-header-title');
    if (headerTitle) {
        if (currentTab === 'timeline') headerTitle.innerText = t.journey;
        else if (currentTab === 'category') headerTitle.innerText = t.category;
        else headerTitle.innerText = t.memos;
    }

    // 👇 FIXED: Removed the extra emojis here because ${f}, ${h} etc already contain them from data.js
    const sel = document.getElementById('category-select');
    if (sel) {
        const currentVal = sel.value || 'flight';
        const f = t.catFlights || 'Flights';
        const h = t.catHotels || 'Hotels';
        const m = t.catMeals || 'Dining';
        const a = t.catTours || 'Activities';
        
        sel.innerHTML = `
            <option value="flight">${f}</option>
            <option value="hotel">${h}</option>
            <option value="dining">${m}</option>
            <option value="activity">${a}</option>
            <option value="transfer">🚙 Transfer</option>
        `;
        sel.value = currentVal;
    }
}

// --- Data Saving ---

async function saveToCloud() {
    if (!currentTripId) return;
    const { doc, setDoc } = window.firebaseImports;
    try {
        await setDoc(doc(db, "trips", currentTripId), { 
            days: activeTripData, 
            tripTitle: currentTripTitle 
        }, { merge: true });
    } catch (e) {
        console.error("Save error:", e);
    }
}

export function handleTitleSave(input) {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== currentTripTitle) {
        currentTripTitle = newTitle;
        saveToCloud();
    }
}

// --- Actions (Add/Delete) ---

export function handleNewEvent(e) {
    e.preventDefault();
    const dateInput = document.getElementById('new-date-picker').value;
    const cityInput = document.getElementById('new-city').value;
    
    const newEvent = {
        type: document.getElementById('new-type').value,
        title: document.getElementById('new-title').value,
        titleZh: document.getElementById('new-title').value, 
        time: document.getElementById('new-time').value,
        details: document.getElementById('new-details').value,
        sub: "", 
        mapUrl: ""
    };

    let targetIdx = activeTripData.findIndex(d => d.date === dateInput);
    
    if (targetIdx !== -1) {
        activeTripData[targetIdx].events.push(newEvent);
    } else {
        const d = getDayData(dateInput);
        activeTripData.push({
            date: dateInput, 
            display: d.display, 
            day: d.day, 
            dayZh: d.dayZh,
            city: cityInput, 
            cityZh: cityInput, 
            events: [newEvent]
        });
        activeTripData.sort((a, b) => a.date.localeCompare(b.date));
        targetIdx = activeTripData.findIndex(d => d.date === dateInput);
    }

    saveToCloud();
    document.getElementById('add-modal').classList.add('hidden');
    document.getElementById('add-event-form').reset();
    
    showDay(targetIdx);
    renderDateSelector(); 
}

export function deleteEvent(e, dayIdx, evtIdx) {
    e.stopPropagation();
    if (!confirm("Delete task?")) return;
    
    activeTripData[dayIdx].events.splice(evtIdx, 1);
    
    if (activeTripData[dayIdx].events.length === 0) {
        activeTripData.splice(dayIdx, 1);
        if (currentDayIndex >= activeTripData.length) {
            currentDayIndex = Math.max(0, activeTripData.length - 1);
        }
        renderDateSelector();
    }
    
    saveToCloud();
    
    // Refresh current view
    if(currentTab === 'timeline') showDay(currentDayIndex);
    if(currentTab === 'category') renderCategory(document.getElementById('category-select').value);
}

export function deleteCurrentDay() {
    if (!activeTripData[currentDayIndex]) return;
    if (!confirm("Delete entire day and all events?")) return;
    
    activeTripData.splice(currentDayIndex, 1);
    currentDayIndex = Math.max(0, currentDayIndex - 1);
    
    saveToCloud();
    renderDateSelector();
    showDay(currentDayIndex);
}

// --- Rendering Logic ---

export function showDay(idx) {
    if(idx < 0) idx = 0;
    if(idx >= activeTripData.length && activeTripData.length > 0) idx = activeTripData.length - 1;
    
    currentDayIndex = idx;
    
    document.querySelectorAll('.date-pill').forEach((p, i) => {
        if(i === idx) p.classList.add('date-pill-active');
        else p.classList.remove('date-pill-active');
    });

    const day = activeTripData[idx];
    const container = document.getElementById('day-content-container');
    
    if (!day) {
        container.innerHTML = `<div class="text-center text-gray-400 mt-10 text-sm">No days planned.<br>Click + to add one.</div>`;
        document.getElementById('current-city-name').innerText = "Journey";
        return;
    }

    const icons = window.icons || {};
    const colors = window.colors || {};

    document.getElementById('current-city-name').innerText = currentLang === 'en' ? day.city : day.cityZh;
    updateTheme(day.city);

    const pill = document.getElementById(`date-pill-${idx}`);
    if(pill) pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    container.innerHTML = day.events.map((e, i) => `
        <div class="bg-white p-5 rounded-3xl border border-gray-300 shadow-sm flex space-x-4 items-start relative group fade-in">
            <button onclick="deleteEvent(event, ${idx}, ${i})" class="absolute top-2 right-2 text-red-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div class="w-12 h-12 rounded-2xl ${colors[e.type] || 'bg-gray-100 text-gray-500'} flex items-center justify-center text-xl shrink-0">
                ${icons[e.type] || '📍'}
            </div>
            <div class="flex-grow">
                <div class="flex justify-between mb-1">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-50">${e.type}</span>
                    <span class="text-xs font-bold text-primary">${e.time}</span>
                </div>
                <h3 class="font-bold text-lg leading-tight text-gray-800">${currentLang === 'en' ? e.title : (e.titleZh || e.title)}</h3>
                <p class="text-xs text-secondary mt-1">${e.details}</p>
                ${e.mapUrl ? `<a href="${e.mapUrl}" target="_blank" class="mt-2 inline-flex items-center text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/20 hover:bg-primary/10 transition-colors">MAP 📍</a>` : ''}
            </div>
        </div>
    `).join('');
}

export function renderDateSelector() {
    const container = document.getElementById('date-scroll-container');
    if (!container) return;
    
    if (!activeTripData.length) { 
        container.innerHTML = ""; 
        return; 
    }
    
    container.innerHTML = activeTripData.map((d, i) => `
        <button onclick="showDay(${i})" id="date-pill-${i}" class="date-pill shrink-0 px-4 py-2 rounded-2xl border border-gray-300 bg-white text-center transition-all cursor-pointer hover:border-primary/50">
            <div class="text-[10px] font-bold uppercase text-secondary opacity-60 pointer-events-none">${currentLang === 'en' ? d.day : d.dayZh}</div>
            <div class="text-sm font-bold text-text pointer-events-none">${d.display}</div>
        </button>
    `).join('');
}

// --- Toggles & Tabs ---

export function toggleLang() {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    
    updateUIStrings(); 
    
    renderDateSelector(); 
    showDay(currentDayIndex); 
    
    if (currentTab === 'category') {
        renderCategory(document.getElementById('category-select').value);
    }
}

export function switchTab(tab) {
    currentTab = tab;
    ['timeline', 'category', 'memos'].forEach(t => {
        document.getElementById(`view-${t}`).classList.toggle('hidden', t !== tab);
        document.getElementById(`nav-${t}`).classList.toggle('active-nav', t === tab);
    });

    updateUIStrings();
    
    if(tab === 'timeline') showDay(currentDayIndex);
    if(tab === 'category') renderCategory(document.getElementById('category-select').value);
}

export function openAddModal() { document.getElementById('add-modal').classList.remove('hidden'); }
export function closeAddModal() { document.getElementById('add-modal').classList.add('hidden'); }

// --- Category Render ---

export function renderCategory(category) {
    const container = document.getElementById('category-results');
    if (!container) return;
    
    if(!category) category = 'flight'; 

    const icons = window.icons || {};
    const colors = window.colors || {};
    
    const items = [];
    activeTripData.forEach((day, dayIdx) => {
        day.events.forEach((e, evtIdx) => {
            if (e.type === category) {
                items.push(`
                    <div class="bg-white p-5 rounded-3xl border border-gray-300 shadow-sm flex space-x-4 items-start relative group fade-in mb-3">
                        <button onclick="deleteEvent(event, ${dayIdx}, ${evtIdx})" class="absolute top-2 right-2 text-red-300 hover:text-red-500 p-2">✕</button>
                        <div class="w-10 h-10 rounded-xl ${colors[category] || 'bg-gray-100'} flex items-center justify-center text-lg shrink-0">${icons[category] || '📍'}</div>
                        <div class="flex-grow">
                            <div class="flex justify-between mb-1">
                                <p class="text-[10px] font-bold text-primary uppercase">${currentLang === 'en' ? day.day : day.dayZh} ${day.display} • ${day.city}</p>
                                <span class="text-[10px] font-bold text-secondary opacity-60">${e.time}</span>
                            </div>
                            <h4 class="font-bold text-sm leading-tight">${currentLang === 'en' ? e.title : (e.titleZh || e.title)}</h4>
                            <p class="text-[11px] text-secondary mt-1">${e.details}</p>
                        </div>
                    </div>
                `);
            }
        });
    });
    container.innerHTML = items.length ? items.join('') : `<p class="text-center text-secondary text-xs p-8 italic">No items found.</p>`;
}