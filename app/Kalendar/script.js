
// JavaScript для календаря Alex: логіка відображення місяців, нотаток та модальних вікон
let currentDate = new Date();
let notes = JSON.parse(localStorage.getItem('calendarNotes') || '[]');
let selectedCategory = 'all';
let isDeleteMode = false;
let selectedNoteId = null;

// Функції для роботи з календарем
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    document.getElementById('monthDisplay').textContent = `${monthName} ${year}`;

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Додати дні тижня
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Додати порожні клітинки для початку місяця
    for (let i = 0; i < shift; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        calendarGrid.appendChild(emptyCell);
    }

    // Додати дні місяця
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.innerHTML = `<span class = "day-number">${day}</span>`;

        // Позначити сьогоднішній день
        const today = new Date();
        if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) {
            dayCell.classList.add('today');
        }

        // Додати нотатки до дня
        const dayNotes = notes.filter(note => {
            const noteDate = new Date(note.date);
            const matchesDate = noteDate.getFullYear() === year && noteDate.getMonth() === month && noteDate.getDate() === day;
            const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
            return matchesDate && matchesCategory;
        });

        dayNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = `note ${note.category.toLowerCase()}`;
            noteElement.textContent = note.text;
            noteElement.onclick = () => selectNote(note.id);
            dayCell.appendChild(noteElement);
        });

        calendarGrid.appendChild(dayCell);
    }
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function openModal(type) {
    selectedNoteId = null;
    document.getElementById('modal').style.display = 'block';
    document.getElementById('modalTitle').textContent = type === 'Holiday' ? 'Add Holiday' : 'Add Note';
    document.getElementById('noteCategory').value = type === 'Holiday' ? 'Holiday' : 'Meeting';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('noteText').value = '';
    document.getElementById('noteDate').value = '';
    document.getElementById('noteTime').value = '';
    selectedNoteId = null;
}

function saveNote() {
    const text = document.getElementById('noteText').value;
    const date = document.getElementById('noteDate').value;
    const time = document.getElementById('noteTime').value;
    const category = document.getElementById('noteCategory').value;

    if (!text || !date) return;

    const note = {
        id: selectedNoteId || Date.now(),
        text,
        date,
        time,
        category
    };

    if (selectedNoteId) {
        const index = notes.findIndex(n => n.id === selectedNoteId);
        notes[index] = note;
    } else {
        notes.push(note);
    }

    localStorage.setItem('calendarNotes', JSON.stringify(notes));
    renderCalendar();
    closeModal();
}

function selectNote(id) {
    if (isDeleteMode) {
        notes = notes.filter(note => note.id !== id);
        localStorage.setItem('calendarNotes', JSON.stringify(notes));
        renderCalendar();
        return;
    }

    selectedNoteId = id;
    const note = notes.find(n => n.id === id);
    if (note) {
        document.getElementById('noteText').value = note.text;
        document.getElementById('noteDate').value = note.date;
        document.getElementById('noteTime').value = note.time;
        document.getElementById('noteCategory').value = note.category;
        document.getElementById('modalTitle').textContent = 'Edit Note';
        document.getElementById('modal').style.display = 'block';
    }
}

function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode;
    document.querySelector('.btn-text.pink-t').classList.toggle('active', isDeleteMode);
}

function filterCategory(category) {
    selectedCategory = category;
    // Оновити активну кнопку
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderCalendar();
}

function editProfile() {
    // Функція для редагування профілю
    alert('Edit profile functionality not implemented yet.');
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', function() {
    renderCalendar();
    // Встановити активну кнопку для 'all'
    document.querySelector('.cat-btn').classList.add('active');
});