// js/utils.js

export const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const daysZh = ["日", "一", "二", "三", "四", "五", "六"];
export const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// --- Date Helper ---
export function getDayData(dateStr) {
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

// --- Theme Helper ---
export function updateTheme(city) {
    const color = themes[city] || themes["Transit"];
    document.documentElement.style.setProperty('--primary-color', color);
}

// --- Validation ---
export function validateTimeField(inputElement) {
    const value = inputElement.value.trim();
    const errorMsg = document.getElementById('time-error-msg');
    if (!value) return true;
    const hasNumber = /\d/.test(value);
    
    // Simple check for AM/PM format
    const strictTimeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(am|pm|AM|PM)$/i;
    
    if (!hasNumber || strictTimeRegex.test(value)) {
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

    slider.style.cursor = 'grab';
    slider.style.userSelect = 'none'; 

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false; 
        slider.style.cursor = 'grabbing';
        e.preventDefault(); 
        slider.style.scrollBehavior = 'auto';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'grab'; slider.style.scrollBehavior = 'smooth'; });
    slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'grab'; slider.style.scrollBehavior = 'smooth'; });

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