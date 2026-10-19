/* =====================================================
   INCIDENT DATA
   -----------------------------------------------------
   This is generated SAMPLE data (86 incidents) so the
   page runs on its own. Replace `incidents` with your
   real records. Each record needs:
     id, type, region, status ('new' | 'review' | 'resolved'),
     concession ('legal' | 'illegal'), lat, lng, daysAgo
   ===================================================== */

// Approximate centre of each region + how far sample points scatter (in degrees)
const REGION_CENTERS = {
    "N'Djamena":         { lat: 12.13, lng: 15.10, spread: 0.05 },
    "Mayo-Kebbi Est":    { lat: 10.10, lng: 15.75, spread: 0.30 },
    "Chari-Baguirmi":    { lat: 11.40, lng: 16.17, spread: 0.40 },
    "Logone Oriental":   { lat: 8.65,  lng: 16.85, spread: 0.30 },
    "Mayo-Kebbi Ouest":  { lat: 9.36,  lng: 14.90, spread: 0.25 },
    "Logone Occidental": { lat: 8.75,  lng: 16.00, spread: 0.18 },
    "Tandjilé":          { lat: 9.40,  lng: 16.40, spread: 0.30 },
    "Moyen-Chari":       { lat: 9.15,  lng: 18.38, spread: 0.45 }
};

const STATUS_LABELS = { new: 'New', review: 'Under Review', resolved: 'Resolved' };
const STATUS_COLORS = { new: '#ff4444', review: '#ff9800', resolved: '#4caf50' };

function buildSampleIncidents() {
    // Turn { a: 2, b: 1 } into ['a', 'a', 'b']
    const expand = counts => Object.entries(counts)
        .flatMap(([key, n]) => Array(n).fill(key));

    const regions = expand({
        "N'Djamena": 15, "Mayo-Kebbi Est": 12, "Chari-Baguirmi": 11, "Logone Oriental": 10,
        "Mayo-Kebbi Ouest": 10, "Logone Occidental": 10, "Tandjilé": 9, "Moyen-Chari": 9
    });
    const statuses = expand({ new: 23, review: 18, resolved: 45 });
    const types = expand({
        "Logging": 28, "Bushfire": 21, "Deforestation": 19,
        "Wildlife Poaching": 12, "Land Encroachment": 6
    });

    // Small seeded random generator so the points are the same on every load
    let seed = 42;
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };

    const n = regions.length;
    return regions.map((region, k) => {
        const c = REGION_CENTERS[region];
        return {
            id: 'FR-' + (1001 + k),
            region: region,
            status: statuses[(k * 7) % n],
            type: types[(k * 11) % n],
            concession: k % 3 === 0 ? 'illegal' : 'legal',
            lat: c.lat + (rand() - 0.5) * 2 * c.spread,
            lng: c.lng + (rand() - 0.5) * 2 * c.spread,
            daysAgo: 1 + Math.floor(rand() * 60)
        };
    });
}

const incidents = buildSampleIncidents();
let filteredIncidents = incidents;

/* =====================================================
   SCREEN NAVIGATION
   ===================================================== */
let currentScreen = 'landing';

function showScreen(screenId) {
    document.getElementById(currentScreen).classList.remove('active');
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;

    const userInfo = document.getElementById('userInfo');
    if (screenId === 'managerApp') {
        userInfo.style.display = 'block';
        initializeMap(); // the map can only be built once its container is visible
    } else if (screenId === 'landing') {
        userInfo.style.display = 'none';
    }
}

function authenticateUser() {
    const email = document.getElementById('email').value;
    if (email && email.includes('@')) {
        const userName = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
        document.getElementById('userName').textContent = userName;
        showScreen('guideChoice');
    } else {
        alert('⚠️ Please enter a valid institutional email address');
    }
}

// Prototype shortcut: skip typing and sign in with the sample account
function continueAsDemoUser() {
    document.getElementById('email').value = 'amina.ndolo@environment.gov.td';
    authenticateUser();
}

/* =====================================================
   MAP (Leaflet)
   ===================================================== */
let map = null;
let markerLayer = null;
let streetLayer = null;
let satelliteLayer = null;
let mapStarted = false;

function initializeMap() {
    if (typeof L === 'undefined') {
        alert('The map library could not be loaded. Please check your internet connection and reload the page.');
        return;
    }

    // Already created: just recalculate the size in case the layout changed
    if (mapStarted) {
        setTimeout(() => { if (map) map.invalidateSize(); }, 100);
        return;
    }
    mapStarted = true;

    // Short delay so the container is fully laid out before Leaflet measures it
    setTimeout(() => {
        map = L.map('leafletMap', { zoomControl: false }).setView([10.2, 16.6], 7);

        // Esri World Street Map: needs no API key and also works when the page
        // is opened directly as a file (OpenStreetMap's own servers block that).
        streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri'
        }).addTo(map);

        satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri'
        });

        L.control.scale({ imperial: false }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);
        renderMarkers();
        map.invalidateSize();
    }, 100);
}

function renderMarkers() {
    if (!markerLayer) return;
    markerLayer.clearLayers();

    filteredIncidents.forEach(i => {
        L.circleMarker([i.lat, i.lng], {
            radius: 8,
            color: '#ffffff',
            weight: 2,
            fillColor: STATUS_COLORS[i.status],
            fillOpacity: 1
        })
        .bindPopup(
            '<strong>' + i.type + '</strong><br>' +
            i.region + '<br>' +
            'Status: ' + STATUS_LABELS[i.status] + '<br>' +
            'Concession: ' + (i.concession === 'legal' ? 'Legal' : 'Illegal') + '<br>' +
            'Reported: ' + i.daysAgo + (i.daysAgo === 1 ? ' day ago' : ' days ago') + '<br>' +
            '<span style="color:#888;">' + i.id + ' • ' + i.lat.toFixed(4) + ', ' + i.lng.toFixed(4) + '</span>'
        )
        .addTo(markerLayer);
    });
}

function zoomIn()  { if (map) map.zoomIn(); }
function zoomOut() { if (map) map.zoomOut(); }

// Switch between the street map and satellite imagery
function toggleLayers() {
    if (!map) return;
    if (map.hasLayer(streetLayer)) {
        map.removeLayer(streetLayer);
        satelliteLayer.addTo(map);
    } else {
        map.removeLayer(satelliteLayer);
        streetLayer.addTo(map);
    }
}

/* =====================================================
   FILTERS
   ===================================================== */
const FILTER_GROUPS = ['region', 'concession', 'type', 'status'];

function getSelected(group) {
    return Array.from(
        document.querySelectorAll('.sidebar input[data-group="' + group + '"]:checked')
    ).map(cb => cb.value);
}

// Called whenever a filter checkbox changes.
// Nothing ticked in a group = that group is not filtered.
function updateMap() {
    const selected = {};
    FILTER_GROUPS.forEach(g => selected[g] = getSelected(g));

    filteredIncidents = incidents.filter(i =>
        FILTER_GROUPS.every(g => selected[g].length === 0 || selected[g].includes(i[g]))
    );

    renderMarkers();
    updateStats();
}

function clearAllFilters() {
    document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateMap();
}

function toggleDropdown(id) {
    const dropdowns = document.getElementsByClassName('dropdown-content');
    for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].id !== id) dropdowns[i].style.display = 'none';
    }
    const dropdown = document.getElementById(id);
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

/* =====================================================
   STATISTICS (legend, pie chart, totals)
   ===================================================== */
let pieChart = null;

function countBy(list, key) {
    const counts = {};
    list.forEach(i => counts[i[key]] = (counts[i[key]] || 0) + 1);
    return counts;
}

function updateStats() {
    const byStatus = countBy(filteredIncidents, 'status');
    const n = byStatus.new || 0;
    const r = byStatus.review || 0;
    const d = byStatus.resolved || 0;

    document.getElementById('countNew').textContent = n;
    document.getElementById('countReview').textContent = r;
    document.getElementById('countResolved').textContent = d;
    document.getElementById('featureCount').textContent = filteredIncidents.length;
    document.getElementById('totalCases').textContent = filteredIncidents.length;

    if (pieChart) {
        pieChart.data.datasets[0].data = [n, r, d];
        pieChart.update();
    }
}

function initializeDashboard() {
    if (typeof Chart !== 'undefined') {
        const ctx = document.getElementById('casePieChart').getContext('2d');
        pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['New Cases', 'Under Review', 'Resolved'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [STATUS_COLORS.new, STATUS_COLORS.review, STATUS_COLORS.resolved],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: false,
                plugins: { legend: { display: false } }
            }
        });
    }
    updateStats();
}

document.addEventListener('DOMContentLoaded', initializeDashboard);

/* =====================================================
   REPORTS
   ===================================================== */
function fillList(elementId, counts, labelFn) {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    document.getElementById(elementId).innerHTML = entries.length
        ? entries.map(([k, v]) => '<li>' + (labelFn ? labelFn(k) : k) + ': ' + v + (v === 1 ? ' case' : ' cases') + '</li>').join('')
        : '<li>No cases match the current filters</li>';
}

function describeFilters() {
    const names = { region: 'Regions', concession: 'Concessions', type: 'Event types', status: 'Status' };
    const parts = [];
    FILTER_GROUPS.forEach(g => {
        const sel = getSelected(g);
        if (sel.length) {
            const shown = g === 'status' ? sel.map(s => STATUS_LABELS[s]) : sel;
            parts.push(names[g] + ': ' + shown.join(', '));
        }
    });
    return parts.length ? parts.join(' | ') : 'None (all regions, all event types)';
}

function previewReport() {
    const format = document.getElementById('exportFormat').value;
    document.getElementById('previewDate').textContent = new Date().toLocaleString();
    document.getElementById('previewType').textContent = format.toUpperCase() + ' Format';
    document.getElementById('previewFilters').textContent = describeFilters();

    const byStatus = countBy(filteredIncidents, 'status');
    document.getElementById('previewSummary').innerHTML =
        '<li>New Cases: ' + (byStatus.new || 0) + '</li>' +
        '<li>Under Review: ' + (byStatus.review || 0) + '</li>' +
        '<li>Resolved: ' + (byStatus.resolved || 0) + '</li>' +
        '<li>Total Cases: ' + filteredIncidents.length + '</li>';

    fillList('previewRegions', countBy(filteredIncidents, 'region'));
    fillList('previewTypes', countBy(filteredIncidents, 'type'));

    document.getElementById('previewModal').style.display = 'block';
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
}

function downloadReport() {
    const format = document.getElementById('exportFormat').value;
    closePreview();

    let message = '📁 Report Download Started\n\n';
    switch (format) {
        case 'pdf':
            message += '📄 PDF report with maps and charts\nOptimized for presentations';
            break;
        case 'html':
            message += '🌐 Interactive HTML report\nIncludes embedded maps';
            break;
        case 'csv':
            message += '📊 CSV data file\nReady for analysis in Excel';
            break;
        case 'xlsx':
            message += '📋 Excel spreadsheet\nFormatted with charts and tables';
            break;
    }
    message += '\n\n✅ File will be saved to Downloads folder\n🕒 Estimated time: 30 seconds';

    alert(message);
}

function generateRMSReport() {
    alert('📋 RMS Report Generation\n\nGenerating comprehensive report for UN meeting:\n\n✅ Regional incident summary\n✅ Trend analysis charts\n✅ Action recommendations\n✅ Maps for PowerPoint\n✅ Executive summary\n\nReport will be ready in 2 minutes.\nYou will be notified when complete.');
}

function submitQuickReport(event) {
    event.preventDefault();
    alert('✅ Incident Report Submitted Successfully!\n\nReport Details:\n• Report ID: FR-' + Math.floor(Math.random() * 10000) + '\n• Status: Under Review\n• Priority: High\n• Assigned to: Regional Coordinator\n\nYou will receive updates via the system.\nThank you for reporting this incident.');
}

/* =====================================================
   GLOBAL CLICK HANDLER
   (one handler for both: closing dropdowns and the modal)
   ===================================================== */
window.addEventListener('click', function (event) {
    // Close filter dropdowns when clicking anywhere outside them
    if (!event.target.closest('.dropdown')) {
        const dropdowns = document.getElementsByClassName('dropdown-content');
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].style.display = 'none';
        }
    }
    // Close the preview modal when clicking its dark background
    if (event.target === document.getElementById('previewModal')) {
        closePreview();
    }
});
