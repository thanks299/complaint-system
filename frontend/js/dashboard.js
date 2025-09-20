// Dashboard-specific functionality
class DashboardManager {
    constructor() {
        this.charts = {};
        this.stats = {};
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

        // Real-time updates toggle
        const realtimeToggle = document.getElementById('realtimeToggle');
        if (realtimeToggle) {
            realtimeToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            });
        }

        // Chart type toggle
        const chartTypeToggle = document.getElementById('chartTypeToggle');
        if (chartTypeToggle) {
            chartTypeToggle.addEventListener('change', (e) => {
                this.updateChartType(e.target.value);
            });
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Load statistics
            const stats = await api.getComplaintStats();
            this.stats = stats;
            this.updateStatsCards(stats);

            // Load recent complaints
            const recentComplaints = await api.getComplaints({ limit: 5 });
            this.updateRecentComplaints(recentComplaints);

            // Load charts data
            this.updateCharts(stats);

            // Load additional dashboard data
            const dashboardData = await api.getDashboardData();
            this.updateAdditionalMetrics(dashboardData);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            app.showToast(api.handleError(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateStatsCards(stats) {
        const cards = {
            totalComplaints: stats.total || 0,
            openComplaints: stats.open || 0,
            inProgressComplaints: stats.inProgress || 0,
            resolvedComplaints: stats.resolved || 0
        };

        Object.keys(cards).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                this.animateNumber(element, cards[key]);
            }
        });
    }

    animateNumber(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000; // 1 second
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updateCharts(stats) {
        this.updateStatusChart(stats);
        this.updatePriorityChart(stats);
        this.updateTrendChart(stats);
    }

    updateStatusChart(stats) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }

        this.charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
                datasets: [{
                    data: [
                        stats.open || 0,
                        stats.inProgress || 0,
                        stats.resolved || 0,
                        stats.closed || 0
                    ],
                    backgroundColor: [
                        '#ffc107',
                        '#0dcaf0',
                        '#198754',
                        '#6c757d'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000
                }
            }
        });
    }

    updatePriorityChart(stats) {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.priorityChart) {
            this.charts.priorityChart.destroy();
        }

        this.charts.priorityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Low', 'Medium', 'High', 'Urgent'],
                datasets: [{
                    label: 'Complaints by Priority',
                    data: [
                        stats.priorityLow || 0,
                        stats.priorityMedium || 0,
                        stats.priorityHigh || 0,
                        stats.priorityUrgent || 0
                    ],
                    backgroundColor: [
                        '#28a745',
                        '#ffc107',
                        '#fd7e14',
                        '#dc3545'
                    ],
                    borderWidth: 1,
                    borderColor: '#fff',
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    updateTrendChart(stats) {
        // This would show trends over time
        // For now, we'll create a simple line chart if the element exists
        const ctx = document.getElementById('trendChart');
        if (!ctx || !stats.trendData) return;

        if (this.charts.trendChart) {
            this.charts.trendChart.destroy();
        }

        this.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stats.trendData.labels || [],
                datasets: [{
                    label: 'Complaints Over Time',
                    data: stats.trendData.data || [],
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateRecentComplaints(complaints) {
        const tbody = document.getElementById('recentComplaintsTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (complaints.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                        No recent complaints
                    </td>
                </tr>
            `;
            return;
        }

        complaints.forEach(complaint => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="badge bg-light text-dark">#${complaint.id}</span>
                </td>
                <td>
                    <div class="text-truncate-2" title="${complaint.title}">
                        ${complaint.title}
                    </div>
                </td>
                <td>
                    <span class="badge badge-status-${complaint.status}">
                        ${complaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                </td>
                <td>
                    <span class="badge badge-priority-${complaint.priority}">
                        ${complaint.priority.toUpperCase()}
                    </span>
                </td>
                <td>
                    <small class="text-muted">
                        ${this.formatDate(complaint.created_at)}
                    </small>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="app.viewComplaint(${complaint.id})" 
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" 
                                onclick="app.editComplaint(${complaint.id})" 
                                title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateAdditionalMetrics(dashboardData) {
        // Update any additional metrics like response time, satisfaction score, etc.
        if (dashboardData.averageResponseTime) {
            const element = document.getElementById('avgResponseTime');
            if (element) {
                element.textContent = `${dashboardData.averageResponseTime} hours`;
            }
        }

        if (dashboardData.satisfactionScore) {
            const element = document.getElementById('satisfactionScore');
            if (element) {
                element.textContent = `${dashboardData.satisfactionScore}%`;
            }
        }

        if (dashboardData.slaCompliance) {
            const element = document.getElementById('slaCompliance');
            if (element) {
                element.textContent = `${dashboardData.slaCompliance}%`;
            }
        }
    }

    updateChartType(type) {
        // Switch between different chart types (bar, line, pie, etc.)
        Object.keys(this.charts).forEach(chartName => {
            if (this.charts[chartName]) {
                this.charts[chartName].config.type = type;
                this.charts[chartName].update();
            }
        });
    }

    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear any existing interval
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('dashboardLoading');
        if (loadingElement) {
            if (show) {
                loadingElement.classList.remove('d-none');
            } else {
                loadingElement.classList.add('d-none');
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            const diffInHoursRounded = Math.floor(diffInHours);
            return `${diffInHoursRounded}h ago`;
        } else if (diffInHours < 168) { // 7 days
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Export dashboard data
    async exportDashboardData(format = 'pdf') {
        try {
            const response = await api.exportComplaints(format, {
                includeCharts: true,
                includeStats: true
            });
            
            // Create download link
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            app.showToast('Dashboard data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting dashboard data:', error);
            app.showToast('Error exporting dashboard data', 'error');
        }
    }

    // Print dashboard
    printDashboard() {
        window.print();
    }

    // Destroy charts when leaving dashboard
    destroy() {
        this.stopAutoRefresh();
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Create global dashboard manager instance
const dashboardManager = new DashboardManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}
