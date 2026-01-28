/**
 * Home dashboard: at-a-glance stats from localStorage.
 */
(function () {
  'use strict';

  function formatMoney(n) {
    return '$' + (typeof n === 'number' ? n.toFixed(2) : '0.00');
  }

  function updateDashboard() {
    if (typeof RLW === 'undefined' || !RLW.getDashboardStats) return;
    var s = RLW.getDashboardStats();

    var el = document.getElementById('dashboard-inventory-value');
    if (el) el.textContent = s.totalItems + ' items';
    el = document.getElementById('dashboard-inventory-meta');
    if (el) el.textContent = s.lowStockCount > 0 ? s.lowStockCount + ' low stock' : 'Total value ' + formatMoney(s.totalValue);

    el = document.getElementById('dashboard-pos-value');
    if (el) el.textContent = s.activeEventName || 'No event selected';
    el = document.getElementById('dashboard-pos-meta');
    if (el) el.textContent = 'Tap to start selling';

    el = document.getElementById('dashboard-events-value');
    if (el) el.textContent = s.upcomingEvents + ' upcoming';
    el = document.getElementById('dashboard-events-meta');
    if (el) el.textContent = s.totalEvents + ' total events';

    el = document.getElementById('dashboard-sales-value');
    if (el) el.textContent = formatMoney(s.totalRevenue);
    el = document.getElementById('dashboard-sales-meta');
    if (el) el.textContent = s.salesCount + ' transactions';

    el = document.getElementById('dashboard-discover-value');
    if (el) el.textContent = 'Find events';
    el = document.getElementById('dashboard-discover-meta');
    if (el) el.textContent = 'Search by location';

    el = document.getElementById('dashboard-analytics-value');
    if (el) el.textContent = formatMoney(s.totalRevenue);
    el = document.getElementById('dashboard-analytics-meta');
    if (el) el.textContent = 'Revenue & insights';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDashboard);
  } else {
    updateDashboard();
  }
})();
