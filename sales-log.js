// Sales Log System
class SalesLog {
    constructor() {
        this.sales = this.loadSales();
        this.events = this.loadEvents();
        this.filteredSales = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateEventFilter();
        this.renderTable();
        this.updateStats();
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.applyFilters();
        });
        document.getElementById('eventFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('dateFromFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('dateToFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('eventFilter').value = '';
            document.getElementById('dateFromFilter').value = '';
            document.getElementById('dateToFilter').value = '';
            this.applyFilters();
        });
        document.getElementById('exportSalesBtn').addEventListener('click', () => {
            this.exportToCSV();
        });
        document.querySelector('.close').addEventListener('click', () => {
            this.closeSaleModal();
        });
        document.getElementById('closeSaleModalBtn').addEventListener('click', () => {
            this.closeSaleModal();
        });
        document.getElementById('printSaleBtn').addEventListener('click', () => {
            this.printSaleReceipt();
        });
        document.getElementById('reverseSaleFromModalBtn').addEventListener('click', () => {
            if (this.currentSale) {
                this.closeSaleModal();
                this.confirmReverseSale(this.currentSale.saleNumber);
            }
        });
        document.getElementById('cancelReverseBtn').addEventListener('click', () => {
            this.closeReverseModal();
        });
        document.querySelector('.reverse-close').addEventListener('click', () => {
            this.closeReverseModal();
        });
        document.getElementById('confirmReverseBtn').addEventListener('click', () => {
            this.reverseSale();
        });

        window.addEventListener('click', (e) => {
            if (e.target.id === 'saleModal') {
                this.closeSaleModal();
            }
            if (e.target.id === 'reverseSaleModal') {
                this.closeReverseModal();
            }
        });
    }

    loadSales() {
        const stored = localStorage.getItem('posSales');
        return stored ? JSON.parse(stored) : [];
    }

    loadEvents() {
        const stored = localStorage.getItem('events');
        return stored ? JSON.parse(stored) : [];
    }

    getEventName(eventId) {
        if (!eventId) return 'No Event';
        const event = this.events.find(e => e.id === eventId);
        return event ? event.name : 'Unknown Event';
    }

    updateEventFilter() {
        const filter = document.getElementById('eventFilter');
        filter.innerHTML = '<option value="">All Events</option>' +
            this.events.map(event => 
                `<option value="${event.id}">${this.escapeHtml(event.name)}</option>`
            ).join('');
    }

    applyFilters() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const eventFilter = document.getElementById('eventFilter').value;
        const dateFrom = document.getElementById('dateFromFilter').value;
        const dateTo = document.getElementById('dateToFilter').value;

        this.filteredSales = this.sales.filter(sale => {
            const matchesSearch = !searchQuery || 
                sale.saleNumber.toString().includes(searchQuery) ||
                sale.items.some(item => 
                    item.name.toLowerCase().includes(searchQuery) ||
                    item.sku.toLowerCase().includes(searchQuery)
                ) ||
                this.getEventName(sale.eventId).toLowerCase().includes(searchQuery);

            const matchesEvent = !eventFilter || sale.eventId === eventFilter;

            const saleDate = new Date(sale.date);
            const matchesDateFrom = !dateFrom || saleDate >= new Date(dateFrom);
            const matchesDateTo = !dateTo || saleDate <= new Date(dateTo + 'T23:59:59');

            return matchesSearch && matchesEvent && matchesDateFrom && matchesDateTo;
        });

        // Sort by date (most recent first)
        this.filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date));

        this.renderTable();
        this.updateStats();
    }

    renderTable() {
        const tbody = document.getElementById('salesTableBody');
        const salesToShow = this.filteredSales.length > 0 ? this.filteredSales : this.sales;

        if (salesToShow.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="7">
                        <div class="empty-message">
                            <p>No sales found.</p>
                            <p>Sales will appear here after completing transactions in the POS.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by date (most recent first)
        const sortedSales = [...salesToShow].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        tbody.innerHTML = sortedSales.map(sale => {
            const saleDate = new Date(sale.date);
            const dateStr = saleDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            const timeStr = saleDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const itemsCount = sale.items.length;
            const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);

            return `
                <tr>
                    <td><strong>#${sale.saleNumber}</strong></td>
                    <td>
                        <div>${dateStr}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${timeStr}</div>
                    </td>
                    <td>${this.escapeHtml(this.getEventName(sale.eventId))}</td>
                    <td>${itemsCount} item${itemsCount !== 1 ? 's' : ''}</td>
                    <td>${totalQuantity}</td>
                    <td><strong>$${sale.total.toFixed(2)}</strong></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-small" onclick="salesLog.viewSale('${sale.saleNumber}')">
                                View
                            </button>
                            <button class="btn btn-danger btn-small" onclick="salesLog.confirmReverseSale('${sale.saleNumber}')">
                                Reverse
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    viewSale(saleNumber) {
        const sale = this.sales.find(s => s.saleNumber === parseInt(saleNumber));
        if (!sale) return;

        const saleDate = new Date(sale.date);
        const dateStr = saleDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const content = document.getElementById('saleDetailsContent');
        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div><strong>Sale #${sale.saleNumber}</strong></div>
                <div style="color: var(--text-secondary); margin-top: 5px;">${dateStr}</div>
                <div style="margin-top: 10px;"><strong>Event:</strong> ${this.escapeHtml(this.getEventName(sale.eventId))}</div>
            </div>
            <div style="margin: 20px 0;">
                <h3 style="margin-bottom: 15px;">Items Sold:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color);">
                            <th style="text-align: left; padding: 10px;">Item</th>
                            <th style="text-align: center; padding: 10px;">Qty</th>
                            <th style="text-align: right; padding: 10px;">Price</th>
                            <th style="text-align: right; padding: 10px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sale.items.map(item => `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 10px;">
                                    <div><strong>${this.escapeHtml(item.name)}</strong></div>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">SKU: ${this.escapeHtml(item.sku)}</div>
                                </td>
                                <td style="text-align: center; padding: 10px;">${item.quantity}</td>
                                <td style="text-align: right; padding: 10px;">$${item.unitPrice.toFixed(2)}</td>
                                <td style="text-align: right; padding: 10px;"><strong>$${item.total.toFixed(2)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Subtotal:</span>
                    <strong>$${sale.subtotal.toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Tax:</span>
                    <strong>$${sale.tax.toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.2rem; margin-top: 15px; padding-top: 15px; border-top: 2px solid var(--border-color);">
                    <span><strong>TOTAL:</strong></span>
                    <strong>$${sale.total.toFixed(2)}</strong>
                </div>
            </div>
        `;

        this.currentSale = sale;
        document.getElementById('saleModal').style.display = 'block';
    }

    closeSaleModal() {
        document.getElementById('saleModal').style.display = 'none';
        // Don't clear currentSale here - we might need it for reversing
    }

    confirmReverseSale(saleNumber) {
        const sale = this.sales.find(s => s.saleNumber === parseInt(saleNumber));
        if (!sale) return;

        this.pendingReverseSale = sale;

        const saleDate = new Date(sale.date);
        const dateStr = saleDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const timeStr = saleDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const infoDiv = document.getElementById('reverseSaleInfo');
        infoDiv.innerHTML = `
            <div><strong>Sale #${sale.saleNumber}</strong></div>
            <div style="margin-top: 8px; color: var(--text-secondary);">${dateStr} at ${timeStr}</div>
            <div style="margin-top: 8px;"><strong>Event:</strong> ${this.escapeHtml(this.getEventName(sale.eventId))}</div>
            <div style="margin-top: 8px;"><strong>Total:</strong> $${sale.total.toFixed(2)}</div>
            <div style="margin-top: 8px;"><strong>Items:</strong> ${sale.items.length} item(s)</div>
        `;

        document.getElementById('reverseSaleModal').style.display = 'block';
    }

    closeReverseModal() {
        document.getElementById('reverseSaleModal').style.display = 'none';
        this.pendingReverseSale = null;
    }

    reverseSale() {
        if (!this.pendingReverseSale) return;

        const sale = this.pendingReverseSale;

        // Restore inventory quantities
        const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        let restoredItems = [];
        
        sale.items.forEach(saleItem => {
            const inventoryItem = inventory.find(item => item.sku === saleItem.sku);
            if (inventoryItem) {
                inventoryItem.quantity += saleItem.quantity;
                inventoryItem.lastUpdated = new Date().toISOString();
                restoredItems.push(`${saleItem.name} (${saleItem.quantity} restored)`);
            } else {
                // Item might have been deleted from inventory, create a note
                restoredItems.push(`${saleItem.name} (${saleItem.quantity} - item not found in inventory)`);
            }
        });

        // Save updated inventory
        localStorage.setItem('inventory', JSON.stringify(inventory));

        // Remove sale from sales log
        this.sales = this.sales.filter(s => s.saleNumber !== sale.saleNumber);
        localStorage.setItem('posSales', JSON.stringify(this.sales));

        // Close modal and refresh
        this.closeReverseModal();
        this.currentSale = null;
        this.applyFilters(); // Re-apply filters to refresh the view
        this.updateStats();

        // Show success message with details
        const message = `Sale #${sale.saleNumber} has been reversed.\n\n` +
            `Inventory quantities have been restored:\n${restoredItems.join('\n')}\n\n` +
            `Total refunded: $${sale.total.toFixed(2)}`;
        alert(message);
    }

    printSaleReceipt() {
        if (!this.currentSale) return;
        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        const sale = this.currentSale;
        const saleDate = new Date(sale.date);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - Sale #${sale.saleNumber}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px dashed #000; }
                    .receipt-info { margin: 15px 0; }
                    .receipt-items { margin: 20px 0; }
                    .receipt-item { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dotted #ccc; }
                    .receipt-totals { margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000; }
                    .receipt-total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                    .receipt-total-row.final { font-size: 1.2rem; margin-top: 10px; padding-top: 10px; border-top: 2px solid #000; }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <h3>RECEIPT</h3>
                    <div>Backstock Inventory System</div>
                </div>
                <div class="receipt-info">
                    <div><strong>Sale #${sale.saleNumber}</strong></div>
                    <div>${saleDate.toLocaleString()}</div>
                    <div><strong>Event:</strong> ${this.escapeHtml(this.getEventName(sale.eventId))}</div>
                </div>
                <div class="receipt-items">
                    ${sale.items.map(item => `
                        <div class="receipt-item">
                            <div>${this.escapeHtml(item.name)} (${item.quantity}x)</div>
                            <div>$${(item.quantity * item.unitPrice).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="receipt-totals">
                    <div class="receipt-total-row">
                        <span>Subtotal:</span>
                        <span>$${sale.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="receipt-total-row">
                        <span>Tax:</span>
                        <span>$${sale.tax.toFixed(2)}</span>
                    </div>
                    <div class="receipt-total-row final">
                        <span>TOTAL:</span>
                        <span>$${sale.total.toFixed(2)}</span>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    updateStats() {
        const salesToShow = this.filteredSales.length > 0 ? this.filteredSales : this.sales;
        const totalSalesCount = salesToShow.length;
        const totalRevenue = salesToShow.reduce((sum, sale) => sum + sale.total, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = salesToShow
            .filter(sale => {
                const saleDate = new Date(sale.date);
                saleDate.setHours(0, 0, 0, 0);
                return saleDate.getTime() === today.getTime();
            })
            .reduce((sum, sale) => sum + sale.total, 0);

        const averageSale = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

        document.getElementById('totalSalesCount').textContent = totalSalesCount;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('todaySales').textContent = `$${todaySales.toFixed(2)}`;
        document.getElementById('averageSale').textContent = `$${averageSale.toFixed(2)}`;
    }

    exportToCSV() {
        const salesToExport = this.filteredSales.length > 0 ? this.filteredSales : this.sales;
        
        if (salesToExport.length === 0) {
            alert('No sales to export.');
            return;
        }

        const headers = ['Sale #', 'Date', 'Time', 'Event', 'Items', 'Total Quantity', 'Subtotal', 'Tax', 'Total'];
        const rows = salesToExport.map(sale => {
            const saleDate = new Date(sale.date);
            const dateStr = saleDate.toLocaleDateString();
            const timeStr = saleDate.toLocaleTimeString();
            const itemsStr = sale.items.map(item => `${item.name} (${item.quantity}x)`).join('; ');
            const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);

            return [
                sale.saleNumber,
                dateStr,
                timeStr,
                this.getEventName(sale.eventId),
                itemsStr,
                totalQuantity,
                sale.subtotal.toFixed(2),
                sale.tax.toFixed(2),
                sale.total.toFixed(2)
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_log_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let salesLog;
document.addEventListener('DOMContentLoaded', () => {
    salesLog = new SalesLog();
});
