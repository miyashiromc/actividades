import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase Configuration from datos.txt
const firebaseConfig = {
    apiKey: "AIzaSyArNK2FpOQGR3Mu-KwK27TN196a5JXDR_4",
    authDomain: "proyecto-iot-agua.firebaseapp.com",
    databaseURL: "https://proyecto-iot-agua-default-rtdb.firebaseio.com",
    projectId: "proyecto-iot-agua",
    storageBucket: "proyecto-iot-agua.firebasestorage.app",
    messagingSenderId: "208535688741",
    appId: "1:208535688741:web:7d3b71c410c69af4a9d1cc",
    measurementId: "G-NP2HYVNJDP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Events Data
const events = [
    { name: "Reunión Director", date: new Date("2025-11-27T12:00:00") },
    { name: "Clase Robótica", date: new Date("2025-11-27T15:00:00") },
    { name: "Entrega Firmas Tesis", date: new Date("2025-11-28T17:00:00") },
    { name: "Stand Fuxion", date: new Date("2025-11-30T09:00:00") },
    { name: "Sustentación Tesis", date: new Date("2025-12-01T08:00:00") }
];

function updateCountdown() {
    const now = new Date();
    let nextEvent = events.find(event => event.date > now);

    if (!nextEvent) {
        document.getElementById('next-event-name').innerText = "¡Misión Cumplida!";
        document.getElementById('countdown-display').innerText = "00:00:00";
        return;
    }

    document.getElementById('next-event-name').innerText = `Próximo: ${nextEvent.name}`;

    const diff = nextEvent.date - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const formattedTime =
        (days > 0 ? `${days}d ` : '') +
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById('countdown-display').innerText = formattedTime;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Progress Bar & Persistence Logic
const cards = [
    { id: 'thesis-card', prefix: 'tesis', progressId: 'progress-tesis' },
    { id: 'robotics-card', prefix: 'robo', progressId: 'progress-robo' },
    { id: 'fuxion-card', prefix: 'fux', progressId: 'progress-fux' }
];

function updateProgress(cardConfig) {
    const checkboxes = document.querySelectorAll(`input[id^="${cardConfig.prefix}"]`);
    const total = checkboxes.length;
    let checked = 0;

    checkboxes.forEach(box => {
        if (box.checked) checked++;
    });

    const percentage = total === 0 ? 0 : (checked / total) * 100;
    const progressBar = document.getElementById(cardConfig.progressId);
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;

        if (percentage === 100) {
            progressBar.style.filter = "brightness(1.2) drop-shadow(0 0 5px white)";
        } else {
            progressBar.style.filter = "none";
        }
    }
}

// Firebase Persistence
function saveStateToFirebase() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const state = {};
    checkboxes.forEach(box => {
        state[box.id] = box.checked;
    });

    set(ref(db, 'missionControlState'), state)
        .catch((error) => console.error("Error saving to Firebase:", error));
}

function loadStateFromFirebase() {
    const stateRef = ref(db, 'missionControlState');
    onValue(stateRef, (snapshot) => {
        const state = snapshot.val();
        if (state) {
            for (const [id, checked] of Object.entries(state)) {
                const box = document.getElementById(id);
                if (box) {
                    box.checked = checked;
                    // Trigger progress update for the card this box belongs to
                    cards.forEach(card => {
                        if (id.startsWith(card.prefix)) {
                            updateProgress(card);
                        }
                    });
                }
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Start listening to Firebase
    loadStateFromFirebase();

    cards.forEach(card => {
        updateProgress(card); // Initial update (visual only, data comes from FB)

        // Add listeners
        const checkboxes = document.querySelectorAll(`input[id^="${card.prefix}"]`);
        checkboxes.forEach(box => {
            box.addEventListener('change', () => {
                updateProgress(card);
                saveStateToFirebase();
            });
        });
    });
});
