// ========================================================
// ParkSpot — Frontend Client Logic
// ========================================================

const API_BASE = (window.location.origin.startsWith('http')) 
    ? window.location.origin 
    : 'http://localhost:8080';

let authToken = localStorage.getItem('parkspot_token') || '';
let currentUser = JSON.parse(localStorage.getItem('parkspot_user') || '{"username": "security1", "role": "ROLE_SECURITY"}');

let allSlots = [];
let activeVisitors = [];
let allHistoryVisitors = [];
let allFlats = [];
let currentFilter = 'ALL';
let currentTab = 'ACTIVE';

// Initial startup
document.addEventListener('DOMContentLoaded', async () => {
    initClock();
    updateUserUI();

    // If no token stored, attempt silent login as demo security guard
    if (!authToken) {
        await silentLogin('security1', 'password123');
    }

    await loadInitialData();

    // Auto-refresh slot board every 10 seconds for real-time monitoring
    setInterval(() => {
        refreshData(true);
    }, 10000);
});

// Real-time Clock
function initClock() {
    const clockEl = document.getElementById('live-clock');
    const update = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString();
    };
    update();
    setInterval(update, 1000);
}

// Update User UI Badge
function updateUserUI() {
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');

    if (nameEl) nameEl.textContent = currentUser.username;
    if (roleEl) roleEl.textContent = currentUser.role.replace('ROLE_', '');
    if (avatarEl) avatarEl.textContent = currentUser.role.includes('ADMIN') ? '👑' : '👮';
}

// Initial Data Load
async function loadInitialData() {
    await Promise.all([
        loadSlots(),
        loadVisitors(),
        loadFlats(),
        loadTodayMetrics()
    ]);
}

// Refresh Data Trigger
async function refreshData(silent = false) {
    await Promise.all([
        loadSlots(),
        loadVisitors(),
        loadTodayMetrics()
    ]);
    if (!silent) {
        showToast('System data refreshed', 'info');
    }
}

// Headers helper with JWT Bearer
function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// ========================================================
// API Calls: Parking Slots
// ========================================================
async function loadSlots() {
    try {
        const res = await fetch(`${API_BASE}/api/parking-slots`, { headers: getHeaders() });
        if (res.status === 401) {
            await silentLogin('security1', 'password123');
            return loadSlots();
        }
        if (!res.ok) throw new Error('Failed to load slots');
        allSlots = await res.json();
        renderSlots();
        updateSlotMetrics();
        populateSlotDropdown();
    } catch (err) {
        console.error('Error loading slots:', err);
    }
}

function renderSlots() {
    const container = document.getElementById('slot-grid');
    if (!container) return;

    let filtered = allSlots;
    if (currentFilter === 'FREE') filtered = allSlots.filter(s => s.status === 'FREE');
    if (currentFilter === 'OCCUPIED') filtered = allSlots.filter(s => s.status === 'OCCUPIED');

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">No slots match filter "${currentFilter}".</div>`;
        return;
    }

    container.innerHTML = filtered.map(slot => {
        const isFree = slot.status === 'FREE';
        const cardClass = isFree ? 'status-free' : 'status-occupied';
        const badgeClass = isFree ? 'badge-free' : 'badge-occupied';

        return `
            <div class="slot-card ${cardClass}" id="slot-card-${slot.slotNumber}" 
                 onclick="${isFree ? `quickParkOnSlot(${slot.id}, ${slot.slotNumber})` : ''}">
                <div class="slot-card-top">
                    <span class="slot-number-badge">Bay #${slot.slotNumber}</span>
                    <span class="slot-badge ${badgeClass}">${slot.status}</span>
                </div>

                ${isFree ? `
                    <div class="slot-free-hint">
                        <span>👉 Click to park here</span>
                    </div>
                    <button class="btn btn-secondary btn-xs btn-block" onclick="quickParkOnSlot(${slot.id}, ${slot.slotNumber})">
                        + Assign Slot
                    </button>
                ` : `
                    <div class="number-plate">${escapeHtml(slot.vehicleNumber || 'OCCUPIED')}</div>
                    <div class="slot-details">
                        <span>Visiting Flat: <strong>${escapeHtml(slot.flatNumber || 'N/A')}</strong></span>
                        <span>Parked: <strong>${formatTime(slot.entryTime)}</strong></span>
                    </div>
                    <button class="btn btn-danger btn-xs btn-block" onclick="event.stopPropagation(); handleExit(${slot.visitorId})">
                        🚪 Mark Exit
                    </button>
                `}
            </div>
        `;
    }).join('');
}

function filterSlots(filterType, btn) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderSlots();
}

function updateSlotMetrics() {
    const totalEl = document.getElementById('stat-total-slots');
    const freeEl = document.getElementById('stat-free-slots');
    const occEl = document.getElementById('stat-occupied-slots');

    const total = allSlots.length;
    const free = allSlots.filter(s => s.status === 'FREE').length;
    const occupied = total - free;

    if (totalEl) totalEl.textContent = total;
    if (freeEl) freeEl.textContent = free;
    if (occEl) occEl.textContent = occupied;
}

// ========================================================
// API Calls: Visitors & History
// ========================================================
async function loadVisitors() {
    try {
        const [activeRes, historyRes] = await Promise.all([
            fetch(`${API_BASE}/api/visitors/current`, { headers: getHeaders() }),
            fetch(`${API_BASE}/api/visitors`, { headers: getHeaders() })
        ]);

        if (activeRes.ok) activeVisitors = await activeRes.json();
        if (historyRes.ok) allHistoryVisitors = await historyRes.json();

        const activeBadge = document.getElementById('active-count-badge');
        if (activeBadge) activeBadge.textContent = activeVisitors.length;

        renderVisitorsTable();
    } catch (err) {
        console.error('Error loading visitors:', err);
    }
}

function renderVisitorsTable(itemsToRender = null) {
    const tbody = document.getElementById('visitors-tbody');
    const thAction = document.getElementById('th-exit-or-status');
    if (!tbody) return;

    const list = itemsToRender || (currentTab === 'ACTIVE' ? activeVisitors : allHistoryVisitors);

    if (thAction) {
        thAction.textContent = currentTab === 'ACTIVE' ? 'Action' : 'Exit Time / Status';
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No visitor records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(v => {
        const isParked = v.status === 'PARKED';
        return `
            <tr id="visitor-row-${v.id}">
                <td><span class="plate-cell">${escapeHtml(v.vehicleNumber)}</span></td>
                <td><span class="flat-badge">Slot ${v.slotNumber}</span></td>
                <td>Flat ${escapeHtml(v.flatNumber)}</td>
                <td>${escapeHtml(v.residentName)}</td>
                <td><span class="time-stamp">${formatDateTime(v.entryTime)}</span></td>
                <td>
                    ${currentTab === 'ACTIVE' ? `
                        <button class="btn btn-danger btn-xs" onclick="handleExit(${v.id})">
                            🚪 Mark Exit
                        </button>
                    ` : `
                        ${isParked ? `
                            <span class="slot-badge badge-occupied">Still Inside</span>
                        ` : `
                            <span class="time-stamp">${formatDateTime(v.exitTime)}</span>
                        `}
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function switchVisitorTab(tab) {
    currentTab = tab;
    const tabActiveBtn = document.getElementById('tab-active-btn');
    const tabHistoryBtn = document.getElementById('tab-history-btn');
    const searchContainer = document.getElementById('history-search-container');

    if (tab === 'ACTIVE') {
        tabActiveBtn.classList.add('active');
        tabHistoryBtn.classList.remove('active');
        if (searchContainer) searchContainer.style.display = 'none';
    } else {
        tabActiveBtn.classList.remove('active');
        tabHistoryBtn.classList.add('active');
        if (searchContainer) searchContainer.style.display = 'block';
    }

    renderVisitorsTable();
}

function handleSearchVisitors(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        renderVisitorsTable();
        return;
    }
    const filtered = allHistoryVisitors.filter(v =>
        v.vehicleNumber.toLowerCase().includes(q) ||
        v.flatNumber.toLowerCase().includes(q) ||
        v.residentName.toLowerCase().includes(q) ||
        String(v.slotNumber).includes(q)
    );
    renderVisitorsTable(filtered);
}

// ========================================================
// API Calls: Flats & Dropdowns
// ========================================================
async function loadFlats() {
    try {
        const res = await fetch(`${API_BASE}/api/flats`, { headers: getHeaders() });
        if (res.ok) {
            allFlats = await res.json();
            populateFlatDropdown();
        }
    } catch (err) {
        console.error('Error loading flats:', err);
    }
}

function populateFlatDropdown() {
    const select = document.getElementById('select-flat');
    if (!select) return;
    select.innerHTML = '<option value="">Select Flat...</option>' +
        allFlats.map(f => `<option value="${f.id}">Flat ${f.flatNumber} — ${escapeHtml(f.residentName)}</option>`).join('');
}

function populateSlotDropdown(selectedSlotId = null) {
    const select = document.getElementById('select-slot');
    if (!select) return;

    const freeSlots = allSlots.filter(s => s.status === 'FREE');

    select.innerHTML = '<option value="">Select Free Slot...</option>' +
        freeSlots.map(s => `
            <option value="${s.id}" ${selectedSlotId && selectedSlotId === s.id ? 'selected' : ''}>
                Slot ${s.slotNumber} (Available)
            </option>
        `).join('');
}

async function loadTodayMetrics() {
    try {
        const res = await fetch(`${API_BASE}/api/reports/daily`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            const visitsEl = document.getElementById('stat-today-visits');
            if (visitsEl) visitsEl.textContent = data.totalVisitors;
        }
    } catch (err) {
        console.error('Error loading daily metrics:', err);
    }
}

// ========================================================
// User Actions: Log Entry & Mark Exit
// ========================================================
function quickParkOnSlot(slotId, slotNumber) {
    openEntryModal();
    populateSlotDropdown(slotId);
}

async function handleRegisterEntry(e) {
    e.preventDefault();
    const vehicleNumber = document.getElementById('input-vehicle-number').value.trim().toUpperCase();
    const flatId = parseInt(document.getElementById('select-flat').value, 10);
    const slotId = parseInt(document.getElementById('select-slot').value, 10);

    if (!vehicleNumber || !flatId || !slotId) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/visitors`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vehicleNumber, flatId, slotId })
        });

        const data = await res.json();

        if (res.status === 409) {
            // Business rule: Slot occupied!
            showToast(`🛑 ${data.message || 'Slot is already occupied!'}`, 'error');
            return;
        }

        if (!res.ok) {
            showToast(`⚠️ ${data.message || 'Failed to register entry'}`, 'error');
            return;
        }

        showToast(`✅ Vehicle ${data.vehicleNumber} parked in Slot ${data.slotNumber}!`, 'success');
        closeModal('modal-entry');
        document.getElementById('form-entry').reset();

        await refreshData(true);
    } catch (err) {
        console.error(err);
        showToast('Network error while logging entry.', 'error');
    }
}

async function handleExit(visitorId) {
    if (!confirm('Confirm vehicle exit? This will record the exit timestamp and free the parking slot.')) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/visitors/${visitorId}/exit`, {
            method: 'PUT',
            headers: getHeaders()
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(`⚠️ ${data.message || 'Failed to record exit'}`, 'error');
            return;
        }

        showToast(`🚪 Vehicle ${data.vehicleNumber} checked out! Slot ${data.slotNumber} is now FREE.`, 'success');
        await refreshData(true);
    } catch (err) {
        console.error(err);
        showToast('Network error while recording exit.', 'error');
    }
}

// ========================================================
// Daily Report
// ========================================================
async function openReportModal() {
    const dateInput = document.getElementById('report-date-input');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    await loadDailyReport(today);
    openModal('modal-report');
}

async function loadDailyReport(dateStr) {
    if (!dateStr) return;
    try {
        const res = await fetch(`${API_BASE}/api/reports/daily?date=${dateStr}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to load report');
        const data = await res.json();

        document.getElementById('rep-stat-total').textContent = data.totalVisitors;
        document.getElementById('rep-stat-inside').textContent = data.currentlyParked;
        document.getElementById('rep-stat-exited').textContent = data.completedVisits;

        const tbody = document.getElementById('report-tbody');
        if (data.visitors.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">No visits recorded on ${dateStr}.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.visitors.map(v => `
            <tr>
                <td><span class="plate-cell">${escapeHtml(v.vehicleNumber)}</span></td>
                <td><span class="flat-badge">Slot ${v.slotNumber}</span></td>
                <td>Flat ${escapeHtml(v.flatNumber)}</td>
                <td>${escapeHtml(v.residentName)}</td>
                <td><span class="time-stamp">${formatTime(v.entryTime)}</span></td>
                <td><span class="time-stamp">${v.exitTime ? formatTime(v.exitTime) : '—'}</span></td>
                <td>
                    <span class="slot-badge ${v.status === 'PARKED' ? 'badge-occupied' : 'badge-free'}">
                        ${v.status}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading report:', err);
        showToast('Could not load daily report.', 'error');
    }
}

// ========================================================
// Authentication
// ========================================================
async function silentLogin(username, password) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            const data = await res.json();
            authToken = data.token;
            currentUser = { username: data.username, role: data.role };
            localStorage.setItem('parkspot_token', authToken);
            localStorage.setItem('parkspot_user', JSON.stringify(currentUser));
            updateUserUI();
        }
    } catch (e) {
        console.warn('Silent login unavailable:', e);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('input-username').value.trim();
    const password = document.getElementById('input-password').value;

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(`⚠️ ${data.message || 'Login failed'}`, 'error');
            return;
        }

        authToken = data.token;
        currentUser = { username: data.username, role: data.role };
        localStorage.setItem('parkspot_token', authToken);
        localStorage.setItem('parkspot_user', JSON.stringify(currentUser));

        updateUserUI();
        closeModal('modal-auth');
        showToast(`Logged in as ${currentUser.username} (${currentUser.role})`, 'success');
        await refreshData(true);
    } catch (err) {
        showToast('Failed to authenticate with server', 'error');
    }
}

function fillCredentials(user, pass) {
    document.getElementById('input-username').value = user;
    document.getElementById('input-password').value = pass;
}

// ========================================================
// Helpers & Utilities
// ========================================================
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function openEntryModal() {
    populateSlotDropdown();
    openModal('modal-entry');
}

function toggleAuthModal() {
    openModal('modal-auth');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function formatTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
