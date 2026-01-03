This project is inspired by Elcoolness for making easy to read and understand travel plan, skeleton of the project(jump start) is using her own github page
 * this project is a vibe coding project coded with google gemini ai

the structure of the project looks like this

## 📂 Project Structure

```text
travel-app/
├── index.html              # Main entry point (loads js/app.js as module)
├── css/
│   └── style.css           # Styling and animations
└── js/
    ├── app.js              # The "Brain": Imports everything and connects to HTML
    ├── firebase-config.js  # Database connection logic
    ├── dashboard.js        # Logic for "My Trips" list, sorting, and searching
    ├── trip.js             # Logic for the specific Trip Details view (timeline)
    ├── utils.js            # Helper functions (Time validation, Theme colors, Dragging)
    └── data.js             # Static configuration (Translations, Icons, Default Data)
