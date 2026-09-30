// ====== INITIAL DATA & STATE ======
const DEMO_USERS = {
    'citizen@smartwaste.com': { name: 'Demo Citizen', role: 'citizen', password: '123456', points: 450 },
    'admin@smartwaste.com': { name: 'System Admin', role: 'admin', password: 'admin123', points: 0 }
};

const INITIAL_COMPLAINTS = [
    { id: 'SW-2026-001', type: 'Overflowing Bin', location: 'Sector 12 Market', date: '2026-09-28', priority: 'High', status: 'Pending', citizen: 'Demo Citizen' },
    { id: 'SW-2026-002', type: 'Illegal Dumping', location: 'Ring Road', date: '2026-09-29', priority: 'High', status: 'Resolved', citizen: 'Aman K.' },
    { id: 'SW-2026-003', type: 'Garbage on Road', location: 'College Avenue', date: '2026-09-30', priority: 'Medium', status: 'Pending', citizen: 'Priya S.' }
];

let currentUser = JSON.parse(localStorage.getItem('sw_user')) || null;
let complaints = JSON.parse(localStorage.getItem('sw_complaints'));

if (!complaints) {
    localStorage.setItem('sw_complaints', JSON.stringify(INITIAL_COMPLAINTS));
    complaints = INITIAL_COMPLAINTS;
}

let mapInstance = null;
let chartsInstances = [];

// ====== APP INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    if (currentUser) {
        document.getElementById('landing-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        renderSidebar();
        showView(currentUser.role === 'admin' ? 'view-admin-dashboard' : 'view-citizen-dashboard');
    } else {
        showView('view-landing');
    }

    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    document.getElementById('report-form').addEventListener('submit', handleReportSubmit);
    document.getElementById('report-photo').addEventListener('change', handleImageUpload);
    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
});

// ====== NAVIGATION & VIEWS ======
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
    
    if (viewId === 'view-citizen-dashboard') loadCitizenDashboard();
    if (viewId === 'view-admin-dashboard') loadAdminDashboard();
    if (viewId === 'view-eco') loadEcoPoints();
    if (viewId === 'view-hotspots') setTimeout(initMap, 100);
}

function updateNav() {
    const navContainer = document.getElementById('nav-links-container');
    if (currentUser) {
        navContainer.innerHTML = `<button class="btn btn-secondary btn-sm" onclick="logout()"><i class="fa-solid fa-sign-out-alt"></i> Logout</button>`;
    } else {
        navContainer.innerHTML = `<button class="btn btn-outline btn-sm" onclick="showAuth('login')">Login</button>`;
    }
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (currentUser.role === 'citizen') {
        sidebar.innerHTML = `
            <ul>
                <li onclick="showView('view-citizen-dashboard')"><i class="fa-solid fa-house"></i> Dashboard</li>
                <li onclick="showView('view-report')"><i class="fa-solid fa-camera"></i> Report Issue</li>
                <li onclick="showView('view-track')"><i class="fa-solid fa-route"></i> Track</li>
                <li onclick="showView('view-eco')"><i class="fa-solid fa-leaf"></i> Eco Points</li>
            </ul>
        `;
    } else {
        sidebar.innerHTML = `
            <ul>
                <li onclick="showView('view-admin-dashboard')"><i class="fa-solid fa-chart-pie"></i> Overview</li>
                <li onclick="showView('view-hotspots')"><i class="fa-solid fa-map-location"></i> Map Hotspots</li>
            </ul>
        `;
    }
}

// ====== AUTHENTICATION ======
let isLoginMode = true;
function showAuth(mode) {
    document.getElementById('landing-container').style.display = 'block';
    document.getElementById('app-container').style.display = 'none';
    showView('view-auth');
    isLoginMode = mode === 'login';
    document.getElementById('auth-title').innerText = isLoginMode ? 'Login' : 'Register';
    document.getElementById('name-group').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('role-group').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('auth-btn').innerText = isLoginMode ? 'Login' : 'Register';
    document.getElementById('auth-switch-text').innerHTML = isLoginMode ? 
        `Don't have an account? <a href="#" onclick="showAuth('register')">Register</a>` : 
        `Already have an account? <a href="#" onclick="showAuth('login')">Login</a>`;
}

function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (isLoginMode) {
        if (DEMO_USERS[email] && DEMO_USERS[email].password === password) {
            currentUser = DEMO_USERS[email];
            currentUser.email = email;
            loginSuccess();
        } else {
            showToast('Invalid credentials. Use demo accounts.', 'error');
        }
    } else {
        const name = document.getElementById('auth-name').value;
        const role = document.getElementById('auth-role').value;
        currentUser = { name, role, email, points: 0 };
        loginSuccess();
    }
}

function loginSuccess() {
    localStorage.setItem('sw_user', JSON.stringify(currentUser));
    document.getElementById('landing-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    updateNav();
    renderSidebar();
    showView(currentUser.role === 'admin' ? 'view-admin-dashboard' : 'view-citizen-dashboard');
    showToast(`Welcome back, ${currentUser.name}!`, 'success');
}

function logout() {
    localStorage.removeItem('sw_user');
    currentUser = null;
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('landing-container').style.display = 'block';
    updateNav();
    showView('view-landing');
}

// ====== CITIZEN FUNCTIONS ======
function loadCitizenDashboard() {
    complaints = JSON.parse(localStorage.getItem('sw_complaints')) || complaints;
    document.getElementById('welcome-message').innerText = `Welcome back, ${currentUser.name}`;
    const myComplaints = complaints.filter(c => c.citizen === currentUser.name || currentUser.name === 'Demo Citizen');
    
    document.getElementById('c-stat-total').innerText = myComplaints.length;
    document.getElementById('c-stat-pending').innerText = myComplaints.filter(c => c.status === 'Pending').length;
    document.getElementById('c-stat-resolved').innerText = myComplaints.filter(c => c.status === 'Resolved').length;
    document.getElementById('c-stat-points').innerText = currentUser.points || 450;

    const tbody = document.querySelector('#citizen-complaints-table tbody');
    tbody.innerHTML = '';
    myComplaints.slice().reverse().forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td><b>${c.id}</b></td>
                <td>${c.type}</td>
                <td>${c.location}</td>
                <td>${c.date}</td>
                <td><span class="badge ${c.priority.toLowerCase()}">${c.priority}</span></td>
                <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
            </tr>
        `;
    });
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photo-preview').src = e.target.result;
            document.getElementById('photo-preview').style.display = 'block';
            simulateAIAnalysis(file); // Passed file to generate accurate hash
        }
        reader.readAsDataURL(file);
    }
}

function simulateAIAnalysis(file) {
    const aiPanel = document.getElementById('ai-analysis-panel');
    const scanningBar = document.querySelector('.scanning-bar');
    const aiResults = document.getElementById('ai-results');
    
    aiPanel.style.display = 'block';
    scanningBar.style.display = 'block';
    aiResults.style.display = 'none';

    setTimeout(() => {
        scanningBar.style.display = 'none';
        aiResults.style.display = 'block';
        
        const type = document.getElementById('report-type').value;
        let severity = 'Medium';
        if (type.includes('Dumping') || type.includes('Overflowing')) severity = 'High';

        // ACCURATE CONFIDENCE CALCULATION BASED ON IMAGE FILE
        // This ensures the same image will ALWAYS generate the exact same percentage
        let hash = 0;
        const fileDataStr = file.name + file.size + file.lastModified;
        for (let i = 0; i < fileDataStr.length; i++) {
            hash = fileDataStr.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Yields a consistent float percentage between 85.0% and 99.9%
        const confidenceStr = (85 + (Math.abs(hash) % 14) + (Math.abs(hash % 10) / 10)).toFixed(1);

        document.getElementById('ai-detected').innerText = type;
        document.getElementById('ai-confidence').innerText = confidenceStr + '%';
        
        const sevBadge = document.getElementById('ai-severity');
        sevBadge.innerText = severity;
        sevBadge.className = `badge ${severity.toLowerCase()}`;
    }, 2000);
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                document.getElementById('report-location').value = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
                showToast('Location captured via GPS', 'success');
            },
            () => showToast('Location access denied', 'error')
        );
    }
}

function handleReportSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('report-type').value;
    const location = document.getElementById('report-location').value;
    let priority = 'Medium';
    if (type.includes('Dumping') || type.includes('Overflowing')) priority = 'High';

    const newComplaint = {
        id: `SW-2026-${Math.floor(Math.random() * 900 + 100)}`,
        type, location, priority,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        citizen: currentUser.name
    };

    complaints.push(newComplaint);
    localStorage.setItem('sw_complaints', JSON.stringify(complaints));
    
    currentUser.points = (currentUser.points || 0) + 10;
    localStorage.setItem('sw_user', JSON.stringify(currentUser));

    showToast('Complaint registered successfully! +10 Eco Points', 'success');
    e.target.reset();
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('ai-analysis-panel').style.display = 'none';
    showView('view-citizen-dashboard');
}

function trackComplaint() {
    complaints = JSON.parse(localStorage.getItem('sw_complaints')) || complaints;
    const id = document.getElementById('track-id').value;
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) {
        showToast('Complaint ID not found', 'error');
        return;
    }

    document.getElementById('tracking-result').style.display = 'block';
    document.getElementById('track-title').innerText = `Status for ${complaint.id} - ${complaint.type}`;
    
    const isResolved = complaint.status === 'Resolved';
    
    document.getElementById('tracking-timeline').innerHTML = `
        <div class="timeline-item active">
            <div class="timeline-dot"><i class="fa-solid fa-file-signature"></i></div>
            <h4>Reported</h4><p>${complaint.date} by ${complaint.citizen}</p>
        </div>
        <div class="timeline-item ${isResolved ? 'active' : ''}">
            <div class="timeline-dot"><i class="fa-solid fa-truck"></i></div>
            <h4>Collector Assigned</h4><p>${isResolved ? 'Team dispatched' : 'Pending admin assignment'}</p>
        </div>
        <div class="timeline-item ${isResolved ? 'active' : ''}">
            <div class="timeline-dot"><i class="fa-solid fa-check"></i></div>
            <h4>Resolved</h4><p>${isResolved ? 'Issue fixed' : 'Waiting for resolution'}</p>
        </div>
    `;
}

// ====== DYNAMIC QUIZ LOGIC ======
const quizQuestions = [
    { q: "Kele ka chilka (Banana peel) kahan daalna chahiye?", options: ["Wet Waste (Geela Kachra)", "Dry Waste (Sookha Kachra)", "Hazardous Waste"], ans: 0 },
    { q: "Plastic ki paani ki botal kisme jayegi?", options: ["Wet Waste", "Recyclable / Dry Waste", "E-Waste"], ans: 1 },
    { q: "Purana mobile phone ya remote ki battery kahan fekna chahiye?", options: ["Wet Waste", "Dry Waste", "E-Waste / Hazardous"], ans: 2 },
    { q: "Inme se kya cheez recycle (dobara use) ho sakti hai?", options: ["Bacha hua khana", "Akhbaar (Newspaper)", "Diaper"], ans: 1 },
    { q: "Toota hua kanch (Broken glass) kis bin mein jayega?", options: ["Wet Waste", "Dry Waste (Carefully wrapped)", "Compost"], ans: 1 }
];
let currentQ = 0;

function renderQuiz() {
    const container = document.getElementById('quiz-container');
    if(currentQ >= quizQuestions.length) {
        container.innerHTML = `<div class="text-center"><h4>Aapne saare questions poore kar liye! 🎉</h4><button class="btn btn-primary mt-2" onclick="currentQ=0; renderQuiz()">Restart Quiz</button></div>`;
        return;
    }
    const qData = quizQuestions[currentQ];
    let html = `<p class="quiz-question">Q${currentQ + 1}: ${qData.q}</p><div class="quiz-options-grid">`;
    qData.options.forEach((opt, idx) => {
        html += `<button class="btn btn-outline" onclick="handleQuizAnswer(${idx})">${opt}</button>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function handleQuizAnswer(selectedIdx) {
    if(selectedIdx === quizQuestions[currentQ].ans) {
        showToast('Sahi Jawab! +5 Eco Points', 'success');
        currentUser.points = (currentUser.points || 0) + 5;
        localStorage.setItem('sw_user', JSON.stringify(currentUser));
        document.getElementById('eco-total').innerText = currentUser.points;
    } else {
        showToast('Galat Jawab! Koi baat nahi, aage badhein.', 'error');
    }
    currentQ++;
    setTimeout(renderQuiz, 800); // Wait 0.8s then load next question
}

function loadEcoPoints() {
    document.getElementById('eco-total').innerText = currentUser.points || 0;
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = `
        <li><span>1. ${currentUser.name}</span> <span>${currentUser.points || 0} pts</span></li>
        <li><span>2. Rahul M.</span> <span>420 pts</span></li>
        <li><span>3. Priya S.</span> <span>390 pts</span></li>
        <li><span>4. Aman K.</span> <span>310 pts</span></li>
    `;
    renderQuiz();
}

// ====== ADMIN FUNCTIONS ======
function loadAdminDashboard() {
    document.getElementById('a-stat-total').innerText = complaints.length;
    document.getElementById('a-stat-pending').innerText = complaints.filter(c => c.status === 'Pending').length;
    document.getElementById('a-stat-users').innerText = '124';

    const tbody = document.querySelector('#admin-complaints-table tbody');
    tbody.innerHTML = '';
    complaints.slice().reverse().forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td><b>${c.id}</b></td>
                <td>${c.type}<br><small>${c.location}</small></td>
                <td><span class="badge ${c.priority.toLowerCase()}">${c.priority}</span></td>
                <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
                <td>
                    ${c.status === 'Pending' ? `<button class="btn btn-primary btn-sm" onclick="resolveComplaint('${c.id}')">Mark Resolved</button>` : '<i>Completed</i>'}
                </td>
            </tr>
        `;
    });

    renderCharts();
}

function resolveComplaint(id) {
    const idx = complaints.findIndex(c => c.id === id);
    if(idx > -1) {
        complaints[idx].status = 'Resolved';
        localStorage.setItem('sw_complaints', JSON.stringify(complaints));
        showToast(`Complaint ${id} marked as resolved!`, 'success');
        loadAdminDashboard();
    }
}

function renderCharts() {
    chartsInstances.forEach(c => c.destroy());
    chartsInstances = [];

    const statusCtx = document.getElementById('chart-status').getContext('2d');
    const typeCtx = document.getElementById('chart-type').getContext('2d');

    const pending = complaints.filter(c => c.status === 'Pending').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    chartsInstances.push(new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Resolved'],
            datasets: [{ data: [pending, resolved], backgroundColor: ['#f59e0b', '#10b981'] }]
        },
        options: { plugins: { title: { display: true, text: 'Complaints Status' } } }
    }));

    chartsInstances.push(new Chart(typeCtx, {
        type: 'bar',
        data: {
            labels: ['Overflowing Bin', 'Illegal Dumping', 'Road Garbage'],
            datasets: [{
                label: 'Issues Reported',
                data: [
                    complaints.filter(c=>c.type==='Overflowing Bin').length || 2, 
                    complaints.filter(c=>c.type==='Illegal Dumping').length || 1, 
                    complaints.filter(c=>c.type.includes('Road')).length || 1
                ],
                backgroundColor: '#3b82f6'
            }]
        },
        options: { plugins: { title: { display: true, text: 'Complaint Categories' } } }
    }));
}

function initMap() {
    if (mapInstance) mapInstance.remove();
    mapInstance = L.map('map').setView([26.4499, 80.3319], 12); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    const hotspots = [
        { lat: 26.45, lng: 80.33, title: 'Sector 12 Market - High Waste', color: 'red' },
        { lat: 26.46, lng: 80.31, title: 'Ring Road - Medium Waste', color: 'orange' },
        { lat: 26.43, lng: 80.35, title: 'College Ave - Pending Pickup', color: 'blue' }
    ];

    hotspots.forEach(spot => {
        L.circleMarker([spot.lat, spot.lng], {
            radius: 12, fillColor: spot.color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8
        }).addTo(mapInstance).bindPopup(`<b>${spot.title}</b><br>Multiple reports in this area.`);
    });
}

// ====== UTILS ======
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}