// js/utils.js

export const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const daysZh = ["日", "一", "二", "三", "四", "五", "六"];
export const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// --- Date Helper ---
export function getDayData(dateStr) {
    // dateStr is "YYYY-MM-DD"
    const parts = dateStr.split('-');
    // Create date as Noon UTC to avoid timezone rollback issues
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

// --- Theme Helper ---
export function updateTheme(city) {
    // We check window.themes because themes are defined in data.js
    let color = "#4A5568"; // Default slate
    
    if (window.themes && window.themes[city]) {
        color = window.themes[city];
    } else if (window.themes && window.themes["Transit"]) {
        color = window.themes["Transit"];
    }

    document.documentElement.style.setProperty('--primary-color', color);
}

// --- Form Validation ---
export function validateTimeField(inputElement) {
    const value = inputElement.value.trim();
    const errorMsg = document.getElementById('time-error-msg');
    
    if (!value) return true; // Allow empty if not required, but here we usually require it
    
    const hasNumber = /\d/.test(value);
    // Simple check: must have a number and AM/PM
    const strictTimeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm|AM|PM)$/i;
    
    // If it looks like a time...
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

// --- Drag Scroll Logic ---
export function enableDragScroll() {
    const slider = document.getElementById('date-scroll-container');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false; 

    // Styles for grab cursor and NO TEXT SELECTION (Critical for drag UX)
    slider.style.cursor = 'grab';
    slider.style.userSelect = 'none'; 
    slider.style.webkitUserSelect = 'none';

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false; 
        slider.style.cursor = 'grabbing';
        
        // Prevent default to stop text selection
        e.preventDefault(); 
        
        // Disable smooth scroll temporarily so it doesn't fight the mouse
        slider.style.scrollBehavior = 'auto';

        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    const stopDrag = () => {
        isDown = false;
        slider.style.cursor = 'grab';
        slider.style.scrollBehavior = 'smooth';
    };

    slider.addEventListener('mouseleave', stopDrag);
    slider.addEventListener('mouseup', stopDrag);

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        
        e.preventDefault(); 
        const x = e.pageX - slider.offsetLeft;
        // 1:1 movement ratio for natural feel
        const walk = (x - startX); 
        
        // Only consider it a "drag" if moved more than 3px
        if (Math.abs(walk) > 3) {
            isDragging = true;
            slider.scrollLeft = scrollLeft - walk;
        }
    });

    // Capture click events and kill them if we were dragging
    slider.addEventListener('click', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            isDragging = false; 
        }
    }, true); 
}