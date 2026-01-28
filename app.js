// Inventory Management System
class InventoryManager {
    constructor() {
        this.inventory = this.loadInventory();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTable();
        this.updateStats();
        this.updateFilters();
    }

    setupEventListeners() {
        // Add item button
        document.getElementById('addItemBtn').addEventListener('click', () => this.openModal());

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Form submission
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        // Cancel buttons
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteModal());

        // Delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.handleSearch('');
        });

        // Filters
        document.getElementById('locationFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('locationFilter').value = '';
            document.getElementById('categoryFilter').value = '';
            this.applyFilters();
        });

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importFromCSV(e.target.files[0]);
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const itemModal = document.getElementById('itemModal');
            const deleteModal = document.getElementById('deleteModal');
            if (e.target === itemModal) {
                this.closeModal();
            }
            if (e.target === deleteModal) {
                this.closeDeleteModal();
            }
        });
    }

    loadInventory() {
        const stored = localStorage.getItem('inventory');
        return stored ? JSON.parse(stored) : [];
    }

    saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    openModal(item = null) {
        const modal = document.getElementById('itemModal');
        const form = document.getElementById('itemForm');
        const title = document.getElementById('modalTitle');

        if (item) {
            this.currentEditId = item.id;
            title.textContent = 'Edit Item';
            document.getElementById('sku').value = item.sku;
            document.getElementById('itemName').value = item.name;
            document.getElementById('category').value = item.category || '';
            document.getElementById('location').value = item.location || '';
            document.getElementById('quantity').value = item.quantity;
            document.getElementById('unitPrice').value = item.unitPrice || '';
            document.getElementById('lowStockThreshold').value = item.lowStockThreshold || 10;
            document.getElementById('description').value = item.description || '';
        } else {
            this.currentEditId = null;
            title.textContent = 'Add New Item';
            form.reset();
            document.getElementById('lowStockThreshold').value = 10;
        }

        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('itemModal').style.display = 'none';
        document.getElementById('itemForm').reset();
        this.currentEditId = null;
    }

    saveItem() {
        const sku = document.getElementById('sku').value.trim();
        const name = document.getElementById('itemName').value.trim();
        const category = document.getElementById('category').value.trim();
        const location = document.getElementById('location').value.trim();
        const quantity = parseInt(document.getElementById('quantity').value) || 0;
        const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 0;
        const lowStockThreshold = parseInt(document.getElementById('lowStockThreshold').value) || 10;
        const description = document.getElementById('description').value.trim();

        // Check for duplicate SKU (excluding current item if editing)
        const existingItem = this.inventory.find(item => 
            item.sku.toLowerCase() === sku.toLowerCase() && item.id !== this.currentEditId
        );

        if (existingItem) {
            alert('An item with this SKU already exists!');
            return;
        }

        const item = {
            id: this.currentEditId || this.generateId(),
            sku: sku,
            name: name,
            category: category,
            location: location,
            quantity: quantity,
            unitPrice: unitPrice,
            lowStockThreshold: lowStockThreshold,
            description: description,
            lastUpdated: new Date().toISOString()
        };

        if (this.currentEditId) {
            const index = this.inventory.findIndex(i => i.id === this.currentEditId);
            if (index !== -1) {
                this.inventory[index] = item;
            }
        } else {
            this.inventory.push(item);
        }

        this.saveInventory();
        this.closeModal();
        this.renderTable();
        this.updateStats();
        this.updateFilters();
    }

    deleteItem(id) {
        const item = this.inventory.find(i => i.id === id);
        if (item) {
            document.querySelector('.delete-item-name').textContent = `${item.name} (SKU: ${item.sku})`;
            document.getElementById('deleteModal').style.display = 'block';
            this.currentDeleteId = id;
        }
    }

    confirmDelete() {
        if (this.currentDeleteId) {
            this.inventory = this.inventory.filter(item => item.id !== this.currentDeleteId);
            this.saveInventory();
            this.closeDeleteModal();
            this.renderTable();
            this.updateStats();
            this.updateFilters();
        }
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
        this.currentDeleteId = null;
    }

    renderTable(filteredInventory = null) {
        const tbody = document.getElementById('inventoryTableBody');
        const inventory = filteredInventory || this.inventory;

        if (inventory.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="9">
                        <div class="empty-message">
                            <p>No inventory items found.</p>
                            <p>Click "Add Item" to get started.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = inventory.map(item => {
            const totalValue = (item.quantity * item.unitPrice).toFixed(2);
            const isLowStock = item.quantity <= item.lowStockThreshold;
            const stockBadge = isLowStock 
                ? '<span class="badge badge-danger">Low Stock</span>'
                : '<span class="badge badge-success">In Stock</span>';

            return `
                <tr>
                    <td><strong>${this.escapeHtml(item.sku)}</strong></td>
                    <td>${this.escapeHtml(item.name)}</td>
                    <td>${this.escapeHtml(item.category || '-')}</td>
                    <td>${this.escapeHtml(item.location || '-')}</td>
                    <td><strong>${item.quantity}</strong></td>
                    <td>$${item.unitPrice.toFixed(2)}</td>
                    <td><strong>$${totalValue}</strong></td>
                    <td>${stockBadge}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-small" onclick="inventoryManager.openModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                                Edit
                            </button>
                            <button class="btn btn-danger btn-small" onclick="inventoryManager.deleteItem('${item.id}')">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateStats() {
        const totalItems = this.inventory.length;
        const totalQuantity = this.inventory.reduce((sum, item) => sum + item.quantity, 0);
        const lowStockItems = this.inventory.filter(item => 
            item.quantity <= item.lowStockThreshold
        ).length;
        const totalValue = this.inventory.reduce((sum, item) => 
            sum + (item.quantity * item.unitPrice), 0
        );

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalQuantity').textContent = totalQuantity;
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    }

    updateFilters() {
        const locations = [...new Set(this.inventory.map(item => item.location).filter(Boolean))].sort();
        const categories = [...new Set(this.inventory.map(item => item.category).filter(Boolean))].sort();

        const locationFilter = document.getElementById('locationFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        // Update location filter
        locationFilter.innerHTML = '<option value="">All Locations</option>' +
            locations.map(loc => `<option value="${this.escapeHtml(loc)}">${this.escapeHtml(loc)}</option>`).join('');

        // Update category filter
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${this.escapeHtml(cat)}">${this.escapeHtml(cat)}</option>`).join('');

        // Update datalists for autocomplete
        const locationList = document.getElementById('locationList');
        const categoryList = document.getElementById('categoryList');

        locationList.innerHTML = locations.map(loc => 
            `<option value="${this.escapeHtml(loc)}">`
        ).join('');

        categoryList.innerHTML = categories.map(cat => 
            `<option value="${this.escapeHtml(cat)}">`
        ).join('');
    }

    handleSearch(query) {
        const clearBtn = document.getElementById('clearSearch');
        if (query.trim()) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
        this.applyFilters();
    }

    applyFilters() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const locationFilter = document.getElementById('locationFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;

        let filtered = this.inventory.filter(item => {
            const matchesSearch = !searchQuery || 
                item.sku.toLowerCase().includes(searchQuery) ||
                item.name.toLowerCase().includes(searchQuery) ||
                (item.location && item.location.toLowerCase().includes(searchQuery));

            const matchesLocation = !locationFilter || item.location === locationFilter;
            const matchesCategory = !categoryFilter || item.category === categoryFilter;

            return matchesSearch && matchesLocation && matchesCategory;
        });

        this.renderTable(filtered);
    }

    exportToCSV() {
        if (this.inventory.length === 0) {
            alert('No inventory items to export.');
            return;
        }

        const headers = ['SKU', 'Item Name', 'Category', 'Location', 'Quantity', 'Unit Price', 'Total Value', 'Low Stock Threshold', 'Description', 'Last Updated'];
        const rows = this.inventory.map(item => [
            item.sku,
            item.name,
            item.category || '',
            item.location || '',
            item.quantity,
            item.unitPrice,
            (item.quantity * item.unitPrice).toFixed(2),
            item.lowStockThreshold,
            item.description || '',
            new Date(item.lastUpdated).toLocaleString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    importFromCSV(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                alert('CSV file is empty or invalid.');
                return;
            }

            // Parse headers
            const headers = this.parseCSVLine(lines[0]);
            const skuIndex = headers.findIndex(h => h.toLowerCase().includes('sku'));
            const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('item'));

            if (skuIndex === -1 || nameIndex === -1) {
                alert('CSV file must contain SKU and Item Name columns.');
                return;
            }

            const imported = [];
            const errors = [];

            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length < 2) continue;

                const sku = values[skuIndex]?.trim();
                const name = values[nameIndex]?.trim();

                if (!sku || !name) {
                    errors.push(`Row ${i + 1}: Missing SKU or Name`);
                    continue;
                }

                // Check for duplicates
                if (this.inventory.some(item => item.sku.toLowerCase() === sku.toLowerCase())) {
                    errors.push(`Row ${i + 1}: SKU "${sku}" already exists`);
                    continue;
                }

                const item = {
                    id: this.generateId(),
                    sku: sku,
                    name: name,
                    category: values[headers.findIndex(h => h.toLowerCase().includes('category'))]?.trim() || '',
                    location: values[headers.findIndex(h => h.toLowerCase().includes('location'))]?.trim() || '',
                    quantity: parseInt(values[headers.findIndex(h => h.toLowerCase().includes('quantity'))]) || 0,
                    unitPrice: parseFloat(values[headers.findIndex(h => h.toLowerCase().includes('price'))]) || 0,
                    lowStockThreshold: parseInt(values[headers.findIndex(h => h.toLowerCase().includes('threshold'))]) || 10,
                    description: values[headers.findIndex(h => h.toLowerCase().includes('description'))]?.trim() || '',
                    lastUpdated: new Date().toISOString()
                };

                imported.push(item);
            }

            if (imported.length > 0) {
                this.inventory.push(...imported);
                this.saveInventory();
                this.renderTable();
                this.updateStats();
                this.updateFilters();
                alert(`Successfully imported ${imported.length} item(s).${errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : ''}`);
            } else {
                alert('No items were imported. ' + (errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : ''));
            }
        };

        reader.readAsText(file);
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the inventory manager when the page loads
let inventoryManager;
document.addEventListener('DOMContentLoaded', () => {
    inventoryManager = new InventoryManager();
});
