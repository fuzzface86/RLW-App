// Event Management System
class EventManager {
    constructor() {
        this.events = this.loadEvents();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTable();
        this.updateStats();
    }

    setupEventListeners() {
        document.getElementById('addEventBtn').addEventListener('click', () => this.openModal());
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        document.getElementById('cancelActiveBtn').addEventListener('click', () => this.closeActiveModal());
        document.querySelector('.active-close').addEventListener('click', () => this.closeActiveModal());
        document.getElementById('confirmActiveBtn').addEventListener('click', () => this.confirmSetActive());

        window.addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') this.closeModal();
            if (e.target.id === 'activeEventModal') this.closeActiveModal();
        });
    }

    loadEvents() {
        const stored = localStorage.getItem('events');
        return stored ? JSON.parse(stored) : [];
    }

    saveEvents() {
        localStorage.setItem('events', JSON.stringify(this.events));
    }

    getActiveEvent() {
        const activeId = localStorage.getItem('activeEventId');
        return activeId ? this.events.find(e => e.id === activeId) : null;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    openModal(event = null) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const title = document.getElementById('modalTitle');

        if (event) {
            this.currentEditId = event.id;
            title.textContent = 'Edit Event';
            document.getElementById('eventName').value = event.name;
            document.getElementById('eventDate').value = event.startDate;
            document.getElementById('eventEndDate').value = event.endDate || '';
            document.getElementById('eventDays').value = event.days || 1;
            document.getElementById('eventLocation').value = event.location || '';
            document.getElementById('tableCost').value = event.tableCost || 0;
            document.getElementById('otherCosts').value = event.otherCosts || 0;
            document.getElementById('eventDescription').value = event.description || '';
        } else {
            this.currentEditId = null;
            title.textContent = 'Add New Event';
            form.reset();
            document.getElementById('eventDays').value = 1;
            document.getElementById('tableCost').value = 0;
            document.getElementById('otherCosts').value = 0;
        }

        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('eventModal').style.display = 'none';
        document.getElementById('eventForm').reset();
        this.currentEditId = null;
    }

    saveEvent() {
        const name = document.getElementById('eventName').value.trim();
        const startDate = document.getElementById('eventDate').value;
        const endDate = document.getElementById('eventEndDate').value;
        const days = parseInt(document.getElementById('eventDays').value) || 1;
        const location = document.getElementById('eventLocation').value.trim();
        const tableCost = parseFloat(document.getElementById('tableCost').value) || 0;
        const otherCosts = parseFloat(document.getElementById('otherCosts').value) || 0;
        const description = document.getElementById('eventDescription').value.trim();

        const event = {
            id: this.currentEditId || this.generateId(),
            name: name,
            startDate: startDate,
            endDate: endDate || startDate,
            days: days,
            location: location,
            tableCost: tableCost,
            otherCosts: otherCosts,
            description: description,
            createdAt: this.currentEditId ? 
                (this.events.find(e => e.id === this.currentEditId)?.createdAt || new Date().toISOString()) :
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditId) {
            const index = this.events.findIndex(e => e.id === this.currentEditId);
            if (index !== -1) {
                this.events[index] = event;
            }
        } else {
            this.events.push(event);
        }

        this.saveEvents();
        this.closeModal();
        this.renderTable();
        this.updateStats();
    }

    deleteEvent(id) {
        const event = this.events.find(e => e.id === id);
        if (event) {
            if (confirm(`Delete event "${event.name}"? This will not delete associated sales.`)) {
                this.events = this.events.filter(e => e.id !== id);
                const activeId = localStorage.getItem('activeEventId');
                if (activeId === id) {
                    localStorage.removeItem('activeEventId');
                }
                this.saveEvents();
                this.renderTable();
                this.updateStats();
            }
        }
    }

    setActiveEvent(id) {
        const event = this.events.find(e => e.id === id);
        if (event) {
            document.querySelector('.event-name-display').textContent = event.name;
            document.getElementById('activeEventModal').style.display = 'block';
            this.pendingActiveId = id;
        }
    }

    confirmSetActive() {
        if (this.pendingActiveId) {
            localStorage.setItem('activeEventId', this.pendingActiveId);
            this.closeActiveModal();
            this.renderTable();
            this.updateStats();
        }
    }

    closeActiveModal() {
        document.getElementById('activeEventModal').style.display = 'none';
        this.pendingActiveId = null;
    }

    getEventSales(eventId) {
        const sales = JSON.parse(localStorage.getItem('posSales') || '[]');
        return sales.filter(sale => sale.eventId === eventId);
    }

    getEventTotalSales(eventId) {
        const sales = this.getEventSales(eventId);
        return sales.reduce((sum, sale) => sum + sale.total, 0);
    }

    renderTable(filteredEvents = null) {
        const tbody = document.getElementById('eventsTableBody');
        const events = filteredEvents || this.events;
        const activeEventId = localStorage.getItem('activeEventId');

        if (events.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="9">
                        <div class="empty-message">
                            <p>No events found.</p>
                            <p>Click "Add Event" to get started.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort events by date (most recent first)
        const sortedEvents = [...events].sort((a, b) => 
            new Date(b.startDate) - new Date(a.startDate)
        );

        tbody.innerHTML = sortedEvents.map(event => {
            const startDate = new Date(event.startDate);
            const endDate = event.endDate ? new Date(event.endDate) : startDate;
            const dateStr = startDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined
            });
            const endDateStr = endDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            const dateDisplay = startDate.getTime() === endDate.getTime() ? 
                dateStr : `${dateStr} - ${endDateStr}`;

            const totalSales = this.getEventTotalSales(event.id);
            const totalCosts = (event.tableCost || 0) + (event.otherCosts || 0);
            const netProfit = totalSales - totalCosts;
            const isActive = activeEventId === event.id;
            const isUpcoming = new Date(event.startDate) > new Date();
            const isPast = new Date(event.endDate || event.startDate) < new Date();

            let status = 'Active';
            let statusClass = 'badge-success';
            if (isPast) {
                status = 'Past';
                statusClass = 'badge-secondary';
            } else if (isUpcoming) {
                status = 'Upcoming';
                statusClass = 'badge-warning';
            }

            return `
                <tr ${isActive ? 'style="background-color: #eff6ff;"' : ''}>
                    <td>
                        <strong>${this.escapeHtml(event.name)}</strong>
                        ${isActive ? '<span class="badge badge-success" style="margin-left: 8px;">ACTIVE</span>' : ''}
                    </td>
                    <td>${dateDisplay}</td>
                    <td>${this.escapeHtml(event.location || '-')}</td>
                    <td>${event.days || 1}</td>
                    <td>$${(event.tableCost || 0).toFixed(2)}</td>
                    <td><strong>$${totalSales.toFixed(2)}</strong></td>
                    <td><strong style="color: ${netProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">$${netProfit.toFixed(2)}</strong></td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${!isActive ? `<button class="btn btn-success btn-small" onclick="eventManager.setActiveEvent('${event.id}')">Set Active</button>` : ''}
                            <button class="btn btn-primary btn-small" onclick="eventManager.openModal(${JSON.stringify(event).replace(/"/g, '&quot;')})">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="eventManager.deleteEvent('${event.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateStats() {
        const totalEvents = this.events.length;
        const now = new Date();
        const upcomingEvents = this.events.filter(e => new Date(e.startDate) > now).length;
        
        const allSales = JSON.parse(localStorage.getItem('posSales') || '[]');
        const totalSales = allSales.reduce((sum, sale) => sum + sale.total, 0);

        const activeEvent = this.getActiveEvent();
        const activeEventName = activeEvent ? activeEvent.name : 'None';

        document.getElementById('totalEvents').textContent = totalEvents;
        document.getElementById('upcomingEvents').textContent = upcomingEvents;
        document.getElementById('totalSales').textContent = `$${totalSales.toFixed(2)}`;
        document.getElementById('activeEvent').textContent = activeEventName;
    }

    handleSearch(query) {
        const searchLower = query.toLowerCase();
        const filtered = this.events.filter(event => 
            event.name.toLowerCase().includes(searchLower) ||
            (event.location && event.location.toLowerCase().includes(searchLower)) ||
            (event.description && event.description.toLowerCase().includes(searchLower))
        );
        this.renderTable(filtered);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let eventManager;
document.addEventListener('DOMContentLoaded', () => {
    eventManager = new EventManager();
});
