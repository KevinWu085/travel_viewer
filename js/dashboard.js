// js/dashboard.js
import { db } from './firebase-config.js';

let cachedTrips = [];
let currentSort = 'closest';
let currentSearch = '';

// --- Render Logic ---
export function renderDashboardList() {
    const container = document.getElementById('trips-list-container');
    if(!container) return;

    // 1. Filter
    let filteredTrips = cachedTrips.filter(trip => {
        const title = (trip.tripTitle || "").toLowerCase();
        return title.includes(currentSearch);
    });

    if (filteredTrips.length === 0) {
        if (cachedTrips.length === 0) {
             container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300">
                    <p class="text-gray-400 mb-4 text-sm font-bold uppercase tracking-wider">No cloud trips found</p>
                    <button onclick="importDefaultTrip()" class="bg-gray-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wide shadow-lg hover:scale-105 transition-all">
                        Import Default Trip (London 2026)
                    </button>
                </div>`;
        } else {
             container.innerHTML = `<div class="text-center py-10 text-gray-400 text-sm">No trips match "${currentSearch}"</div>`;
        }
        return;
    }

    // 2. Sort
    filteredTrips.sort((a, b) => {
        if (currentSort === 'alpha') {
            return (a.tripTitle || "").toLowerCase().localeCompare((b.tripTitle || "").toLowerCase());
        } 
        else if (currentSort === 'newest') {
            return (b.createdAt || 0) - (a.createdAt || 0);
        } 
        else if (currentSort === 'closest') {
            const getDist = (t) => {
                if (!t.days || t.days.length === 0) return Infinity; 
                const startDate = new Date(t.days[0].date);
                return Math.abs(startDate - new Date());
            };
            return getDist(a) - getDist(b);
        }
        return 0;
    });

    // 3. Render HTML
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

// --- Actions ---

export async function loadDashboard() {
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('trip-view').classList.add('hidden');
    document.title = "My Trips";

    const { collection, getDocs } = window.firebaseImports;
    const container = document.getElementById('trips-list-container');

    try {
        const querySnapshot = await getDocs(collection(db, "trips"));
        cachedTrips = [];
        querySnapshot.forEach((doc) => {
            cachedTrips.push({ id: doc.id, ...doc.data() });
        });
        renderDashboardList();
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-red-500 text-center">Error loading trips: ${e.message}</div>`;
    }
}

export function handleSearch(val) {
    currentSearch = val.toLowerCase();
    renderDashboardList();
}

export function changeSort(sortType) {
    currentSort = sortType;
    renderDashboardList();
}

export async function createNewTrip() {
    const title = prompt("Enter a name for your new trip:");
    if (!title) return;
    const { collection, addDoc } = window.firebaseImports;
    try {
        await addDoc(collection(db, "trips"), { tripTitle: title, days: [], createdAt: Date.now() });
        loadDashboard(); 
    } catch (e) { alert("Error: " + e.message); }
}

export async function deleteTrip(event, tripId) {
    event.stopPropagation();
    if(!confirm("Delete this trip?")) return;
    const { doc, deleteDoc } = window.firebaseImports;
    try {
        await deleteDoc(doc(db, "trips", tripId));
        loadDashboard();
    } catch(e) { console.error(e); }
}

export async function importDefaultTrip() {
    if (typeof tripData === 'undefined') return alert("Data error");
    const { collection, addDoc } = window.firebaseImports;
    try {
        await addDoc(collection(db, "trips"), { tripTitle: "2026 Jan London/Spain/Lisbon", days: tripData, createdAt: Date.now() });
        loadDashboard(); 
    } catch(e) { alert("Error: " + e.message); }
}