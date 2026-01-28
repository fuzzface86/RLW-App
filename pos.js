// POS Sales System
class POSSystem {
    constructor() {
        this.inventory = this.loadInventory();
        this.events = this.loadEvents();
        this.cart = [];
        this.saleNumber = this.loadSaleNumber();
        this.filteredItems = [];
        this.selectedEventId = this.getActiveEventId();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDate();
        this.updateSaleNumber();
        this.updateEventSelector();
        this.renderItems();
    }

    setupEventListeners() {
        // Event selector
        const eventSelect = document.getElementById('activeEventSelect') || document.getElementById('eventSelect');
        if (eventSelect) {
            eventSelect.addEventListener('change', (e) => {
                this.selectedEventId = e.target.value;
            });
        }

        // Search
        document.getElementById('itemSearch').addEventListener('input', (e) => {
            this.filterItems(e.target.value);
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const filter = e.target.dataset.filter;
                this.applyFilter(filter);
            });
        });

        // Cart actions
        document.getElementById('clearCartBtn').addEventListener('click', () => {
            this.clearCart();
        });

        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.completeSale();
        });

        document.getElementById('printReceiptBtn').addEventListener('click', () => {
            this.showReceipt();
        });

        // Receipt modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeReceipt();
        });

        document.getElementById('closeReceiptBtn').addEventListener('click', () => {
            this.closeReceipt();
        });

        document.getElementById('printReceiptFinalBtn').addEventListener('click', () => {
            this.printReceipt();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('receiptModal');
            if (e.target === modal) {
                this.closeReceipt();
            }
        });
    }

    loadInventory() {
        const stored = localStorage.getItem('inventory');
        return stored ? JSON.parse(stored) : [];
    }

    loadEvents() {
        const stored = localStorage.getItem('events');
        return stored ? JSON.parse(stored) : [];
    }

    getActiveEventId() {
        return localStorage.getItem('activeEventId') || '';
    }

    updateEventSelector() {
        const selector = document.getElementById('activeEventSelect') || document.getElementById('eventSelect');
        if (!selector) return;
        
        const activeEventId = this.getActiveEventId();
        
        // Clear existing options except first one
        selector.innerHTML = '<option value="">No Event Selected</option>';
        
        // Add events
        this.events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.name;
            if (event.id === activeEventId) {
                option.selected = true;
                this.selectedEventId = event.id;
            }
            selector.appendChild(option);
        });
    }

    saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
    }

    loadSaleNumber() {
        const stored = localStorage.getItem('posSaleNumber');
        return stored ? parseInt(stored) : 1;
    }

    saveSaleNumber() {
        localStorage.setItem('posSaleNumber', this.saleNumber.toString());
    }

    updateDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        document.getElementById('currentDate').textContent = dateStr;
    }

    updateSaleNumber() {
        document.getElementById('saleNumber').textContent = this.saleNumber;
    }

    filterItems(searchQuery) {
        const query = searchQuery.toLowerCase();
        this.filteredItems = this.inventory.filter(item => {
            return item.name.toLowerCase().includes(query) ||
                   item.sku.toLowerCase().includes(query) ||
                   (item.category && item.category.toLowerCase().includes(query));
        });
        this.renderItems();
    }

    applyFilter(filterType) {
        if (filterType === 'low-stock') {
            this.filteredItems = this.inventory.filter(item => 
                item.quantity <= item.lowStockThreshold
            );
        } else {
            this.filteredItems = [...this.inventory];
        }
        this.renderItems();
    }

    renderItems() {
        const grid = document.getElementById('itemsGrid');
        const itemsToShow = this.filteredItems.length > 0 ? this.filteredItems : this.inventory;

        if (itemsToShow.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">No items found. Add items in the inventory management page.</div>';
            return;
        }

        grid.innerHTML = itemsToShow.map(item => {
            const isOutOfStock = item.quantity <= 0;
            const isLowStock = item.quantity <= item.lowStockThreshold;
            const quantityClass = isLowStock ? 'low-stock' : '';
            
            return `
                <div class="item-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                     onclick="${isOutOfStock ? '' : `posSystem.addToCart('${item.id}')`}">
                    <div class="item-name">${this.escapeHtml(item.name)}</div>
                    <div class="item-sku">SKU: ${this.escapeHtml(item.sku)}</div>
                    <div class="item-details">
                        <div class="item-price">$${item.unitPrice.toFixed(2)}</div>
                        <div class="item-quantity ${quantityClass}">
                            Qty: ${item.quantity}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    addToCart(itemId) {
        const item = this.inventory.find(i => i.id === itemId);
        if (!item || item.quantity <= 0) return;

        const existingCartItem = this.cart.find(c => c.id === itemId);
        
        if (existingCartItem) {
            if (existingCartItem.quantity < item.quantity) {
                existingCartItem.quantity += 1;
            } else {
                alert(`Only ${item.quantity} available in stock.`);
                return;
            }
        } else {
            this.cart.push({
                id: item.id,
                sku: item.sku,
                name: item.name,
                unitPrice: item.unitPrice,
                quantity: 1,
                maxQuantity: item.quantity
            });
        }

        this.updateCart();
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.updateCart();
    }

    updateCartItemQuantity(itemId, newQuantity) {
        const cartItem = this.cart.find(c => c.id === itemId);
        if (!cartItem) return;

        if (newQuantity <= 0) {
            this.removeFromCart(itemId);
            return;
        }

        if (newQuantity > cartItem.maxQuantity) {
            alert(`Only ${cartItem.maxQuantity} available in stock.`);
            newQuantity = cartItem.maxQuantity;
        }

        cartItem.quantity = newQuantity;
        this.updateCart();
    }

    clearCart() {
        if (this.cart.length === 0) return;
        if (confirm('Clear all items from cart?')) {
            this.cart = [];
            this.updateCart();
        }
    }

    updateCart() {
        this.renderCart();
        this.updateCartSummary();
        this.updateCheckoutButton();
    }

    renderCart() {
        const cartContainer = document.getElementById('cartItems');

        if (this.cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <p>Cart is empty</p>
                    <p class="empty-cart-hint">Select items to add to cart</p>
                </div>
            `;
            return;
        }

        cartContainer.innerHTML = this.cart.map(item => {
            const itemTotal = (item.quantity * item.unitPrice).toFixed(2);
            
            return `
                <div class="cart-item">
                    <div class="cart-item-header">
                        <div class="cart-item-name">${this.escapeHtml(item.name)}</div>
                        <button class="cart-item-remove" onclick="posSystem.removeFromCart('${item.id}')" title="Remove">×</button>
                    </div>
                    <div class="cart-item-details">
                        <div>
                            <div>SKU: ${this.escapeHtml(item.sku)}</div>
                            <div>$${item.unitPrice.toFixed(2)} each</div>
                        </div>
                        <div class="cart-item-total">$${itemTotal}</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="posSystem.updateCartItemQuantity('${item.id}', ${item.quantity - 1})" 
                                    ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.maxQuantity}"
                                   onchange="posSystem.updateCartItemQuantity('${item.id}', parseInt(this.value))">
                            <button class="quantity-btn" onclick="posSystem.updateCartItemQuantity('${item.id}', ${item.quantity + 1})"
                                    ${item.quantity >= item.maxQuantity ? 'disabled' : ''}>+</button>
                        </div>
                        <div class="cart-item-price">Max: ${item.maxQuantity}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = 0; // No tax for now
        const total = subtotal + tax;
        const itemsCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
        document.getElementById('itemsCount').textContent = itemsCount;
    }

    updateCheckoutButton() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const printBtn = document.getElementById('printReceiptBtn');
        const hasItems = this.cart.length > 0;

        checkoutBtn.disabled = !hasItems;
        printBtn.disabled = !hasItems;
    }

    completeSale() {
        if (this.cart.length === 0) return;

        // Update inventory quantities
        this.cart.forEach(cartItem => {
            const inventoryItem = this.inventory.find(i => i.id === cartItem.id);
            if (inventoryItem) {
                inventoryItem.quantity -= cartItem.quantity;
                if (inventoryItem.quantity < 0) inventoryItem.quantity = 0;
                inventoryItem.lastUpdated = new Date().toISOString();
            }
        });

        // Save updated inventory
        this.saveInventory();

        // Save sale record
        this.saveSaleRecord();

        // Show receipt
        this.showReceipt();

        // Clear cart and increment sale number
        this.cart = [];
        this.saleNumber += 1;
        this.saveSaleNumber();
        this.updateSaleNumber();
        this.updateCart();
        this.renderItems(); // Refresh items to show updated quantities
    }

    saveSaleRecord() {
        const sale = {
            saleNumber: this.saleNumber,
            date: new Date().toISOString(),
            eventId: this.selectedEventId || null,
            items: this.cart.map(item => ({
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice
            })),
            subtotal: this.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
            tax: 0,
            total: this.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        };

        // Load existing sales
        const sales = JSON.parse(localStorage.getItem('posSales') || '[]');
        sales.push(sale);
        localStorage.setItem('posSales', JSON.stringify(sales));
    }

    showReceipt() {
        const receiptContent = document.getElementById('receiptContent');
        const subtotal = this.cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = 0;
        const total = subtotal + tax;
        const itemsCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        const date = new Date();
        const dateStr = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const selectedEvent = this.events.find(e => e.id === this.selectedEventId);
        const eventName = selectedEvent ? selectedEvent.name : 'No Event';

        receiptContent.innerHTML = `
            <div class="receipt-header">
                <h3>RECEIPT</h3>
                <div>Backstock Inventory System</div>
            </div>
            <div class="receipt-info">
                <div><strong>Sale #${this.saleNumber}</strong></div>
                <div>${dateStr}</div>
                <div><strong>Event:</strong> ${this.escapeHtml(eventName)}</div>
            </div>
            <div class="receipt-items">
                ${this.cart.map(item => `
                    <div class="receipt-item">
                        <div class="receipt-item-name">${this.escapeHtml(item.name)}</div>
                        <div class="receipt-item-qty">${item.quantity}x</div>
                        <div class="receipt-item-price">$${(item.quantity * item.unitPrice).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="receipt-totals">
                <div class="receipt-total-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="receipt-total-row">
                    <span>Tax:</span>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div class="receipt-total-row final">
                    <span>TOTAL:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
            <div class="receipt-footer">
                <div>Thank you for your business!</div>
                <div>Items: ${itemsCount}</div>
            </div>
        `;

        document.getElementById('receiptModal').style.display = 'block';
    }

    closeReceipt() {
        document.getElementById('receiptModal').style.display = 'none';
    }

    printReceipt() {
        window.print();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize POS system when page loads
let posSystem;
document.addEventListener('DOMContentLoaded', () => {
    posSystem = new POSSystem();
});
