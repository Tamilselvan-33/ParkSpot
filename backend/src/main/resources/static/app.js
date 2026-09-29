// ========================================================
// ParkSpot — Multi-Page Client Logic & Authentication
// ========================================================

const API_BASE = (window.location.origin.startsWith('http')) 
    ? window.location.origin 
    : 'http://localhost:8080';

let authToken = localStorage.getItem('parkspot_token') || '';
let currentUser = JSON.parse(localStorage.getItem('parkspot_user') || 'null');

let allSlots = [];
let activeVisitors = [];
let allHistoryVisitors = [];
let allFlats = [];
let currentBayFilter = 'ALL';
let currentHistoryDate = '';

// Startup Lifecycle
document.addEventListener('DOMContentLoaded', () => {
    initClock();

    // Check if user is already authenticated
    if (authToken && currentUser) {
        showAppShell();
    } else {
        showLoginGate();
    }

    // Auto-refresh every 12 seconds when logged in
    setInterval(() => {
        if (authToken) {
            refreshAllData(true);
        }
    }, 12000);
});

// Real-Time Clock
function initClock() {
    const clockEl = document.getElementById('live-clock');
    const update = () => {
        const now = new Date();
        if (clockEl) clockEl.textContent = now.toLocaleTimeString();
    };
    update();
    setInterval(update, 1000);
}

// ========================================================
// AUTHENTICATION & LOGIN GATE
// ========================================================
function showLoginGate() {
    document.getElementById('view-login').style.display = 'flex';
    document.getElementById('app-shell').style.display = 'none';
}

function showAppShell() {
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('app-shell').style.display = 'block';
    updateUserBadge();
    navigateTo('dashboard');
    refreshAllData();
}

function quickFillAuth(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const btn = document.getElementById('btn-login-submit');
    btn.disabled = true;
    btn.textContent = 'Authenticating...';

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(`⚠️ ${data.message || 'Invalid username or password'}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Sign In to ParkSpot';
            return;
        }

        // Store JWT and session
        authToken = data.token;
        currentUser = { username: data.username, role: data.role };
        localStorage.setItem('parkspot_token', authToken);
        localStorage.setItem('parkspot_user', JSON.stringify(currentUser));

        showToast(`Welcome back, ${data.username}!`, 'success');
        showAppShell();
    } catch (err) {
        console.error(err);
        showToast('Cannot connect to Spring Boot backend.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In to ParkSpot';
    }
}

function handleLogout() {
    if (!confirm('Are you sure you want to log out?')) return;

    authToken = '';
    currentUser = null;
    localStorage.removeItem('parkspot_token');
    localStorage.removeItem('parkspot_user');

    showToast('You have been logged out.', 'info');
    showLoginGate();
}

function updateUserBadge() {
    if (!currentUser) return;
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');

    if (nameEl) nameEl.textContent = currentUser.username;
    if (roleEl) roleEl.textContent = currentUser.role.replace('ROLE_', '');
    if (avatarEl) avatarEl.textContent = currentUser.role.includes('ADMIN') ? '👑' : '👮';
}

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// ========================================================
// MULTI-PAGE NAVIGATION ROUTER
// ========================================================
function navigateTo(pageId) {
    const pages = ['dashboard', 'bays', 'actions', 'history'];
    
    pages.forEach(p => {
        const el = document.getElementById(`page-${p}`);
        const navBtn = document.getElementById(`nav-${p}`);
        if (el) el.classList.remove('active');
        if (navBtn) navBtn.classList.remove('active');
    });

    const targetPage = document.getElementById(`page-${pageId}`);
    const targetNav = document.getElementById(`nav-${pageId}`);

    if (targetPage) targetPage.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    // Trigger page-specific loads
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'bays') renderBays();
    if (pageId === 'actions') renderActionStation();
    if (pageId === 'history') loadHistoryPage();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================================
// DATA LOADING
// ========================================================
async function refreshAllData(silent = false) {
    if (!authToken) return;
    try {
        await Promise.all([
            loadSlots(),
            loadVisitors(),
            loadFlats(),
            loadDailyStats()
        ]);
        renderDashboard();
        renderBays();
        renderActionStation();
        if (!silent) showToast('System refreshed with latest data', 'info');
    } catch (err) {
        console.error('Error refreshing data:', err);
    }
}

async function loadSlots() {
    try {
        const res = await fetch(`${API_BASE}/api/parking-slots`, { headers: getHeaders() });
        if (res.status === 401) { handleLogout(); return; }
        if (res.ok) allSlots = await res.json();
    } catch (e) { console.error(e); }
}

async function loadVisitors() {
    try {
        const [currRes, histRes] = await Promise.all([
            fetch(`${API_BASE}/api/visitors/current`, { headers: getHeaders() }),
            fetch(`${API_BASE}/api/visitors`, { headers: getHeaders() })
        ]);
        if (currRes.ok) activeVisitors = await currRes.json();
        if (histRes.ok) allHistoryVisitors = await histRes.json();
    } catch (e) { console.error(e); }
}

async function loadFlats() {
    try {
        const res = await fetch(`${API_BASE}/api/flats`, { headers: getHeaders() });
        if (res.ok) allFlats = await res.json();
    } catch (e) { console.error(e); }
}

let todayTotalVisits = 0;
async function loadDailyStats() {
    try {
        const res = await fetch(`${API_BASE}/api/reports/daily`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            todayTotalVisits = data.totalVisitors;
        }
    } catch (e) { console.error(e); }
}

// ========================================================
// PAGE 1: DASHBOARD RENDERING
// ========================================================
function renderDashboard() {
    const total = allSlots.length;
    const free = allSlots.filter(s => s.status === 'FREE').length;
    const occupied = total - free;

    // Metrics
    const dTotal = document.getElementById('dash-total-slots');
    const dFree = document.getElementById('dash-free-slots');
    const dOcc = document.getElementById('dash-occupied-slots');
    const dVisits = document.getElementById('dash-today-visits');

    if (dTotal) dTotal.textContent = total;
    if (dFree) dFree.textContent = free;
    if (dOcc) dOcc.textContent = occupied;
    if (dVisits) dVisits.textContent = todayTotalVisits;

    // Capacity Gauge
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const rateEl = document.getElementById('dash-occupancy-rate');
    const fillEl = document.getElementById('dash-progress-fill');
    const legFree = document.getElementById('dash-legend-free');
    const legOcc = document.getElementById('dash-legend-occ');

    if (rateEl) rateEl.textContent = `${pct}% Full`;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (legFree) legFree.textContent = free;
    if (legOcc) legOcc.textContent = occupied;

    // Active Table Preview
    const tbody = document.getElementById('dash-active-tbody');
    if (!tbody) return;

    if (activeVisitors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 18px;">No visitor vehicles currently inside society.</td></tr>`;
        return;
    }

    tbody.innerHTML = activeVisitors.slice(0, 5).map(v => `
        <tr>
            <td><span class="plate-cell">${escapeHtml(v.vehicleNumber)}</span></td>
            <td><span class="flat-badge">Slot ${v.slotNumber}</span></td>
            <td>Flat ${escapeHtml(v.flatNumber)}</td>
            <td><span class="time-stamp">${formatTime(v.entryTime)}</span></td>
            <td>
                <button class="btn btn-danger btn-xs" onclick="checkoutVehicle(${v.id})">
                    🚪 Exit
                </button>
            </td>
        </tr>
    `).join('');
}

// ========================================================
// PAGE 2: PARKING BAYS RENDERING
// ========================================================
function renderBays() {
    const grid = document.getElementById('bay-grid');
    if (!grid) return;

    let list = allSlots;
    if (currentBayFilter === 'FREE') list = allSlots.filter(s => s.status === 'FREE');
    if (currentBayFilter === 'OCCUPIED') list = allSlots.filter(s => s.status === 'OCCUPIED');

    if (list.length === 0) {
        grid.innerHTML = `<div class="empty-state">No parking bays match the filter "${currentBayFilter}".</div>`;
        return;
    }

    grid.innerHTML = list.map(slot => {
        const isFree = slot.status === 'FREE';
        return `
            <div class="slot-card ${isFree ? 'status-free' : 'status-occupied'}" 
                 onclick="${isFree ? `goToAssignSlot(${slot.id})` : ''}">
                <div class="slot-card-top">
                    <span class="slot-number-badge">Bay #${slot.slotNumber}</span>
                    <span class="slot-badge ${isFree ? 'badge-free' : 'badge-occupied'}">${slot.status}</span>
                </div>

                ${isFree ? `
                    <div class="slot-free-hint">
                        <span>👉 Click to park here</span>
                    </div>
                    <button class="btn btn-secondary btn-xs btn-block" onclick="event.stopPropagation(); goToAssignSlot(${slot.id})">
                        + Assign Bay
                    </button>
                ` : `
                    <div class="number-plate">${escapeHtml(slot.vehicleNumber || 'OCCUPIED')}</div>
                    <div class="slot-details">
                        <span>Flat Visited: <strong>Flat ${escapeHtml(slot.flatNumber || 'N/A')}</strong></span>
                        <span>Parked At: <strong>${formatTime(slot.entryTime)}</strong></span>
                    </div>
                    <button class="btn btn-danger btn-xs btn-block" onclick="event.stopPropagation(); checkoutVehicle(${slot.visitorId})">
                        🚪 Mark Exit & Free Bay
                    </button>
                `}
            </div>
        `;
    }).join('');
}

function filterBays(filter, btn) {
    currentBayFilter = filter;
    document.querySelectorAll('.slot-filters .filter-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderBays();
}

function goToAssignSlot(slotId) {
    navigateTo('actions');
    const slotSelect = document.getElementById('station-select-slot');
    if (slotSelect) slotSelect.value = slotId;
}

// ========================================================
// PAGE 3: QUICK ACTIONS STATION
// ========================================================
function renderActionStation() {
    populateStationDropdowns();
    renderCheckoutList();
}

function populateStationDropdowns() {
    // Populate flats
    const flatSelect = document.getElementById('station-select-flat');
    if (flatSelect) {
        const currentVal = flatSelect.value;
        flatSelect.innerHTML = '<option value="">Select Flat...</option>' +
            allFlats.map(f => `<option value="${f.id}">Flat ${f.flatNumber} (${escapeHtml(f.residentName)})</option>`).join('');
        if (currentVal) flatSelect.value = currentVal;
    }

    // Populate free slots
    const slotSelect = document.getElementById('station-select-slot');
    if (slotSelect) {
        const currentVal = slotSelect.value;
        const freeSlots = allSlots.filter(s => s.status === 'FREE');
        slotSelect.innerHTML = '<option value="">Select Free Slot...</option>' +
            freeSlots.map(s => `<option value="${s.id}">Slot ${s.slotNumber} (Available)</option>`).join('');
        if (currentVal) slotSelect.value = currentVal;
    }
}

function updatePlatePreview(val) {
    const previewEl = document.getElementById('preview-plate-text');
    if (previewEl) {
        previewEl.textContent = val.trim().toUpperCase() || 'TN 38 AB 1234';
    }
}

function setStationAlert(message, type = 'error') {
    const alertBox = document.getElementById('station-inline-alert');
    if (!alertBox) return;
    alertBox.className = `inline-feedback-alert show alert-${type}`;
    alertBox.innerHTML = `<span>${message}</span>`;
    alertBox.style.display = 'flex';
}

function clearStationAlert() {
    const alertBox = document.getElementById('station-inline-alert');
    if (!alertBox) return;
    alertBox.className = 'inline-feedback-alert';
    alertBox.style.display = 'none';
    alertBox.innerHTML = '';
}

async function handleStationEntry(e) {
    e.preventDefault();
    clearStationAlert();

    const btn = document.getElementById('btn-station-submit');
    const originalText = btn ? btn.innerHTML : '✅ Check In & Park Vehicle';

    const vehicleInput = document.getElementById('station-vehicle-number');
    const flatSelect = document.getElementById('station-select-flat');
    const slotSelect = document.getElementById('station-select-slot');

    const vehicleNumber = vehicleInput ? vehicleInput.value.trim().replace(/\s+/g, ' ').toUpperCase() : '';
    const flatId = flatSelect ? parseInt(flatSelect.value, 10) : NaN;
    const slotId = slotSelect ? parseInt(slotSelect.value, 10) : NaN;

    if (!vehicleNumber || isNaN(flatId) || isNaN(slotId)) {
        showToast('Please complete all check-in fields', 'error');
        setStationAlert('⚠️ Please complete all check-in fields (Plate, Flat, and Bay).', 'error');
        return;
    }

    // Disable button to prevent double-click / rapid concurrent requests
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Registering Entry...';
        btn.style.opacity = '0.7';
    }

    try {
        const res = await fetch(`${API_BASE}/api/visitors`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vehicleNumber, flatId, slotId })
        });

        const data = await res.json();

        if (res.status === 409) {
            // Strict business rule violation: Slot occupied
            const msg = `🛑 Slot Occupied: ${data.message || 'This parking bay is already occupied.'}`;
            showToast(msg, 'error');
            setStationAlert(msg, 'error');
            return;
        }

        if (!res.ok) {
            // Business rule violation (e.g. vehicle already inside)
            const msg = `⚠️ Check-In Rejected: ${data.message || 'Entry check-in failed'}`;
            showToast(msg, 'error');
            setStationAlert(msg, 'error');
            return;
        }

        // Success
        const successMsg = `✅ Vehicle ${data.vehicleNumber} successfully checked in to Slot ${data.slotNumber}!`;
        showToast(successMsg, 'success');
        setStationAlert(successMsg, 'success');

        document.getElementById('action-entry-form').reset();
        updatePlatePreview('');

        await refreshAllData(true);
    } catch (err) {
        console.error(err);
        showToast('Network error while checking in vehicle.', 'error');
        setStationAlert('Network error while connecting to Spring Boot backend.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
        }
    }
}

function renderCheckoutList(filteredList = null) {
    const listContainer = document.getElementById('checkout-vehicle-list');
    if (!listContainer) return;

    const items = filteredList || activeVisitors;

    if (items.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-muted);">No parked vehicles ready for checkout.</div>`;
        return;
    }

    listContainer.innerHTML = items.map(v => `
        <div class="checkout-item-card">
            <div class="checkout-vehicle-info">
                <span class="checkout-plate">${escapeHtml(v.vehicleNumber)}</span>
                <span class="checkout-sub">Parked in <strong>Slot ${v.slotNumber}</strong> &bull; Flat ${escapeHtml(v.flatNumber)}</span>
                <span class="time-stamp">Arrived: ${formatTime(v.entryTime)}</span>
            </div>
            <button class="btn btn-danger btn-sm" onclick="checkoutVehicle(${v.id})">
                🚪 Check Out
            </button>
        </div>
    `).join('');
}

function filterCheckoutList(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        renderCheckoutList();
        return;
    }
    const filtered = activeVisitors.filter(v =>
        v.vehicleNumber.toLowerCase().includes(q) ||
        v.flatNumber.toLowerCase().includes(q) ||
        String(v.slotNumber).includes(q)
    );
    renderCheckoutList(filtered);
}

async function checkoutVehicle(visitorId) {
    if (!confirm('Confirm vehicle check-out? This will record the exit time and free the parking slot.')) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/visitors/${visitorId}/exit`, {
            method: 'PUT',
            headers: getHeaders()
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(`⚠️ ${data.message || 'Check-out failed'}`, 'error');
            return;
        }

        showToast(`🚪 Vehicle ${data.vehicleNumber} checked out! Slot ${data.slotNumber} is now FREE.`, 'success');
        await refreshAllData(true);
    } catch (err) {
        console.error(err);
        showToast('Network error during checkout.', 'error');
    }
}

// ========================================================
// PAGE 4: VISITOR HISTORY & REPORTS
// ========================================================
let currentHistoryData = [];

async function loadHistoryPage() {
    const picker = document.getElementById('history-date-picker');
    const today = new Date().toISOString().split('T')[0];
    if (picker && !picker.value) {
        picker.value = today;
    }
    await loadDailyHistoryReport(picker ? picker.value : today);
}

async function handleHistoryDateChange(dateStr) {
    if (!dateStr) return;
    await loadDailyHistoryReport(dateStr);
}

async function resetHistoryFilters() {
    const picker = document.getElementById('history-date-picker');
    if (picker) picker.value = '';
    
    document.getElementById('hist-selected-date').textContent = 'All Records';
    currentHistoryData = allHistoryVisitors;
    
    const total = currentHistoryData.length;
    const parked = currentHistoryData.filter(v => v.status === 'PARKED').length;
    const exited = total - parked;

    document.getElementById('hist-stat-total').textContent = total;
    document.getElementById('hist-stat-parked').textContent = parked;
    document.getElementById('hist-stat-exited').textContent = exited;

    renderHistoryTable(currentHistoryData);
}

async function loadDailyHistoryReport(dateStr) {
    document.getElementById('hist-selected-date').textContent = dateStr;
    try {
        const res = await fetch(`${API_BASE}/api/reports/daily?date=${dateStr}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Report error');
        const data = await res.json();

        document.getElementById('hist-stat-total').textContent = data.totalVisitors;
        document.getElementById('hist-stat-parked').textContent = data.currentlyParked;
        document.getElementById('hist-stat-exited').textContent = data.completedVisits;

        currentHistoryData = data.visitors;
        renderHistoryTable(currentHistoryData);
    } catch (err) {
        console.error('Error loading history:', err);
    }
}

function renderHistoryTable(list) {
    const tbody = document.getElementById('history-tbody');
    const countEl = document.getElementById('history-records-count');
    if (!tbody) return;

    if (countEl) countEl.textContent = `Showing ${list.length} records`;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 28px;">No visitor records found for this selection.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(v => {
        const isParked = v.status === 'PARKED';
        return `
            <tr>
                <td><span class="plate-cell">${escapeHtml(v.vehicleNumber)}</span></td>
                <td><span class="flat-badge">Slot ${v.slotNumber}</span></td>
                <td>Flat ${escapeHtml(v.flatNumber)}</td>
                <td>${escapeHtml(v.residentName)}</td>
                <td><span class="time-stamp">${formatDateTime(v.entryTime)}</span></td>
                <td><span class="time-stamp">${v.exitTime ? formatDateTime(v.exitTime) : '—'}</span></td>
                <td>
                    <span class="slot-badge ${isParked ? 'badge-occupied' : 'badge-free'}">
                        ${isParked ? 'Inside' : 'Exited'}
                    </span>
                </td>
                <td>
                    ${isParked ? `
                        <button class="btn btn-danger btn-xs" onclick="checkoutVehicle(${v.id})">
                            🚪 Mark Exit
                        </button>
                    ` : `
                        <span style="color: var(--text-muted); font-size: 0.75rem;">Completed</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function filterHistoryTable(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        renderHistoryTable(currentHistoryData);
        return;
    }
    const filtered = currentHistoryData.filter(v =>
        v.vehicleNumber.toLowerCase().includes(q) ||
        v.flatNumber.toLowerCase().includes(q) ||
        v.residentName.toLowerCase().includes(q) ||
        String(v.slotNumber).includes(q)
    );
    renderHistoryTable(filtered);
}

// ========================================================
// TOAST & FORMATTING HELPERS
// ========================================================
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
        setTimeout(() => toast.remove(), 250);
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
