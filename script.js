// ====== SYSTEM DATA & INITIALIZATION ======
const DEMO_USERS = {
    'citizen@smartwaste.com': { name: 'Demo Citizen', role: 'citizen', password: '123456', points: 150 },
    'admin@smartwaste.com': { name: 'System Admin', role: 'admin', password: 'admin123', points: 0 }
};

const DEFAULT_COMPLAINTS = [
    { id: 'SW-2026-001', type: 'Overflowing Bin', location: 'Sector 12 Market', date: '2026-09-28', priority: 'High', status: 'Pending', citizen: 'Demo Citizen' },
    { id: 'SW-2026-002', type: 'Illegal Dumping', location: 'Ring Road', date: '2026-09-29', priority: 'High', status: 'Resolved', citizen: 'Aman K.' },
    { id: 'SW-2026-003', type: 'Garbage on Road', location: 'College Avenue', date: '2026-09-30', priority: 'Medium', status: 'Pending', citizen: 'Priya S.' }
];

// System Reset Logic agar pehle ka data kharab ho
if (!localStorage.getItem('sw_system_init_final')) {
    localStorage.removeItem('sw_complaints'); 
    localStorage.setItem('sw_complaints', JSON.stringify(DEFAULT_COMPLAINTS));
    localStorage.setItem('sw_system_init_final', 'true'); 
}

let currentUser = JSON.parse(localStorage.getItem('sw_user')) || null;
let complaints = JSON.parse(localStorage.getItem('sw_complaints')) || [];
let pickups = JSON.parse(localStorage.getItem('sw_pickups')) || [];
let feedbacks = JSON.parse(localStorage.getItem('sw_feedbacks')) || [];
let chartsInstances = [];
let mapInstance = null;

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

    // Event Listeners
    if(document.getElementById('auth-form')) document.getElementById('auth-form').addEventListener('submit', handleAuth);
    if(document.getElementById('report-form')) document.getElementById('report-form').addEventListener('submit', handleReportSubmit);
    if(document.getElementById('report-photo')) document.getElementById('report-photo').addEventListener('change', handleImageUpload);
    if(document.getElementById('pickup-form')) document.getElementById('pickup-form').addEventListener('submit', handlePickupSubmit);
    if(document.getElementById('feedback-form')) document.getElementById('feedback-form').addEventListener('submit', handleFeedbackSubmit);
});

// ====== NAVIGATION & VIEWS ======
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
    
    if (viewId === 'view-citizen-dashboard') loadCitizenDashboard();
    if (viewId === 'view-admin-dashboard') loadAdminDashboard();
    if (viewId === 'view-admin-database') loadAdminDatabase();
    if (viewId === 'view-admin-feedback') loadAdminFeedback();
    if (viewId === 'view-eco') loadEcoPoints();
    if (viewId === 'view-hotspots') setTimeout(initMap, 100);
}

function updateNav() {
    const navContainer = document.getElementById('nav-links-container');
    if (currentUser) {
        navContainer.innerHTML = `<button class="btn btn-secondary btn-sm" onclick="logout()"><i class="fa-solid fa-power-off"></i> Logout</button>`;
    } else {
        navContainer.innerHTML = `<button class="btn btn-outline btn-sm" onclick="showAuth('login')">Login to Portal</button>`;
    }
}

function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (currentUser.role === 'citizen') {
        sidebar.innerHTML = `
            <ul>
                <li onclick="showView('view-citizen-dashboard')"><i class="fa-solid fa-border-all"></i> My Dashboard</li>
                <li onclick="showView('view-report')"><i class="fa-solid fa-camera-retro"></i> New Report</li>
                <li onclick="showView('view-pickup')"><i class="fa-solid fa-truck"></i> Request Pickup</li>
                <li onclick="showView('view-track')"><i class="fa-solid fa-magnifying-glass-location"></i> Track Status</li>
                <li onclick="showView('view-eco')"><i class="fa-solid fa-leaf"></i> Eco & Awareness</li>
                <li onclick="showView('view-feedback')"><i class="fa-solid fa-comment-dots"></i> App Feedback</li>
            </ul>
        `;
    } else {
        sidebar.innerHTML = `
            <ul>
                <li onclick="showView('view-admin-dashboard')"><i class="fa-solid fa-chart-line"></i> Command Center</li>
                <li onclick="showView('view-hotspots')"><i class="fa-solid fa-map-location"></i> Map Hotspots</li>
                <li onclick="showView('view-admin-feedback')"><i class="fa-solid fa-star"></i> View Feedbacks</li>
                <li onclick="showView('view-admin-database')"><i class="fa-solid fa-database"></i> System Database</li>
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
    document.getElementById('auth-title').innerText = isLoginMode ? 'System Login' : 'Create Account';
    document.getElementById('name-group').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('role-group').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('auth-btn').innerText = isLoginMode ? 'Access Dashboard' : 'Register';
    document.getElementById('auth-switch-text').innerHTML = isLoginMode ? 
        `New user? <a href="#" onclick="showAuth('register')">Create Account</a>` : 
        `Already have account? <a href="#" onclick="showAuth('login')">Login</a>`;
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
            showToast('Invalid credentials. Check demo accounts below.', 'error');
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
    showToast(`Welcome to Dashboard, ${currentUser.name}`, 'success');
}

function logout() {
    localStorage.removeItem('sw_user');
    currentUser = null;
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('landing-container').style.display = 'block';
    updateNav();
    showView('view-landing');
}

// ====== LOCATION HANDLER ======
function getLocation() {
    if (navigator.geolocation) {
        showToast('Requesting GPS location...', 'success');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                document.getElementById('report-location').value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                showToast('GPS coordinates fetched successfully.', 'success');
            },
            (error) => {
                showToast('Location permission denied! Please type location manually in the box.', 'error');
            }
        );
    } else {
        showToast('Geolocation is not supported by your browser.', 'error');
    }
}

// ====== CITIZEN FUNCTIONS ======
function loadCitizenDashboard() {
    complaints = JSON.parse(localStorage.getItem('sw_complaints')) || [];
    document.getElementById('welcome-message').innerText = `Welcome back, ${currentUser.name}`;
    const myComplaints = complaints.filter(c => c.citizen === currentUser.name || currentUser.name === 'Demo Citizen');
    
    if(document.getElementById('c-stat-total')){
        document.getElementById('c-stat-total').innerText = myComplaints.length;
        document.getElementById('c-stat-pending').innerText = myComplaints.filter(c => c.status === 'Pending').length;
        document.getElementById('c-stat-resolved').innerText = myComplaints.filter(c => c.status === 'Resolved').length;
        document.getElementById('c-stat-points').innerText = currentUser.points || 0;
    }

    const tbody = document.querySelector('#citizen-complaints-table tbody');
    if(tbody){
        tbody.innerHTML = '';
        myComplaints.slice().reverse().forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td><b>${c.type}</b></td>
                    <td>${c.location}</td>
                    <td>${c.date}</td>
                    <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
                </tr>
            `;
        });
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photo-preview').src = e.target.result;
            document.getElementById('photo-preview').style.display = 'block';
            simulateAIAnalysis(); 
        }
        reader.readAsDataURL(file);
    }
}

function simulateAIAnalysis() {
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
        let severity = type.includes('Dumping') || type.includes('Overflowing') ? 'High' : 'Medium';
        document.getElementById('ai-confidence').innerText = (Math.random() * 10 + 85).toFixed(1) + '%';
        const sevBadge = document.getElementById('ai-severity');
        sevBadge.innerText = severity;
        sevBadge.className = `badge ${severity.toLowerCase()}`;
    }, 1500);
}

function handleReportSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('report-type').value;
    const location = document.getElementById('report-location').value;
    let priority = type.includes('Dumping') ? 'High' : 'Medium';

    const newComplaint = {
        id: `SW-2026-${Math.floor(Math.random() * 900 + 100)}`,
        type, location, priority,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        citizen: currentUser.name
    };

    complaints.push(newComplaint);
    localStorage.setItem('sw_complaints', JSON.stringify(complaints));
    currentUser.points += 10;
    localStorage.setItem('sw_user', JSON.stringify(currentUser));

    showToast('Report submitted! Sent to Admin Grid.', 'success');
    e.target.reset();
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('ai-analysis-panel').style.display = 'none';
    showView('view-citizen-dashboard');
}

// Pickup Request
function handlePickupSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('pickup-type').value;
    const date = document.getElementById('pickup-date').value;
    const address = document.getElementById('pickup-address').value;

    const newPickup = {
        id: `PK-${Math.floor(Math.random() * 9000 + 1000)}`,
        type, date, address,
        status: 'Scheduled',
        citizen: currentUser.name
    };

    pickups.push(newPickup);
    localStorage.setItem('sw_pickups', JSON.stringify(pickups));
    showToast(`Pickup scheduled! ID: ${newPickup.id}`, 'success');
    e.target.reset();
    showView('view-citizen-dashboard');
}

// Feedback
function handleFeedbackSubmit(e) {
    e.preventDefault();
    const rating = document.getElementById('feedback-rating').value;
    const desc = document.getElementById('feedback-desc').value;

    feedbacks.push({
        citizen: currentUser.name,
        rating: rating,
        comments: desc,
        date: new Date().toISOString().split('T')[0]
    });

    localStorage.setItem('sw_feedbacks', JSON.stringify(feedbacks));
    showToast('Thank you for your feedback!', 'success');
    e.target.reset();
    showView('view-citizen-dashboard');
}

function trackComplaint() {
    const id = document.getElementById('track-id').value;
    
    // Check in complaints
    let record = complaints.find(c => c.id === id);
    let isPickup = false;

    // Check in pickups if not found in complaints
    if (!record) {
        record = pickups.find(p => p.id === id);
        isPickup = true;
    }

    if (!record) { showToast('ID not found', 'error'); return; }

    document.getElementById('tracking-result').style.display = 'block';
    document.getElementById('track-title').innerText = `Status for ${record.id}`;
    
    const isResolved = record.status === 'Resolved' || record.status === 'Completed';
    
    if(isPickup) {
        document.getElementById('tracking-timeline').innerHTML = `
            <div class="timeline-item active">
                <div class="timeline-dot"><i class="fa-solid fa-truck"></i></div>
                <h4>Pickup Scheduled</h4><p>For Date: ${record.date} at ${record.address}</p>
            </div>
            <div class="timeline-item ${isResolved ? 'active' : ''}">
                <div class="timeline-dot"><i class="fa-solid fa-check"></i></div>
                <h4>Completed</h4><p>${isResolved ? 'Waste collected' : 'Waiting for collection day'}</p>
            </div>
        `;
    } else {
        document.getElementById('tracking-timeline').innerHTML = `
            <div class="timeline-item active">
                <div class="timeline-dot"><i class="fa-solid fa-file-signature"></i></div>
                <h4>Reported</h4><p>${record.date} by ${record.citizen}</p>
            </div>
            <div class="timeline-item ${isResolved ? 'active' : ''}">
                <div class="timeline-dot"><i class="fa-solid fa-truck"></i></div>
                <h4>Resolved</h4><p>${isResolved ? 'Issue fixed by Admin' : 'Waiting for action'}</p>
            </div>
        `;
    }
}

// ====== DYNAMIC QUIZ LOGIC ======
const quizQuestions = [
    { q: "Kele ka chilka (Banana peel) kahan daalna chahiye?", options: ["Wet Waste (Geela Kachra)", "Dry Waste (Sookha Kachra)", "Hazardous Waste"], ans: 0 },
    { q: "Plastic ki paani ki botal kisme jayegi?", options: ["Wet Waste", "Recyclable / Dry Waste", "E-Waste"], ans: 1 },
    { q: "Purana mobile phone ya remote ki battery kahan fekna chahiye?", options: ["Wet Waste", "Dry Waste", "E-Waste / Hazardous"], ans: 2 }
];
let currentQ = 0;

function renderQuiz() {
    const container = document.getElementById('quiz-container');
    if(!container) return;
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
        if(document.getElementById('eco-total')) document.getElementById('eco-total').innerText = currentUser.points;
    } else {
        showToast('Galat Jawab! Koi baat nahi, aage badhein.', 'error');
    }
    currentQ++;
    setTimeout(renderQuiz, 800);
}

function loadEcoPoints() {
    if(document.getElementById('eco-total')) document.getElementById('eco-total').innerText = currentUser.points || 0;
    const list = document.getElementById('leaderboard-list');
    if(list) {
        list.innerHTML = `
            <li><span>1. ${currentUser.name}</span> <span>${currentUser.points || 0} pts</span></li>
            <li><span>2. Rahul M.</span> <span>420 pts</span></li>
            <li><span>3. Priya S.</span> <span>390 pts</span></li>
            <li><span>4. Aman K.</span> <span>310 pts</span></li>
        `;
    }
    renderQuiz();
}

// ====== ADMIN DATABASE & GRID FUNCTIONS ======
function loadAdminDashboard() {
    if(document.getElementById('a-stat-total')){
        document.getElementById('a-stat-total').innerText = complaints.length;
        document.getElementById('a-stat-pending').innerText = complaints.filter(c => c.status === 'Pending').length;
    }

    const tbody = document.querySelector('#admin-complaints-table tbody');
    if(tbody){
        tbody.innerHTML = '';
        const pendingList = complaints.filter(c => c.status === 'Pending').slice().reverse();
        if(pendingList.length === 0) tbody.innerHTML = '<tr><td colspan="5" class="text-center">No pending tasks! Good job.</td></tr>';
        
        pendingList.forEach(c => {
            tbody.innerHTML += `
                <tr>
                    <td><b>${c.id}</b></td>
                    <td>${c.type}<br><small class="text-light"><i class="fa-solid fa-location-dot"></i> ${c.location}</small></td>
                    <td><span class="badge ${c.priority.toLowerCase()}">${c.priority}</span></td>
                    <td><span class="badge pending">Pending</span></td>
                    <td><button class="btn btn-primary btn-sm" onclick="resolveComplaint('${c.id}')"><i class="fa-solid fa-check"></i> Resolve</button></td>
                </tr>
            `;
        });
    }

    // Delay drawing charts so the grey boxes have time to become visible first
    setTimeout(renderCharts, 200); 
}

function loadAdminDatabase() {
    const tbody = document.querySelector('#admin-db-table tbody');
    if(tbody){
        tbody.innerHTML = '';
        complaints.slice().reverse().forEach(c => {
            const isPending = c.status === 'Pending';
            tbody.innerHTML += `
                <tr>
                    <td><span style="font-family: monospace; color: var(--primary);">${c.id}</span></td>
                    <td>${c.type}</td>
                    <td><i class="fa-solid fa-user"></i> ${c.citizen}</td>
                    <td>${c.date}</td>
                    <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
                    <td>
                        ${isPending ? `<button class="btn btn-primary btn-sm" onclick="resolveComplaint('${c.id}'); loadAdminDatabase();"><i class="fa-solid fa-check"></i></button>` : `<i class="fa-solid fa-shield-check text-success" style="color:var(--success);"></i> Fixed`}
                        <button class="btn btn-outline btn-sm text-danger" style="border-color: var(--danger); margin-left: 5px;" onclick="deleteRecord('${c.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
}

function loadAdminFeedback() {
    const tbody = document.querySelector('#admin-feedback-table tbody');
    if(tbody){
        tbody.innerHTML = '';
        if(feedbacks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No feedback received yet.</td></tr>';
            return;
        }
        feedbacks.slice().reverse().forEach(f => {
            tbody.innerHTML += `
                <tr>
                    <td><b>${f.citizen}</b></td>
                    <td>${'⭐'.repeat(f.rating)}</td>
                    <td>${f.comments}</td>
                    <td>${f.date}</td>
                </tr>
            `;
        });
    }
}

// ====== CHARTS RENDER LOGIC ======
function renderCharts() {
    const statusEl = document.getElementById('chart-status');
    const typeEl = document.getElementById('chart-type');
    if (!statusEl || !typeEl) return;

    chartsInstances.forEach(c => c.destroy());
    chartsInstances = [];

    const pendingCount = complaints.filter(c => c.status === 'Pending').length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

    chartsInstances.push(new Chart(statusEl.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Resolved'],
            datasets: [{ data: [pendingCount, resolvedCount], backgroundColor: ['#f59e0b', '#10b981'], borderWidth: 0 }]
        },
        options: { plugins: { legend: { position: 'bottom' } }, responsive: true, maintainAspectRatio: false }
    }));

    chartsInstances.push(new Chart(typeEl.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Overflowing Bin', 'Illegal Dumping', 'Road Garbage'],
            datasets: [{
                label: 'Reports',
                data: [
                    complaints.filter(c=>c.type==='Overflowing Bin').length || 0, 
                    complaints.filter(c=>c.type==='Illegal Dumping').length || 0, 
                    complaints.filter(c=>c.type.includes('Road')).length || 0
                ],
                backgroundColor: '#3b82f6', borderRadius: 6
            }]
        },
        options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
    }));
}

function resolveComplaint(id) {
    const idx = complaints.findIndex(c => c.id === id);
    if(idx > -1) {
        complaints[idx].status = 'Resolved';
        localStorage.setItem('sw_complaints', JSON.stringify(complaints));
        showToast(`Task ${id} marked as Resolved!`, 'success');
        if(document.getElementById('view-admin-dashboard').classList.contains('active-view')) loadAdminDashboard();
    }
}

function deleteRecord(id) {
    if(confirm(`Are you sure you want to permanently delete record ${id}?`)) {
        complaints = complaints.filter(c => c.id !== id);
        localStorage.setItem('sw_complaints', JSON.stringify(complaints));
        showToast('Record deleted.', 'success');
        loadAdminDatabase();
    }
}

function factoryReset() {
    if(confirm("DANGER: Reset entire database?")) {
        localStorage.removeItem('sw_system_init_final');
        location.reload(); 
    }
}

// ====== NAYA EXCEL (CSV) EXPORT FUNCTION ======
function exportDatabaseCSV() {
    if (complaints.length === 0) {
        showToast('Database is empty. Nothing to export.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Record ID,Issue Type,Location,Priority,Status,Reported By,Date\n";

    complaints.forEach(function(row) {
        let cleanLocation = `"${row.location.replace(/"/g, '""')}"`;
        let rowData = `${row.id},${row.type},${cleanLocation},${row.priority},${row.status},${row.citizen},${row.date}`;
        csvContent += rowData + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", encodedUri);
    downloadAnchorNode.setAttribute("download", "SmartWaste_Database_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showToast('Database Excel (.csv) downloaded successfully!', 'success');
}

// ====== MAP INIT ======
function initMap() {
    if (mapInstance) mapInstance.remove();
    const mapEl = document.getElementById('map');
    if(!mapEl) return;
    
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

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = type === 'success' ? `<i class="fa-solid fa-circle-check" style="color:var(--success);font-size:1.2rem;"></i> ${message}` : `<i class="fa-solid fa-circle-exclamation" style="color:var(--danger);font-size:1.2rem;"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
