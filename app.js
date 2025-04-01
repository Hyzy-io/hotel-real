// Simulated user data
let userData = {
    isLoggedIn: false,
    name: '',
    email: '',
    points: 0,
    history: [],
    level: 'Bronze',
    notifications: []  // Add notifications array to store user notifications
};

// Connection to WebSim multiplayer system
const room = new WebsimSocket();

// Valid codes for testing
const validCodes = {
    'RESERVE123': 100,
    'CABO2023': 200,
    'REAL5000': 500
};

// Example notifications data
const exampleNotifications = [
    {
        id: 1,
        title: "Boas-vindas",
        message: "Bem-vindo ao programa de fidelidade do Hotel Real Cabo Frio!",
        date: "2023-06-15",
        read: false
    },
    {
        id: 2,
        title: "Oferta Especial",
        message: "Ganhe o dobro de pontos em sua próxima hospedagem!",
        date: "2023-06-20",
        read: false
    },
    {
        id: 3,
        title: "Novo Parceiro",
        message: "Restaurante Praia Azul é nosso novo parceiro. Troque seus pontos por refeições!",
        date: "2023-06-25",
        read: false
    }
];

// DOM Elements
const sections = {
    login: document.getElementById('login-section'),
    register: document.getElementById('register-section'),
    dashboard: document.getElementById('dashboard-section'),
    manualPoints: document.getElementById('manual-points-section'),
    partners: document.getElementById('partners-section'),
    reservations: document.getElementById('reservations-section')
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
    setupWebsimConnection();
});

function setupWebsimConnection() {
    // Handle incoming messages
    room.onmessage = (event) => {
        const data = event.data;
        if (data.type === "connected") {
            console.log(`Client ${data.clientId}, ${data.username} connected`);
            // Auto login if connected to websim
            if (data.username && !userData.isLoggedIn) {
                userData = {
                    isLoggedIn: true,
                    name: data.username,
                    email: `${data.username}@example.com`,
                    points: 0,
                    history: [],
                    level: 'Bronze'
                };
                
                // Check if user data exists in persisted records
                checkExistingUserData(data.username);
                
                showSection('dashboard');
                updateDashboard();
            }
        }
    };
}

async function checkExistingUserData(username) {
    // Try to get existing user data from records
    const userRecords = await room.collection('hotelRealUsers').filter({ username: username }).getList();
    
    if (userRecords.length > 0) {
        // User exists, load their data
        const userRecord = userRecords[0];
        userData = {
            isLoggedIn: true,
            name: userRecord.username,
            email: userRecord.email || `${username}@example.com`,
            points: userRecord.points || 0,
            history: userRecord.history || [],
            level: userRecord.level || 'Bronze',
            notifications: userRecord.notifications || []
        };
        
        // Add example notifications if email matches and no notifications exist
        if (userRecord.email === "euapatroa14@gmail.com" && (!userRecord.notifications || userRecord.notifications.length === 0)) {
            userData.notifications = exampleNotifications;
            await saveUserData(); // Save immediately to update the notifications
        }
        
        updateDashboard();
        updateNotificationBadge();
    } else {
        // First time user, create a record
        await saveUserData();
    }
}

async function saveUserData() {
    if (!userData.isLoggedIn) return;
    
    try {
        // Get existing user records
        const userRecords = await room.collection('hotelRealUsers').filter({ username: userData.name }).getList();
        
        if (userRecords.length > 0) {
            // Update existing user
            await room.collection('hotelRealUsers').update(userRecords[0].id, {
                username: userData.name,
                email: userData.email,
                points: userData.points,
                history: userData.history,
                level: userData.level,
                notifications: userData.notifications
            });
        } else {
            // Create new user
            await room.collection('hotelRealUsers').create({
                username: userData.name,
                email: userData.email,
                points: userData.points,
                history: userData.history,
                level: userData.level,
                notifications: userData.notifications || []
            });
        }
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

function initApp() {
    // Check for WebSim connection instead of local storage
    if (room.party && room.party.client && room.party.client.username) {
        const username = room.party.client.username;
        // Will check for user data in the checkExistingUserData function
    } else {
        showSection('login');
    }
}

function setupEventListeners() {
    // Authentication Event Listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('show-register').addEventListener('click', () => showSection('register'));
    document.getElementById('show-login').addEventListener('click', () => showSection('login'));
    
    // Menu icon event listener
    document.getElementById('menu-icon').addEventListener('click', toggleMenu);
    document.getElementById('close-menu').addEventListener('click', toggleMenu);
    document.getElementById('menu-overlay').addEventListener('click', toggleMenu);
    
    // Notification icon event listener
    document.getElementById('notification-icon').addEventListener('click', showNotifications);
    
    // Side menu item listeners
    document.getElementById('menu-home').addEventListener('click', () => {
        toggleMenu();
        if (userData.isLoggedIn) {
            showSection('dashboard');
        } else {
            showSection('login');
        }
    });
    
    document.getElementById('menu-logout').addEventListener('click', () => {
        toggleMenu();
        userData.isLoggedIn = false;
        showSection('login');
        showModal('Você foi desconectado');
    });
    
    // Reservations menu item
    document.getElementById('menu-reservations').addEventListener('click', () => {
        toggleMenu();
        if (!userData.isLoggedIn) {
            showModal('Faça login para acessar esta funcionalidade');
            return;
        }
        initReservationsCalendar();
        showSection('reservations');
    });
    
    // Partners menu item
    document.getElementById('menu-partners').addEventListener('click', () => {
        toggleMenu();
        if (!userData.isLoggedIn) {
            showModal('Faça login para acessar esta funcionalidade');
            return;
        }
        showSection('partners');
    });
    
    // Back button in partners section
    document.getElementById('partners-back').addEventListener('click', () => {
        showSection('dashboard');
    });
    
    // Back button in reservations section
    document.getElementById('reservations-back').addEventListener('click', () => {
        showSection('dashboard');
    });
    
    // Generic function for menu items that show a modal
    const menuItems = ['vouchers', 'shopping', 'statement', 'profile', 'scan', 'contact', 'help'];
    menuItems.forEach(item => {
        document.getElementById(`menu-${item}`).addEventListener('click', () => {
            toggleMenu();
            if (!userData.isLoggedIn && item !== 'help') {
                showModal('Faça login para acessar esta funcionalidade');
                return;
            }
            showModal(`Funcionalidade "${document.getElementById(`menu-${item}`).querySelector('span').textContent}" em desenvolvimento`);
        });
    });
    
    // Dashboard Event Listeners
    document.getElementById('manual-points-btn').addEventListener('click', () => showSection('manualPoints'));
    document.getElementById('scan-code-btn').addEventListener('click', handleScanCode);
    document.getElementById('back-to-dashboard').addEventListener('click', () => showSection('dashboard'));
    document.getElementById('code-form').addEventListener('submit', handleCodeSubmission);
    
    // Modal close events
    document.querySelector('.close').addEventListener('click', hideModal);
    document.getElementById('modal-ok').addEventListener('click', hideModal);
    
    // Redeem buttons
    document.querySelectorAll('.btn-redeem').forEach(button => {
        button.addEventListener('click', handleRedeemClick);
    });
    
    // Reservations calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        navigateCalendar(-1);
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        navigateCalendar(1);
    });
    
    // Room selection and reservation confirmation
    document.querySelectorAll('.room-option').forEach(room => {
        room.addEventListener('click', handleRoomSelection);
    });
    
    document.getElementById('confirm-reservation').addEventListener('click', handleReservationConfirmation);
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (!email || !password) {
        showModal('Por favor, preencha todos os campos');
        return;
    }
    
    // For demo purposes, any login is accepted
    userData = {
        isLoggedIn: true,
        name: email.split('@')[0], // Use part of email as name
        email: email,
        points: 0,
        history: [],
        level: 'Bronze',
        notifications: email === "euapatroa14@gmail.com" ? exampleNotifications : []
    };
    
    // Save to WebSim storage instead of localStorage
    saveUserData();
    
    showSection('dashboard');
    updateDashboard();
    updateNotificationBadge();
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    
    // Simple validation
    if (!name || !email || !phone || !password) {
        showModal('Por favor, preencha todos os campos');
        return;
    }
    
    // Create new user
    userData = {
        isLoggedIn: true,
        name: name,
        email: email,
        phone: phone,
        points: 100, // Welcome bonus
        history: [{
            date: new Date().toLocaleDateString(),
            description: 'Bônus de boas-vindas',
            points: 100,
            type: 'credit'
        }],
        level: 'Bronze',
        notifications: []
    };
    
    // Save to WebSim storage instead of localStorage
    saveUserData();
    
    showModal('Cadastro realizado com sucesso! Você ganhou 100 pontos de boas-vindas.');
    showSection('dashboard');
    updateDashboard();
    updateNotificationBadge();
}

function handleScanCode() {
    showModal('Funcionalidade de escaneamento em desenvolvimento');
}

function handleCodeSubmission(e) {
    e.preventDefault();
    const code = document.getElementById('reservation-code').value.trim().toUpperCase();
    
    if (!code) {
        showModal('Por favor, insira um código');
        return;
    }
    
    if (validCodes[code]) {
        addPoints(validCodes[code], `Reserva: ${code}`);
        document.getElementById('reservation-code').value = '';
        showModal(`Código validado com sucesso! Você ganhou ${validCodes[code]} pontos.`);
        showSection('dashboard');
    } else {
        showModal('Código inválido ou já utilizado');
    }
}

function handleRedeemClick(e) {
    const pointsNeeded = parseInt(e.target.dataset.points);
    const benefitName = e.target.previousElementSibling.querySelector('h4').textContent;
    
    if (userData.points >= pointsNeeded) {
        addPoints(-pointsNeeded, `Resgate: ${benefitName}`);
        showModal(`Benefício resgatado com sucesso! Você utilizou ${pointsNeeded} pontos.`);
    } else {
        showModal(`Pontos insuficientes. Você precisa de ${pointsNeeded} pontos para este benefício.`);
    }
}

function addPoints(amount, description) {
    userData.points += amount;
    userData.history.unshift({
        date: new Date().toLocaleDateString(),
        description: description,
        points: Math.abs(amount),
        type: amount >= 0 ? 'credit' : 'debit'
    });
    
    // Update user level
    if (userData.points >= 2000) {
        userData.level = 'Ouro';
    } else if (userData.points >= 1000) {
        userData.level = 'Prata';
    } else {
        userData.level = 'Bronze';
    }
    
    // Save to WebSim storage instead of localStorage
    saveUserData();
    
    // Update UI
    updateDashboard();
}

function updateDashboard() {
    if (!userData.isLoggedIn) return;
    
    document.getElementById('user-name').textContent = userData.name;
    document.getElementById('user-level').textContent = `Nível: ${userData.level}`;
    document.getElementById('points-count').textContent = userData.points;
    
    // Also update user info in side menu
    document.getElementById('menu-user-name').textContent = userData.name;
    document.getElementById('menu-user-level').textContent = `Nível: ${userData.level}`;
    
    // Update history
    const historyContainer = document.getElementById('points-history');
    historyContainer.innerHTML = '';
    
    if (userData.history.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">Nenhuma atividade recente</p>';
    } else {
        userData.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div>
                    <div>${item.description}</div>
                    <div class="date">${item.date}</div>
                </div>
                <div class="points ${item.type === 'credit' ? 'points-positive' : 'points-negative'}">
                    ${item.type === 'credit' ? '+' : '-'}${item.points}
                </div>
            `;
            historyContainer.appendChild(historyItem);
        });
    }
    
    // Update redeem buttons status
    document.querySelectorAll('.btn-redeem').forEach(button => {
        const pointsNeeded = parseInt(button.dataset.points);
        button.disabled = userData.points < pointsNeeded;
        button.style.opacity = userData.points < pointsNeeded ? '0.5' : '1';
    });
    
    // Also update notification badge
    updateNotificationBadge();
}

function showSection(sectionId) {
    Object.keys(sections).forEach(key => {
        sections[key].classList.remove('active-section');
    });
    sections[sectionId].classList.add('active-section');
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('menu-overlay').classList.toggle('active');
    
    // Update user info in menu
    if (userData.isLoggedIn) {
        document.getElementById('menu-user-name').textContent = userData.name;
        document.getElementById('menu-user-level').textContent = `Nível: ${userData.level}`;
    }
}

function showModal(message) {
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal').style.display = 'flex';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (!userData.isLoggedIn || !userData.notifications || userData.notifications.length === 0) {
        badge.style.display = 'none';
    } else {
        const unreadCount = userData.notifications.filter(notif => !notif.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function showNotifications() {
    if (!userData.isLoggedIn) {
        showModal('Faça login para ver suas notificações');
        return;
    }
    
    if (!userData.notifications || userData.notifications.length === 0) {
        showModal('Você não possui notificações');
        return;
    }
    
    // Create HTML for notifications
    let notificationHTML = '<div class="notifications-list">';
    
    userData.notifications.forEach(notification => {
        notificationHTML += `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-header">
                    <h4>${notification.title}</h4>
                    <span class="notification-date">${notification.date}</span>
                </div>
                <p>${notification.message}</p>
            </div>
        `;
    });
    
    notificationHTML += '</div>';
    
    // Show notifications in modal
    document.getElementById('modal-message').innerHTML = notificationHTML;
    document.getElementById('modal').style.display = 'flex';
    
    // Mark all as read when viewed
    userData.notifications.forEach(notification => {
        notification.read = true;
    });
    
    // Update notification badge
    updateNotificationBadge();
    
    // Save updated notifications status
    saveUserData();
    
    // Add click listeners to notification items
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            // Add specific handling for notification clicks if needed
            hideModal();
        });
    });
}

// Calendar and Reservation functions
let currentDate = new Date();
let selectedStartDate = null;
let selectedEndDate = null;
let selectedRoom = null;

function initReservationsCalendar() {
    renderCalendar();
    resetReservationUI();
}

function resetReservationUI() {
    selectedStartDate = null;
    selectedEndDate = null;
    selectedRoom = null;
    
    document.querySelectorAll('.room-option').forEach(room => {
        room.classList.remove('selected');
    });
    
    document.getElementById('date-display').textContent = 'Selecione as datas da sua estadia';
    document.getElementById('nights-count').textContent = '0';
    document.getElementById('daily-rate').textContent = 'R$ 0,00';
    document.getElementById('total-price').textContent = 'R$ 0,00';
    document.getElementById('points-earned').textContent = '0';
    document.getElementById('confirm-reservation').disabled = true;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    document.getElementById('month-display').textContent = `${firstDay.toLocaleString('pt-BR', { month: 'long' })} ${year}`;
    
    const calendarContainer = document.getElementById('calendar-grid');
    calendarContainer.innerHTML = '';
    
    // Day names
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayNames.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-name';
        dayElement.textContent = day;
        calendarContainer.appendChild(dayElement);
    });
    
    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarContainer.appendChild(emptyDay);
    }
    
    // Simulated reserved dates (example)
    const reservedDates = [5, 6, 15, 16, 25];
    
    // Fill days
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDayDate = new Date(year, month, day);
        
        // Check if day is in the past
        if (currentDayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
            dayElement.classList.add('reserved');
        } 
        // Check if day is reserved
        else if (reservedDates.includes(day)) {
            dayElement.classList.add('reserved');
        } 
        // Check if it's today
        else if (isCurrentMonth && today.getDate() === day) {
            dayElement.classList.add('today');
        }
        
        // Check if day is selected
        if (selectedStartDate && selectedEndDate) {
            const dayDate = new Date(year, month, day).setHours(0,0,0,0);
            const start = selectedStartDate.setHours(0,0,0,0);
            const end = selectedEndDate.setHours(0,0,0,0);
            
            if (dayDate >= start && dayDate <= end) {
                dayElement.classList.add('selected');
            }
        }
        
        // Only add click event if day is not reserved
        if (!dayElement.classList.contains('reserved')) {
            dayElement.addEventListener('click', () => selectDate(new Date(year, month, day)));
        }
        
        calendarContainer.appendChild(dayElement);
    }
}

function navigateCalendar(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function selectDate(date) {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        // Start new selection
        selectedStartDate = date;
        selectedEndDate = null;
        document.getElementById('date-display').textContent = `Check-in: ${formatDate(date)}`;
    } else {
        // Complete selection
        if (date < selectedStartDate) {
            selectedEndDate = selectedStartDate;
            selectedStartDate = date;
        } else {
            selectedEndDate = date;
        }
        
        const nights = calculateNights(selectedStartDate, selectedEndDate);
        document.getElementById('date-display').textContent = `${formatDate(selectedStartDate)} até ${formatDate(selectedEndDate)} (${nights} noites)`;
        document.getElementById('nights-count').textContent = nights;
        
        // Enable room selection
        updateRoomPrices(nights);
    }
    
    renderCalendar();
}

function formatDate(date) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calculateNights(startDate, endDate) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((startDate - endDate) / oneDay));
    return diffDays;
}

function updateRoomPrices(nights) {
    if (!nights) return;
    
    // Reset room selection
    selectedRoom = null;
    document.querySelectorAll('.room-option').forEach(room => {
        room.classList.remove('selected');
        
        const pricePerNight = parseInt(room.dataset.price);
        const totalPrice = pricePerNight * nights;
        
        room.querySelector('.room-price').textContent = `R$ ${pricePerNight.toLocaleString('pt-BR')} / noite`;
        room.querySelector('.room-total').textContent = `Total: R$ ${totalPrice.toLocaleString('pt-BR')}`;
    });
    
    document.getElementById('confirm-reservation').disabled = true;
}

function handleRoomSelection(e) {
    if (!selectedStartDate || !selectedEndDate) {
        showModal('Por favor, selecione as datas de check-in e check-out primeiro.');
        return;
    }
    
    // Clear previous selection
    document.querySelectorAll('.room-option').forEach(room => {
        room.classList.remove('selected');
    });
    
    // Set new selection
    const roomElement = e.currentTarget;
    roomElement.classList.add('selected');
    
    selectedRoom = {
        id: roomElement.dataset.id,
        name: roomElement.querySelector('.room-name').textContent,
        price: parseInt(roomElement.dataset.price)
    };
    
    // Update reservation details
    const nights = calculateNights(selectedStartDate, selectedEndDate);
    const totalPrice = selectedRoom.price * nights;
    const pointsEarned = Math.floor(totalPrice / 10); // 1 point for each R$10
    
    document.getElementById('daily-rate').textContent = `R$ ${selectedRoom.price.toLocaleString('pt-BR')}`;
    document.getElementById('total-price').textContent = `R$ ${totalPrice.toLocaleString('pt-BR')}`;
    document.getElementById('points-earned').textContent = pointsEarned;
    
    // Enable confirmation button
    document.getElementById('confirm-reservation').disabled = false;
}

function handleReservationConfirmation() {
    if (!selectedStartDate || !selectedEndDate || !selectedRoom) {
        showModal('Por favor, complete sua seleção para confirmar a reserva.');
        return;
    }
    
    const nights = calculateNights(selectedStartDate, selectedEndDate);
    const totalPrice = selectedRoom.price * nights;
    const pointsEarned = Math.floor(totalPrice / 10);
    
    // In a real app, we would send this to the server
    // For this demo, we'll just add points and show confirmation
    addPoints(pointsEarned, `Reserva: ${selectedRoom.name}`);
    
    showModal(`Sua reserva foi confirmada com sucesso! Você ganhou ${pointsEarned} pontos. Um e-mail de confirmação foi enviado para ${userData.email}.`);
    
    // Reset UI and go back to dashboard
    resetReservationUI();
    showSection('dashboard');
}