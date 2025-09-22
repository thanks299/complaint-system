// This script will fetch and display all complaints for the admin dashboard
// For now, we'll use a placeholder array. Replace with backend fetch later.
document.addEventListener('DOMContentLoaded', function() {
        const tbody = document.querySelector('#complaintsTable tbody');
        const searchInput = document.getElementById('searchInput');
        let allComplaints = [];

        function renderComplaints(complaints) {
            tbody.innerHTML = '';
            if (complaints.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;">No complaints found.</td></tr>';
                return;
            }
            complaints.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.id || ''}</td>
                    <td>${c.name || ''}</td>
                    <td>${c.matric || ''}</td>
                    <td>${c.email || ''}</td>
                    <td>${c.department || ''}</td>
                    <td>${c.title || ''}</td>
                    <td>${c.details || ''}</td>
                    <td>${c.status || 'Pending'}</td>
                    <td>
                        <button class="status-btn" ${c.status === 'Resolved' ? 'disabled' : ''} data-id="${c.id}">${c.status === 'Resolved' ? 'Resolved' : 'Mark as Resolved'}</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function fetchAndRenderComplaints() {
              fetch(getApiUrl('COMPLAINTS'), {
                .then(res => res.json())
                .then(complaints => {
                    allComplaints = complaints;
                    renderComplaints(complaints);
                })
                .catch(() => {
                    tbody.innerHTML = '<tr><td colspan="6">Failed to load complaints</td></tr>';
                });
        }

        // Search/filter
        searchInput.addEventListener('input', function() {
            const q = this.value.toLowerCase();
            const filtered = allComplaints.filter(c =>
                (c.title || '').toLowerCase().includes(q) ||
                (c.description || c.details || '').toLowerCase().includes(q) ||
                (c.user || c.email || '').toLowerCase().includes(q)
            );
            renderComplaints(filtered);
        });

        // Mark as resolved (demo: only updates UI, not backend)
        tbody.addEventListener('click', function(e) {
            if (e.target.classList.contains('status-btn')) {
                const id = e.target.getAttribute('data-id');
                allComplaints = allComplaints.map(c => {
                    if (String(c.id) === String(id)) {
                        return { ...c, status: 'Resolved' };
                    }
                    return c;
                });
                renderComplaints(allComplaints);
            }
        });

        fetchAndRenderComplaints();

        document.getElementById('logoutBtn').onclick = function() {
            localStorage.clear();
            window.location.href = 'index.html';
        };
});