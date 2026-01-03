// js/app.js
import { initFirebase } from './firebase-config.js';

// 👇 REMOVED openTrip from here
import { loadDashboard, createNewTrip, deleteTrip, handleSearch, changeSort, importDefaultTrip } from './dashboard.js';

// 👇 ADDED openTrip here
import { 
    openTrip, 
    handleNewEvent, deleteEvent, deleteCurrentDay, 
    handleTitleSave, switchTab, toggleLang, showDay,
    openAddModal, closeAddModal 
} from './trip.js';

import { validateTimeField } from './utils.js';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initFirebase();
    loadDashboard();
});

// Expose functions to Window so HTML onclick="" works
window.createNewTrip = createNewTrip;
window.deleteTrip = deleteTrip;
window.openTrip = openTrip; // Now correctly imported from trip.js
window.handleSearch = handleSearch;
window.changeSort = changeSort;
window.importDefaultTrip = importDefaultTrip;
window.backToDashboard = loadDashboard;

window.handleNewEvent = handleNewEvent;
window.deleteEvent = deleteEvent;
window.deleteCurrentDay = deleteCurrentDay;
window.handleTitleSave = handleTitleSave;
window.switchTab = switchTab;
window.toggleLang = toggleLang;
window.showDay = showDay;
window.openAddModal = openAddModal;
window.closeAddModal = closeAddModal;
window.validateTimeField = validateTimeField;