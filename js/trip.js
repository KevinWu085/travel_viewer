// js/trip.js
import { db } from './firebase-config.js';
import { getDayData, updateTheme, enableDragScroll } from './utils.js';
import { loadDashboard } from './dashboard.js';

// State for the active trip
export let activeTripData = [];
export let currentTripId = null;
export let currentTripTitle = "";
let currentDayIndex = 0;
let currentLang = 'en';
let currentTab = 'timeline';
let unsubscribeListener = null;

// --- Initialization ---

export function openTrip(tripId) {
    currentTripId = tripId;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('trip-view').classList.remove('hidden');

    const { doc, onSnapshot } = window.firebaseImports;
    if (unsubscribeListener) unsubscribeListener();

    unsubscribeListener = onSnapshot(doc(db, "trips", tripId), (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            activeTripData = data.days || [];
            currentTripTitle = data.tripTitle || "Trip";
            
            document.title = currentTripTitle.toUpperCase();
            const titleInput = document.getElementById('trip-title-input');
            if(titleInput && document.activeElement !== titleInput) titleInput.value = currentTripTitle;

            initTripView(); 
        } else {
            loadDashboard(); // Trip deleted remotely
        }
    });
}

function initTripView() {
    renderDateSelector();
    updateTheme(activeTripData[currentDayIndex]?.city || "Transit");
    showDay(currentDayIndex);
    enableDragScroll();
}

// --- Data Saving ---

async function saveToCloud() {
    if (!currentTripId) return;
    const { doc, setDoc } = window.firebaseImports;
    await setDoc(doc(db, "trips", currentTripId), { 
        days: activeTripData, tripTitle: currentTripTitle 
    }, { merge: true });
}

export function handleTitleSave(input) {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== currentTripTitle) {
        currentTripTitle = newTitle;
        saveToCloud();
    }
}

// --- Actions ---

export function handleNewEvent(e) {
    e.preventDefault();
    const dateInput = document.getElementById('new-date-picker').value;
    const cityInput = document.getElementById('new-city').value;
    // ... (rest of logic similar to before, gathering fields)
    const newEvent = {
        type: document.getElementById('new-type').value,
        title: document.getElementById('new-title').value,
        titleZh: document.getElementById('new-title').value, 
        time: document.getElementById('new-time').value,
        details: document.getElementById('new-details').value,
        sub: "", mapUrl: ""
    };

    let targetIdx = activeTripData.findIndex(d => d.date === dateInput);
    if (targetIdx !== -1) {
        activeTripData[targetIdx].events.push(newEvent);
    } else {
        const d = getDayData(dateInput);
        activeTripData.push({
            date: dateInput, display: d.display, day: d.day, dayZh: d.dayZh,
            city: cityInput, cityZh: cityInput, events: [newEvent]
        });
        activeTripData.sort((a, b) => a.date.localeCompare(b.date));
        targetIdx = activeTripData.findIndex(d => d.date === dateInput);
    }

    saveToCloud();
    document.getElementById('add-modal').classList.add('hidden');
    document.getElementById('add-event-form').reset();
    showDay(targetIdx);
}

export function deleteEvent(e, dayIdx, evtIdx) {
    e.stopPropagation();
    if (!confirm("Delete task?")) return;
    activeTripData[dayIdx].events.splice(evtIdx, 1);
    
    // Remove day if empty? (User previously asked for this feature)
    /* if (activeTripData[dayIdx].events.length === 0) {
        activeTripData.splice(dayIdx, 1);
        if (currentDayIndex >= activeTripData.length) currentDayIndex = Math.max(0, activeTripData.length - 1);
    }
    */
    saveToCloud();
    // Re-render handled by snapshot listener automatically usually, 
    // but for instant feedback we can call showDay here too.
    showDay(currentDayIndex);
}

export function deleteCurrentDay() {
    if (!activeTripData[currentDayIndex]) return;
    if (!confirm("Delete entire day?")) return;
    activeTripData.splice(currentDayIndex, 1);
    currentDayIndex = Math.max(0, currentDayIndex - 1);
    saveToCloud();
}

// --- Rendering ---

export function showDay(idx) {
    if(idx < 0) idx = 0;
    if(idx >= activeTripData.length && activeTripData.length > 0) idx = activeTripData.length - 1;
    
    currentDayIndex = idx;
    
    // Highlight Pill
    document.querySelectorAll('.date-pill').forEach((p, i) => {
        if(i === idx) p.classList.add('date-pill-active');
        else p.classList.remove('date-pill-active');
    });

    const day = activeTripData[idx];
    const container = document.getElementById('day-content-container');
    
    if (!day) {
        container.innerHTML = `<div class="text-center text-gray-400 mt-10">No days planned.</div>`;
        document.getElementById('current-city-name').innerText = "Journey";
        return;
    }

    document.getElementById('current-city-name').innerText = currentLang === 'en' ? day.city : day.cityZh;
    updateTheme(day.city);

    // Scroll pill into view
    const pill = document.getElementById(`date-pill-${idx}`);
    if(pill) pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    container.innerHTML = day.events.map((e, i) => `
        <div class="bg-white p-5 rounded-3xl border border-gray-300 shadow-sm flex space-x-4 items-start relative group">
            <button onclick="deleteEvent(event, ${idx}, ${i})" class="absolute top-2 right-2 text-red-300 hover:text-red-500 p-2">✕</button>
            <div class="w-12 h-12 rounded-2xl ${colors[e.type] || 'bg-gray-50'} flex items-center justify-center text-xl shrink-0">${icons[e.type] || '📍'}</div>
            <div>
                <div class="flex justify-between mb-1"><span class="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-50">${e.type}</span><span class="text-xs font-bold text-primary">${e.time}</span></div>
                <h3 class="font-bold text-lg leading-tight">${currentLang === 'en' ? e.title : (e.titleZh || e.title)}</h3>
                <p class="text-xs text-secondary mt-1">${e.details}</p>
            </div>
        </div>
    `).join('');
}

export function renderDateSelector() {
    const container = document.getElementById('date-scroll-container');
    if (!activeTripData.length) { container.innerHTML = ""; return; }
    
    container.innerHTML = activeTripData.map((d, i) => `
        <button onclick="showDay(${i})" id="date-pill-${i}" class="date-pill shrink-0 px-4 py-2 rounded-2xl border border-gray-300 bg-white text-center transition-all">
            <div class="text-[10px] font-bold uppercase text-secondary opacity-60 pointer-events-none">${d.day}</div>
            <div class="text-sm font-bold text-text pointer-events-none">${d.display}</div>
        </button>
    `).join('');
}

// Helpers needed for rendering (copied from previous data.js or just access globally if lazy)
const icons = { flight: "✈️", hotel: "🏨", dining: "🍽️", activity: "🎨", transfer: "🚙" };
const colors = { flight: "text-blue-600 bg-blue-50", hotel: "text-purple-600 bg-purple-50", dining: "text-orange-600 bg-orange-50", activity: "text-emerald-600 bg-emerald-50", transfer: "text-slate-600 bg-slate-50" };

// Toggles & Tabs
export function toggleLang() {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    showDay(currentDayIndex);
}

export function switchTab(tab) {
    currentTab = tab;
    ['timeline', 'category', 'memos'].forEach(t => {
        document.getElementById(`view-${t}`).classList.toggle('hidden', t !== tab);
        document.getElementById(`nav-${t}`).classList.toggle('active-nav', t === tab);
    });
    if(tab === 'timeline') showDay(currentDayIndex);
}

export function openAddModal() { document.getElementById('add-modal').classList.remove('hidden'); }
export function closeAddModal() { document.getElementById('add-modal').classList.add('hidden'); }