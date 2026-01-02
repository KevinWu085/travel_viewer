/* * DATA FILE
 * Contains all static content: translations, itinerary events, and theme colors.
 * Edit this file to update the schedule or text.
 */

const translations = {
    en: {
        tourLabel: "2026 Jan London/Spain/Lisbon",
        journey: "The Journey",
        category: "Category",
        memos: "Memos",
        location: "Location",
        categoryView: "Category View",
        categoryDesc: "Browse specific types of reservations and activities across the full trip.",
        filterBy: "Filter By",
        memosDesc: "Shared space for notes and group reminders.",
        gdocTitle: "Shared Google Doc",
        gdocSub: "Real-time collaborative notes",
        open: "Open",
        reminders: "📌 Reminders",
        remindersContent: `
            <ul class="space-y-3">
                <li class="flex items-start space-x-3">
                    <span class="text-xs">👞</span>
                    <p class="text-[11px] text-secondary leading-normal"><strong>Dress Code:</strong> Fumo London and Prado are smart-casual.</p>
                </li>
                <li class="flex items-start space-x-3">
                    <span class="text-xs">🔋</span>
                    <p class="text-[11px] text-secondary leading-normal"><strong>Power:</strong> UK vs EU adapters required.</p>
                </li>
            </ul>
        `,
        catFlights: "✈️ Flights",
        catHotels: "🏨 Hotels",
        catMeals: "🍽️ Meals",
        catTours: "🎨 Tours",
        langToggle: "繁",
        map: "Map"
    },
    zh: {
        tourLabel: "2026 一月 倫敦/西班牙/里斯本",
        journey: "行程內容",
        category: "類別瀏覽",
        memos: "備忘錄",
        location: "當前地點",
        categoryView: "分類檢視",
        categoryDesc: "瀏覽整個行程中特定類別的預訂和活動。",
        filterBy: "過濾條件",
        memosDesc: "分享筆記、開支及團隊提醒的空間。",
        gdocTitle: "共享 Google 文檔",
        gdocSub: "即時協作筆記",
        open: "開啟",
        reminders: "📌 重要提醒",
        remindersContent: `
            <ul class="space-y-3">
                <li class="flex items-start space-x-3">
                    <span class="text-xs">👞</span>
                    <p class="text-[11px] text-secondary leading-normal"><strong>服裝要求：</strong> Fumo London 和 Prado 為商務休閒裝。</p>
                </li>
                <li class="flex items-start space-x-3">
                    <span class="text-xs">🔋</span>
                    <p class="text-[11px] text-secondary leading-normal"><strong>電源：</strong> 倫敦需英國轉接頭，西班牙/葡萄牙需歐標轉接頭。</p>
                </li>
            </ul>
        `,
        catFlights: "✈️ 航班",
        catHotels: "🏨 酒店",
        catMeals: "🍽️ 餐飲",
        catTours: "🎨 導覽",
        langToggle: "EN",
        map: "地圖"
    }
};

const tripData = [
    { 
        date: "2025-12-29", display: "29 Dec", day: "Mon", dayZh: "一", city: "Transit", cityZh: "轉機", 
        events: [
            { type: "flight", title: "SFO ➔ LHR", titleZh: "舊金山 ➔ 倫敦", time: "12:50 PM", details: "United UA 901", sub: "Seats: 12A, 12B, 12D, 12E" }, 
            { type: "hotel", title: "Heathrow Marriott", titleZh: "希思羅萬怡酒店", time: "Arr", details: "Morning Refresh Stay", sub: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=London+Heathrow+Marriott+Hotel" }
        ] 
    },
    { 
        date: "2025-12-30", display: "30 Dec", day: "Tue", dayZh: "二", city: "London", cityZh: "倫敦", 
        events: [
            { type: "transfer", title: "Arrival", titleZh: "抵達", time: "07:25 AM", details: "Customs & Luggage", sub: "" }, 
            { type: "hotel", title: "W London", titleZh: "W 酒店", time: "Check-in", details: "Leicester Square", sub: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=W+London+Leicester+Square" }, 
            { type: "dining", title: "The Eight", titleZh: "The Eight 餐廳", time: "Evening", details: "Maybe (Tentative)", sub: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=The+Eight+Restaurant+London" }
        ] 
    },
    { 
        date: "2025-12-31", display: "31 Dec", day: "Wed", dayZh: "三", city: "London", cityZh: "倫敦", 
        events: [
            { type: "dining", title: "Dishoom Carnaby", titleZh: "Dishoom 印度餐", time: "12:30 PM", details: "Bombay Cafe Lunch", sub: "Confirmed", mapUrl: "https://www.google.com/maps/search/?api=1&query=Dishoom+Carnaby+London" }, 
            { type: "dining", title: "Fumo London", titleZh: "Fumo 義大利餐", time: "08:00 PM", details: "NYE Dinner", sub: "Confirmed", mapUrl: "https://www.google.com/maps/search/?api=1&query=Fumo+London" }
        ] 
    },
    { 
        date: "2026-01-01", display: "01 Jan", day: "Thu", dayZh: "四", city: "London", cityZh: "倫敦", 
        events: [
            { type: "activity", title: "Aqua Shard", titleZh: "碎片大廈下午茶", time: "03:30 PM", details: "Afternoon Tea", sub: "Level 31 Views", mapUrl: "https://www.google.com/maps/search/?api=1&query=Aqua+Shard+London" }
        ] 
    },
    { 
        date: "2026-01-02", display: "02 Jan", day: "Fri", dayZh: "五", city: "Granada", cityZh: "格拉納達", 
        events: [
            { type: "flight", title: "LHR ➔ AGP", titleZh: "倫敦 ➔ 馬拉加", time: "02:55 PM", details: "BA 424", sub: "Seats: 3A, 3C, 4A, 4C" }, 
            { type: "transfer", title: "Private Van", titleZh: "私人接送", time: "06:55 PM", details: "To Seda Club", sub: "" }, 
            { type: "hotel", title: "Seda Club Hotel", titleZh: "Seda Club 酒店", time: "Check-in", details: "Granada", sub: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=Seda+Club+Hotel+Granada" }
        ] 
    },
    { 
        date: "2026-01-03", display: "03 Jan", day: "Sat", dayZh: "六", city: "Granada", cityZh: "格拉納達", 
        events: [
            { type: "activity", title: "Sultan's Secrets", titleZh: "蘇丹的秘密", time: "10:00 AM", details: "Alhambra Tour", sub: "Private Guide", mapUrl: "https://www.google.com/maps/search/?api=1&query=Alhambra+Granada" }, 
            { type: "dining", title: "Flavors of Granada", titleZh: "格拉納達風味", time: "07:30 PM", details: "Dinner Experience", sub: "Confirmed", mapUrl: "https://www.google.com/maps/search/?api=1&query=Granada+City+Center" }
        ] 
    },
    { 
        date: "2026-01-04", display: "04 Jan", day: "Sun", dayZh: "日", city: "Sevilla", cityZh: "塞維利亞", 
        events: [
            { type: "transfer", title: "To Sevilla", titleZh: "前往塞維利亞", time: "12:00 PM", details: "via Antequera", sub: "" }, 
            { type: "dining", title: "Arte de Cozina", titleZh: "Arte de Cozina 午餐", time: "01:30 PM", details: "Antequera Stop", sub: "Historic Stop", mapUrl: "https://www.google.com/maps/search/?api=1&query=Arte+de+Cozina+Antequera" }, 
            { type: "hotel", title: "Mercer Sevilla", titleZh: "美居塞維利亞", time: "Check-in", details: "2 Junior Suites", sub: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=Mercer+Sevilla" }
        ] 
    },
    { 
        date: "2026-01-05", display: "05 Jan", day: "Mon", dayZh: "一", city: "Sevilla", cityZh: "塞維利亞", 
        events: [
            { type: "activity", title: "Timeless Sevilla", titleZh: "永恆塞維利亞", time: "10:00 AM", details: "Cathedral & Alcázar", sub: "Private", mapUrl: "https://www.google.com/maps/search/?api=1&query=Royal+Alcázar+of+Seville" }, 
            { type: "dining", title: "Tradevo Centro", titleZh: "Tradevo 晚餐", time: "08:30 PM", details: "Dinner Reservation", sub: "Confirmed", mapUrl: "https://www.google.com/maps/search/?api=1&query=Tradevo+Centro+Sevilla" }
        ] 
    },
    { 
        date: "2026-01-06", display: "06 Jan", day: "Tue", dayZh: "二", city: "Sevilla", cityZh: "塞維利亞", 
        events: [
            { type: "activity", title: "Gastrorfebrería", titleZh: "美食與工藝體驗", time: "10:00 AM", details: "Metal Craft & Oil", sub: "Includes Lunch", mapUrl: "https://www.google.com/maps/search/?api=1&query=Seville+City+Center" }, 
            { type: "dining", title: "El Pintón", titleZh: "El Pintón 晚餐", time: "07:00 PM", details: "Modern Courtyard", sub: "Confirmed", mapUrl: "https://www.google.com/maps/search/?api=1&query=El+Pinton+Sevilla" }
        ] 
    },
    { 
        date: "2026-01-07", display: "07 Jan", day: "Wed", dayZh: "三", city: "Lisbon", cityZh: "里斯本", 
        events: [
            { type: "dining", title: "Farewell Lunch", titleZh: "告別午餐", time: "Lunch", details: "Seville Placeholder", sub: "" }, 
            { type: "flight", title: "SVQ ➔ LIS", titleZh: "塞維利亞 ➔ 里斯本", time: "04:00 PM", details: "TAP TP 1105", sub: "Seats: 2A, 2C, 2D, 2F" }, 
            { type: "hotel", title: "The Verse", titleZh: "The Verse 酒店", time: "Check-in", details: "Lisbon", sub: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=The+Verse+Lisbon" }, 
            { type: "dining", title: "Time Out Market", titleZh: "Time Out 市集", time: "08:00 PM", details: "Casual Dinner", sub: "Confirmed", mapUrl: "https://www.google.com/maps/search/?api=1&query=Time+Out+Market+Lisbon" }
        ] 
    },
    { 
        date: "2026-01-08", display: "08 Jan", day: "Thu", dayZh: "四", city: "Lisbon", cityZh: "里斯本", 
        events: [
            { type: "activity", title: "Panoramic Tour", titleZh: "里斯本全景導覽", time: "01:00 PM", details: "Belém & Tiles", sub: "Includes Workshop", mapUrl: "https://www.google.com/maps/search/?api=1&query=Belém+Tower+Lisbon" }, 
            { type: "dining", title: "Cervejaria Ramiro", titleZh: "Ramiro 海鮮餐", time: "08:30 PM", details: "Seafood Dinner", sub: "Confirmed", mapUrl: "https://www.google.com/maps/search/?api=1&query=Cervejaria+Ramiro+Lisbon" }
        ] 
    },
    { 
        date: "2026-01-09", display: "09 Jan", day: "Fri", dayZh: "五", city: "Lisbon", cityZh: "里斯本", 
        events: [
            { type: "activity", title: "Cooking Class", titleZh: "私人烹飪課程", time: "10:30 AM", details: "Market & Chef", sub: "Market Tour", mapUrl: "https://www.google.com/maps/search/?api=1&query=Mercado+da+Ribeira+Lisbon" }, 
            { type: "dining", title: "PRADO", titleZh: "PRADO 晚餐", time: "07:00 PM", details: "Dinner Reservation", sub: "Confirmed", mapUrl: "https://www.google.com/maps/search/?api=1&query=PRADO+Restaurante+Lisbon" }
        ] 
    },
    { 
        date: "2026-01-10", display: "10 Jan", day: "Sat", dayZh: "六", city: "Departure", cityZh: "回程", 
        events: [
            { type: "flight", title: "LIS ➔ SFO", titleZh: "里斯本 ➔ 舊金山", time: "10:15 AM", details: "United UA 65", sub: "Polaris Business" }
        ] 
    }
];

const themes = {
    "London": "#7EA2D6",    // Brighter Sky Navy
    "Granada": "#BC5D37",   // Terracotta
    "Sevilla": "#D49B00",   // Gold
    "Lisbon": "#007B7F",    // Teal
    "Transit": "#4A5568",   // Slate
    "Departure": "#2D3748"  // Charcoal
};

const icons = { 
    flight: "✈️", 
    hotel: "🏨", 
    dining: "🍽️", 
    activity: "🎨", 
    transfer: "🚙" 
};

const colors = { 
    flight: "text-blue-600 bg-blue-50", 
    hotel: "text-purple-600 bg-purple-50", 
    dining: "text-orange-600 bg-orange-50", 
    activity: "text-emerald-600 bg-emerald-50", 
    transfer: "text-slate-600 bg-slate-50" 
};