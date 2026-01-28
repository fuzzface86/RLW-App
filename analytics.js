// Analytics Dashboard System
class AnalyticsDashboard {
    constructor() {
        this.sales = [];
        this.events = [];
        this.inventory = [];
        this.charts = {};
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateEventFilter();
        this.calculateAnalytics();
    }

    loadData() {
        this.sales = JSON.parse(localStorage.getItem('posSales') || '[]');
        this.events = JSON.parse(localStorage.getItem('events') || '[]');
        this.inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
    }

    setupEventListeners() {
        document.getElementById('updateAnalytics').addEventListener('click', () => {
            this.calculateAnalytics();
        });

        document.getElementById('timePeriod').addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                document.getElementById('customDateRange').style.display = 'flex';
            } else {
                document.getElementById('customDateRange').style.display = 'none';
            }
        });

        // Set default dates
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('dateFrom').value = firstDay.toISOString().split('T')[0];
        document.getElementById('dateTo').value = today.toISOString().split('T')[0];
    }

    updateEventFilter() {
        const filter = document.getElementById('eventFilter');
        filter.innerHTML = '<option value="">All Events</option>' +
            this.events.map(event => 
                `<option value="${event.id}">${this.escapeHtml(event.name)}</option>`
            ).join('');
    }

    getFilteredSales() {
        const timePeriod = document.getElementById('timePeriod').value;
        const eventFilter = document.getElementById('eventFilter').value;
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;

        let filtered = [...this.sales];

        // Filter by event
        if (eventFilter) {
            filtered = filtered.filter(sale => sale.eventId === eventFilter);
        }

        // Filter by time period
        const now = new Date();
        let startDate = null;
        let endDate = new Date();

        switch (timePeriod) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                if (dateFrom) startDate = new Date(dateFrom);
                if (dateTo) endDate = new Date(dateTo + 'T23:59:59');
                break;
        }

        if (startDate) {
            filtered = filtered.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            });
        }

        return filtered;
    }

    calculateAnalytics() {
        const filteredSales = this.getFilteredSales();
        
        // Calculate metrics
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalSalesCount = filteredSales.length;
        const averageSale = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

        // Calculate profit
        const eventCosts = this.calculateEventCosts(filteredSales);
        const totalProfit = totalRevenue - eventCosts;
        const roi = eventCosts > 0 ? ((totalProfit / eventCosts) * 100) : 0;

        // Find best event
        const eventRevenue = this.getEventRevenue(filteredSales);
        const bestEvent = eventRevenue.length > 0 ? 
            eventRevenue.sort((a, b) => b.revenue - a.revenue)[0] : null;

        // Update UI
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('totalProfit').textContent = `$${totalProfit.toFixed(2)}`;
        document.getElementById('averageSale').textContent = `$${averageSale.toFixed(2)}`;
        document.getElementById('totalSalesCount').textContent = totalSalesCount;
        document.getElementById('roi').textContent = `${roi.toFixed(1)}%`;
        document.getElementById('bestEvent').textContent = bestEvent ? bestEvent.name : '-';

        // Calculate changes (simplified - compare to previous period)
        this.calculateChanges(filteredSales);

        // Update charts
        this.updateCharts(filteredSales);

        // Generate insights
        this.generateInsights(filteredSales);

        // Event profitability
        this.renderEventProfitability(filteredSales);
    }

    calculateEventCosts(sales) {
        const eventIds = [...new Set(sales.map(s => s.eventId).filter(Boolean))];
        let totalCosts = 0;

        eventIds.forEach(eventId => {
            const event = this.events.find(e => e.id === eventId);
            if (event) {
                totalCosts += (event.tableCost || 0) + (event.otherCosts || 0);
            }
        });

        return totalCosts;
    }

    getEventRevenue(sales) {
        const eventRevenue = {};
        
        sales.forEach(sale => {
            if (sale.eventId) {
                if (!eventRevenue[sale.eventId]) {
                    const event = this.events.find(e => e.id === sale.eventId);
                    eventRevenue[sale.eventId] = {
                        id: sale.eventId,
                        name: event ? event.name : 'Unknown Event',
                        revenue: 0,
                        sales: 0
                    };
                }
                eventRevenue[sale.eventId].revenue += sale.total;
                eventRevenue[sale.eventId].sales += 1;
            }
        });

        return Object.values(eventRevenue);
    }

    calculateChanges(filteredSales) {
        // Simplified change calculation
        // In production, compare to previous period
        document.getElementById('revenueChange').textContent = '';
        document.getElementById('profitChange').textContent = '';
        document.getElementById('avgSaleChange').textContent = '';
        document.getElementById('salesCountChange').textContent = '';
    }

    updateCharts(sales) {
        this.updateRevenueChart(sales);
        this.updateEventRevenueChart(sales);
        this.updateProductsChart(sales);
    }

    updateRevenueChart(sales) {
        const ctx = document.getElementById('revenueChart');
        
        // Group sales by date
        const dailyRevenue = {};
        sales.forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString();
            dailyRevenue[date] = (dailyRevenue[date] || 0) + sale.total;
        });

        const dates = Object.keys(dailyRevenue).sort();
        const revenues = dates.map(date => dailyRevenue[date]);

        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Revenue',
                    data: revenues,
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
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
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    updateEventRevenueChart(sales) {
        const ctx = document.getElementById('eventRevenueChart');
        const eventRevenue = this.getEventRevenue(sales);
        
        const sortedEvents = eventRevenue.sort((a, b) => b.revenue - a.revenue).slice(0, 10);

        if (this.charts.eventRevenue) {
            this.charts.eventRevenue.destroy();
        }

        this.charts.eventRevenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedEvents.map(e => e.name.length > 20 ? e.name.substring(0, 20) + '...' : e.name),
                datasets: [{
                    label: 'Revenue',
                    data: sortedEvents.map(e => e.revenue),
                    backgroundColor: 'rgba(37, 99, 235, 0.8)'
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
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    updateProductsChart(sales) {
        const ctx = document.getElementById('productsChart');
        
        // Count product sales
        const productSales = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.name].quantity += item.quantity;
                productSales[item.name].revenue += item.total;
            });
        });

        const sortedProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        if (this.charts.products) {
            this.charts.products.destroy();
        }

        this.charts.products = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
                datasets: [{
                    data: sortedProducts.map(p => p.revenue),
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(249, 115, 22, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    generateInsights(sales) {
        const insights = [];
        
        if (sales.length === 0) {
            insights.push('<strong>No sales data</strong> - Start making sales to see insights!');
            document.getElementById('insightsList').innerHTML = insights.map(i => `<li>${i}</li>`).join('');
            return;
        }

        // Revenue insights
        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const avgSale = totalRevenue / sales.length;
        
        if (avgSale > 50) {
            insights.push(`<strong>Great average sale!</strong> Your average transaction is $${avgSale.toFixed(2)}, which is excellent.`);
        } else if (avgSale < 20) {
            insights.push(`<strong>Consider upselling:</strong> Your average sale is $${avgSale.toFixed(2)}. Try bundling products or suggesting add-ons.`);
        }

        // Event insights
        const eventRevenue = this.getEventRevenue(sales);
        if (eventRevenue.length > 0) {
            const bestEvent = eventRevenue.sort((a, b) => b.revenue - a.revenue)[0];
            insights.push(`<strong>Best performing event:</strong> "${bestEvent.name}" generated $${bestEvent.revenue.toFixed(2)} in revenue.`);
        }

        // Product insights
        const productSales = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
            });
        });

        const topProduct = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topProduct) {
            insights.push(`<strong>Top seller:</strong> "${topProduct[0]}" with ${topProduct[1]} units sold. Consider stocking more!`);
        }

        // Profitability
        const eventCosts = this.calculateEventCosts(sales);
        const profit = totalRevenue - eventCosts;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;

        if (profitMargin > 50) {
            insights.push(`<strong>Excellent profitability!</strong> Your profit margin is ${profitMargin.toFixed(1)}%.`);
        } else if (profitMargin < 20) {
            insights.push(`<strong>Review costs:</strong> Your profit margin is ${profitMargin.toFixed(1)}%. Consider reducing event costs or increasing prices.`);
        }

        // Time-based insights
        const hourlySales = {};
        sales.forEach(sale => {
            const hour = new Date(sale.date).getHours();
            hourlySales[hour] = (hourlySales[hour] || 0) + sale.total;
        });

        const bestHour = Object.entries(hourlySales)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (bestHour) {
            const hourLabel = bestHour[0] < 12 ? `${bestHour[0]}:00 AM` : 
                            bestHour[0] === 12 ? '12:00 PM' : 
                            `${bestHour[0] - 12}:00 PM`;
            insights.push(`<strong>Peak sales hour:</strong> ${hourLabel} is your best performing time.`);
        }

        document.getElementById('insightsList').innerHTML = insights.map(i => `<li>${i}</li>`).join('');
    }

    renderEventProfitability(sales) {
        const eventRevenue = this.getEventRevenue(sales);
        const table = document.getElementById('eventProfitabilityTable');
        
        if (eventRevenue.length === 0) {
            table.innerHTML = '<p style="color: var(--text-secondary);">No event data available.</p>';
            return;
        }

        const rows = eventRevenue.map(eventRev => {
            const event = this.events.find(e => e.id === eventRev.id);
            const costs = (event ? (event.tableCost || 0) + (event.otherCosts || 0) : 0);
            const profit = eventRev.revenue - costs;
            const roi = costs > 0 ? ((profit / costs) * 100) : 0;
            const profitMargin = eventRev.revenue > 0 ? (profit / eventRev.revenue * 100) : 0;

            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 12px;"><strong>${this.escapeHtml(eventRev.name)}</strong></td>
                    <td style="padding: 12px; text-align: right;">$${eventRev.revenue.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right;">$${costs.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; color: ${profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">
                        <strong>$${profit.toFixed(2)}</strong>
                    </td>
                    <td style="padding: 12px; text-align: right;">${profitMargin.toFixed(1)}%</td>
                    <td style="padding: 12px; text-align: right;">${roi.toFixed(1)}%</td>
                </tr>
            `;
        }).join('');

        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); background: #f8f9fa;">
                        <th style="padding: 12px; text-align: left;">Event</th>
                        <th style="padding: 12px; text-align: right;">Revenue</th>
                        <th style="padding: 12px; text-align: right;">Costs</th>
                        <th style="padding: 12px; text-align: right;">Profit</th>
                        <th style="padding: 12px; text-align: right;">Margin</th>
                        <th style="padding: 12px; text-align: right;">ROI</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let analyticsDashboard;
document.addEventListener('DOMContentLoaded', () => {
    analyticsDashboard = new AnalyticsDashboard();
});
