/**
 * Analytics Controller for the NACOS Complaint System
 * Handles data visualization, reporting, and analytics features
 */
class AnalyticsController {
    constructor() {
        this.initialized = false;
        this.charts = {};
        this.filterData = {
            timeRange: '30', // Default to 30 days
            complaintType: 'all',
            status: 'all'
        };
        
        // Chart configuration defaults
        this.chartDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    padding: 12,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        family: "'Inter', sans-serif",
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: "'Inter', sans-serif",
                        size: 13
                    },
                    displayColors: true,
                    caretSize: 6
                }
            }
        };
        
        // Colors for charts
        this.chartColors = {
            primary: '#4361ee',
            secondary: '#3f37c9',
            success: '#4cc9f0',
            info: '#4895ef',
            warning: '#f72585',
            danger: '#e63946',
            light: '#f8f9fa',
            dark: '#212529',
            statusColors: {
                pending: '#f72585',
                in_progress: '#4895ef',
                resolved: '#4cc9f0',
                closed: '#6c757d'
            },
            typeColors: {
                Academic: '#4361ee',
                Technical: '#3f37c9',
                Administrative: '#4cc9f0',
                Financial: '#4895ef',
                Other: '#6c757d'
            }
        };
        
        // Listen for section changes
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.section === 'analytics') {
                this.initializeAnalytics();
            }
        });
    }
    
    /**
     * Initialize analytics when the section is loaded
     */
    async initializeAnalytics() {
        try {
            // Show loading state
            this.showLoading(true);
            
            // Only load required scripts once
            if (!this.initialized) {
                await this.loadDependencies();
                this.initialized = true;
            }
            
            // Fetch analytics data
            const analyticsData = await this.fetchAnalyticsData();
            
            // Render the analytics dashboard
            this.renderDashboard(analyticsData);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Hide loading state
            this.showLoading(false);
            
            console.log('✅ Analytics initialized');
        } catch (error) {
            console.error('❌ Error initializing analytics:', error);
            this.showError('Failed to load analytics. Please try again.');
            this.showLoading(false);
        }
    }
    
    /**
     * Load external dependencies (Chart.js)
     */
    async loadDependencies() {
        return new Promise((resolve, reject) => {
            // Check if Chart.js is already loaded
            if (window.Chart) {
                resolve();
                return;
            }
            
            // Load Chart.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.integrity = 'sha256-+8RZJua0aEWg+QVVKg4LEzEEm/8RFez5Tb4JBNiV5xA=';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Chart.js'));
            document.head.appendChild(script);
            
            console.log('📊 Loading Chart.js...');
        });
    }
    
    /**
     * Fetch analytics data from API
     */
    async fetchAnalyticsData() {
        try {
            const params = {
                timeRange: this.filterData.timeRange,
                type: this.filterData.complaintType !== 'all' ? this.filterData.complaintType : undefined,
                status: this.filterData.status !== 'all' ? this.filterData.status : undefined
            };
            
            return await api.getAnalyticsData(params);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            throw error;
        }
    }
    
    /**
     * Render the analytics dashboard with data
     */
    renderDashboard(data) {
        // Update metrics
        this.updateMetrics(data.metrics);
        
        // Create/update charts matching the analytics.html element IDs
        this.createComplaintsTrendChart(data.trends);
        this.createStatusDistributionChart(data.byStatus);
        this.createTypesChart(data.byType);
        this.createResolutionTimeChart(data.resolutionTimes);
    }
    
    /**
     * Set up event listeners for analytics controls
     */
    setupEventListeners() {
        // Time range selector
        const timeRangeSelector = document.getElementById('time-range');
        if (timeRangeSelector) {
            timeRangeSelector.addEventListener('change', () => {
                this.filterData.timeRange = timeRangeSelector.value;
                this.refreshAnalytics();
            });
        }
        
        // Generate report button
        const reportBtn = document.querySelector('[data-action="generate-report"]');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                this.showReportModal();
            });
        }
        
        // Export chart buttons
        document.querySelectorAll('[data-action="export-chart"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find closest chart card to determine which chart to export
                const chartCard = e.target.closest('.chart-card');
                if (chartCard) {
                    const chartCanvas = chartCard.querySelector('canvas');
                    if (chartCanvas) {
                        this.exportChart(chartCanvas, chartCard.querySelector('h3').innerText);
                    }
                }
            });
        });
    }
    
    /**
     * Refresh analytics data and update charts
     */
    async refreshAnalytics() {
        try {
            this.showLoading(true);
            
            // Fetch updated data with filters
            const data = await this.fetchAnalyticsData();
            
            // Update all visualizations
            this.renderDashboard(data);
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error refreshing analytics:', error);
            this.showError('Failed to refresh analytics data');
            this.showLoading(false);
        }
    }
    
    /**
     * Update metrics displayed in the analytics summary
     */
    updateMetrics(metrics) {
        // Update average resolution time
        const avgResolutionTimeEl = document.getElementById('avg-resolution-time');
        if (avgResolutionTimeEl && metrics.avgResolutionTime) {
            avgResolutionTimeEl.textContent = metrics.avgResolutionTime;
        }
        
        // Update resolution rate
        const resolutionRateEl = document.getElementById('resolution-rate');
        if (resolutionRateEl && metrics.resolutionRate) {
            this.animateCounter(resolutionRateEl, parseFloat(resolutionRateEl.textContent) || 0, metrics.resolutionRate, '%');
        }
        
        // Update satisfaction score
        const satisfactionScoreEl = document.getElementById('satisfaction-score');
        if (satisfactionScoreEl && metrics.satisfactionScore) {
            satisfactionScoreEl.textContent = metrics.satisfactionScore;
        }
    }
    
    /**
     * Create or update complaints trend chart
     * Matches the complaints-trend-chart element in analytics.html
     */
    createComplaintsTrendChart(trendsData) {
        const ctx = document.getElementById('complaints-trend-chart');
        if (!ctx) return;
        
        // Prepare data
        const labels = trendsData.labels;
        const datasets = [
            {
                label: 'New Complaints',
                data: trendsData.newComplaints,
                backgroundColor: this.chartColors.primary,
                borderColor: this.chartColors.primary,
                tension: 0.3,
                fill: false
            },
            {
                label: 'Resolved Complaints',
                data: trendsData.resolvedComplaints,
                backgroundColor: this.chartColors.success,
                borderColor: this.chartColors.success,
                tension: 0.3,
                fill: false
            }
        ];
        
        // Create or update chart
        if (this.charts.trendChart) {
            this.charts.trendChart.data.labels = labels;
            this.charts.trendChart.data.datasets = datasets;
            this.charts.trendChart.update();
        } else {
            this.charts.trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    ...this.chartDefaults,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Create or update status distribution chart
     * Matches the status-distribution-chart element in analytics.html
     */
    createStatusDistributionChart(statusData) {
        const ctx = document.getElementById('status-distribution-chart');
        if (!ctx) return;
        
        // Prepare colors for each status
        const backgroundColors = statusData.labels.map(label => 
            this.chartColors.statusColors[label.toLowerCase().replace(' ', '_')] || this.getRandomColor()
        );
        
        // Create or update chart
        if (this.charts.statusChart) {
            this.charts.statusChart.data.labels = statusData.labels;
            this.charts.statusChart.data.datasets[0].data = statusData.counts;
            this.charts.statusChart.data.datasets[0].backgroundColor = backgroundColors;
            this.charts.statusChart.update();
        } else {
            this.charts.statusChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: statusData.labels,
                    datasets: [{
                        data: statusData.counts,
                        backgroundColor: backgroundColors,
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: this.chartDefaults
            });
        }
    }
    
    /**
     * Create or update complaint types chart
     * Matches the types-chart element in analytics.html
     */
    createTypesChart(typeData) {
        const ctx = document.getElementById('types-chart');
        if (!ctx) return;
        
        // Prepare colors for each type
        const backgroundColors = typeData.labels.map(label => 
            this.chartColors.typeColors[label] || this.getRandomColor()
        );
        
        // Create or update chart
        if (this.charts.typeChart) {
            this.charts.typeChart.data.labels = typeData.labels;
            this.charts.typeChart.data.datasets[0].data = typeData.counts;
            this.charts.typeChart.data.datasets[0].backgroundColor = backgroundColors;
            this.charts.typeChart.update();
        } else {
            this.charts.typeChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: typeData.labels,
                    datasets: [{
                        data: typeData.counts,
                        backgroundColor: backgroundColors,
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: {
                    ...this.chartDefaults,
                    cutout: '60%'
                }
            });
        }
    }

    
    
    /**
     * Create or update resolution time chart
     * Matches the resolution-time-chart element in analytics.html
     */
    createResolutionTimeChart(resolutionData) {
        const ctx = document.getElementById('resolution-time-chart');
        if (!ctx) return;
        
        // Create or update chart
        if (this.charts.resolutionChart) {
            this.charts.resolutionChart.data.labels = resolutionData.labels;
            this.charts.resolutionChart.data.datasets[0].data = resolutionData.times;
            this.charts.resolutionChart.update();
        } else {
            // Different colors for each priority level
            const priorityColors = {
                'Low': '#4cc9f0',
                'Medium': '#4895ef', 
                'High': '#f72585',
                'Urgent': '#e63946'
            };
            
            this.charts.resolutionChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: resolutionData.labels,
                    datasets: [{
                        label: 'Average Hours',
                        data: resolutionData.times,
                        backgroundColor: resolutionData.labels.map(label => 
                            priorityColors[label] || this.getRandomColor()
                        ),
                        borderWidth: 0,
                        borderRadius: 4
                    }]
                },
                options: {
                    ...this.chartDefaults,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Hours'
                            }
                        }
                    }
                }
            });
        }
    }


    /**
     * Create top issues table
     * @param {Array} issuesData - Array of top issue data
     */
    createTopIssuesTable(issuesData) {
        const tableContainer = document.getElementById('top-issues-table');
        if (!tableContainer) return;
    
        let tableHTML = `
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Issue</th>
                        <th>Category</th>
                        <th>Frequency</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
            <tbody>
        `;
    
        // Calculate total for percentage
        const total = issuesData.reduce((sum, issue) => sum + issue.count, 0);
    
        // Add rows for each issue
        issuesData.forEach(issue => {
            const percentage = ((issue.count / total) * 100).toFixed(1);
            tableHTML += `
                <tr>
                    <td>${issue.title}</td>
                    <td>${issue.category}</td>
                    <td>${issue.count}</td>
                    <td>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${percentage}%"></div>
                            <span class="progress-text">${percentage}%</span>
                        </div>
                    </td>
                </tr>
            `;
        });
    
        tableHTML += '</tbody></table>';
        tableContainer.innerHTML = tableHTML;
    }

    /**
     * Initialize custom date picker
     */
    initDateRangePicker() {
        const customRangeToggle = document.getElementById('custom-range-toggle');
        const customDateContainer = document.getElementById('custom-date-container');
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const applyDateBtn = document.getElementById('apply-date-range');
    
        if (!customRangeToggle) return;
    
        // Toggle custom date range inputs
        customRangeToggle.addEventListener('change', () => {
            if (customRangeToggle.checked) {
                customDateContainer.classList.add('active');
            } else {
                customDateContainer.classList.remove('active');
            }
        });
    
        // Apply custom date range
        if (applyDateBtn) {
            applyDateBtn.addEventListener('click', () => {
                if (!startDateInput.value || !endDateInput.value) {
                    this.showError('Please select both start and end dates');
                    return;
                }
            
                this.filterData.startDate = startDateInput.value;
                this.filterData.endDate = endDateInput.value;
                this.filterData.timeRange = 'custom';
                this.refreshAnalytics();
            });
        }
    }


    
    /**
     * Export chart as image
     */
    exportChart(chartCanvas, chartTitle) {
        try {
            const link = document.createElement('a');
            link.download = `${chartTitle.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
            link.href = chartCanvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error exporting chart:', error);
            this.showError('Failed to export chart');
        }
    }


    
    
    /**
     * Show report generation modal
     */
    showReportModal() {
        Swal.fire({
            title: 'Generate Report',
            html: `
                <form id="report-form">
                    <div class="form-group">
                        <label for="report-type">Report Type</label>
                        <select id="report-type" class="swal2-select">
                            <option value="complete">Complete Analytics</option>
                            <option value="complaints">Complaints Summary</option>
                            <option value="resolution">Resolution Times</option>
                            <option value="trends">Trend Analysis</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="report-format">Format</label>
                        <select id="report-format" class="swal2-select">
                            <option value="pdf">PDF Document</option>
                            <option value="excel">Excel Spreadsheet</option>
                            <option value="csv">CSV File</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="report-period">Time Period</label>
                        <select id="report-period" class="swal2-select">
                            <option value="7">Last 7 Days</option>
                            <option value="30" selected>Last 30 Days</option>
                            <option value="90">Last 3 Months</option>
                            <option value="365">Last 12 Months</option>
                        </select>
                    </div>
                </form>
            `,
            showCancelButton: true,
            confirmButtonText: 'Generate',
            preConfirm: () => {
                const reportType = document.getElementById('report-type').value;
                const reportFormat = document.getElementById('report-format').value;
                const period = document.getElementById('report-period').value;
                
                return { type: reportType, format: reportFormat, period };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.generateReport(result.value);
            }
        });
    }
    
    /**
     * Generate analytics report
     */
    async generateReport(reportConfig) {
        try {
            // Show loading state
            Swal.fire({
                title: 'Generating Report',
                text: 'Please wait while we generate your report...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Call API to generate report
            const result = await api.generateReport(reportConfig.format, {
                type: reportConfig.type,
                period: reportConfig.period
            });
            
            // Show success with download link
            Swal.fire({
                icon: 'success',
                title: 'Report Generated',
                html: `
                    <p>Your report has been generated successfully!</p>
                    <a href="${result.downloadUrl}" class="download-link" target="_blank">
                        <i class="fas fa-download"></i> Download Report
                    </a>
                `,
                confirmButtonText: 'Close'
            });
        } catch (error) {
            console.error('Error generating report:', error);
            Swal.fire({
                icon: 'error',
                title: 'Report Generation Failed',
                text: 'There was an error generating your report. Please try again.'
            });
        }
    }
    
    /**
     * Animate counter from start value to end value
     */
    animateCounter(element, start, end, suffix = '') {
        const duration = 1000;
        const frameDuration = 1000 / 60;
        const totalFrames = Math.round(duration / frameDuration);
        const easeOutQuad = t => t * (2 - t);
        
        let frame = 0;
        const countTo = parseFloat(end);
        
        const counter = setInterval(() => {
            frame++;
            const progress = easeOutQuad(frame / totalFrames);
            const currentCount = countTo * progress;
            
            const formatted = Number.isInteger(currentCount) ? 
                currentCount.toFixed(0) : 
                currentCount.toFixed(1);
            
            element.textContent = formatted + suffix;
            
            if (frame === totalFrames) {
                clearInterval(counter);
                element.textContent = end + suffix;
            }
        }, frameDuration);
    }
    

    /**
     * Export all analytics data
     */
    exportAllData() {
        Swal.fire({
            title: 'Export Analytics Data',
            html: `
                <p>Choose export format:</p>
                <div class="export-options">
                    <button class="export-btn" data-format="csv">
                        <i class="fas fa-file-csv"></i> CSV
                    </button>
                    <button class="export-btn" data-format="excel">
                        <i class="fas fa-file-excel"></i> Excel
                    </button>
                    <button class="export-btn" data-format="json">
                        <i class="fas fa-file-code"></i> JSON
                    </button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: () => {
                document.querySelectorAll('.export-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const format = btn.getAttribute('data-format');
                        await this.processDataExport(format);
                        Swal.close();
                    });
                });
            }
        });
    }
    /**
     * Process data export in selected format
     */
    async processDataExport(format) {
        try {
            // Show loading
            Swal.fire({
                title: 'Exporting Data',
                text: 'Preparing your data for export...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        
            // Call API to generate export
            const result = await api.exportAnalyticsData(format, {
                timeRange: this.filterData.timeRange,
                startDate: this.filterData.startDate,
                endDate: this.filterData.endDate
            });
        
            // Show success with download link
            Swal.fire({
                icon: 'success',
                title: 'Export Ready',
                html: `
                    <p>Your data export is ready!</p>
                    <a href="${result.downloadUrl}" class="download-link" target="_blank">
                        <i class="fas fa-download"></i> Download ${format.toUpperCase()} File
                    </a>
                `,
                confirmButtonText: 'Close'
            });
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'There was an error exporting your data. Please try again.'
            });
        }
    }

    /**
     * Generate a random color for chart elements
     */
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    
    /**
     * Show loading indicator
     */
    showLoading(show) {
        if (show) {
            const loadingEl = document.querySelector('.analytics-loading') || 
                this.createLoadingElement();
            loadingEl.classList.add('active');
        } else {
            const loadingEl = document.querySelector('.analytics-loading');
            if (loadingEl) {
                loadingEl.classList.remove('active');
            }
        }
    }
    
    /**
     * Create loading indicator element
     */
    createLoadingElement() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'analytics-loading';
        loadingEl.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
            <p>Loading analytics data...</p>
        `;
        
        const container = document.querySelector('.content-wrapper') || document.body;
        container.appendChild(loadingEl);
        
        return loadingEl;
    }
    
    /**
     * Show error message
     */
    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }
}

// Initialize when the page content has loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined') {
        window.initializeAnalytics = function() {
            // Only initialize if not already initialized
            if (!window.analyticsController) {
                console.log('📊 Initializing Analytics Controller');
                window.analyticsController = new AnalyticsController();
                
                // If we're already on the analytics section, initialize it
                if (document.querySelector('.section-title')?.textContent.includes('Analytics')) {
                    window.analyticsController.initializeAnalytics();
                }
            }
            return window.analyticsController;
        };
        
        // Initialize analytics controller
        window.initializeAnalytics();
    }
});