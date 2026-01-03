// js/app.js
import { initFirebase } from './firebase-config.js';

// Dashboard Logic
import { 
    loadDashboard, 
    createNewTrip, 
    deleteTrip, 
    handleSearch, 
    changeSort, 
    importDefaultTrip 
} from './dashboard.js';

// Trip Details Logic
import { 
    openTrip, 
    handleNewEvent, 
    deleteEvent, 
    deleteCurrentDay, 
    handleTitleSave, 
    switchTab, 
    toggleLang, 
    showDay,
    openAddModal, 
    closeAddModal, 
    renderCategory 
} from './trip.js';

// Utilities
import { validateTimeField } from './utils.js';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await initFirebase();
    loadDashboard();
});

// --- Expose functions to Window so HTML onclick="" works ---

// Dashboard Actions
window.createNewTrip = createNewTrip;
window.deleteTrip = deleteTrip;
window.openTrip = openTrip; 
window.handleSearch = handleSearch;
window.changeSort = changeSort;
window.importDefaultTrip = importDefaultTrip;
window.backToDashboard = loadDashboard;

// Trip Actions
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

// Category View Logic
window.renderCategory = renderCategory;