/**
 * Shared utilities for RLW Express: nav, dashboard stats, localStorage keys.
 */

(function () {
  'use strict';

  window.RLW = window.RLW || {};

  /** localStorage keys used across the app */
  RLW.keys = {
    inventory: 'inventory',
    events: 'events',
    posSales: 'posSales',
    posSaleNumber: 'posSaleNumber',
    activeEventId: 'activeEventId',
    userLocation: 'userLocation',
    discoveredEvents: 'discoveredEvents',
    bookmarkedEvents: 'bookmarkedEvents',
    trackedEvents: 'trackedEvents'
  };

  /**
   * Get at-a-glance stats from localStorage for the home dashboard.
   * @returns {Object} stats for inventory, events, sales
   */
  RLW.getDashboardStats = function () {
    var inventory = JSON.parse(localStorage.getItem(RLW.keys.inventory) || '[]');
    var events = JSON.parse(localStorage.getItem(RLW.keys.events) || '[]');
    var sales = JSON.parse(localStorage.getItem(RLW.keys.posSales) || '[]');

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var upcomingEvents = events.filter(function (e) {
      var d = e.date ? new Date(e.date).getTime() : 0;
      return d >= today;
    });

    var totalQuantity = 0;
    var totalValue = 0;
    var lowStockCount = 0;
    inventory.forEach(function (item) {
      var q = parseInt(item.quantity, 10) || 0;
      var p = parseFloat(item.unitPrice) || 0;
      var thresh = parseInt(item.lowStockThreshold, 10);
      if (!isNaN(thresh) && q <= thresh) lowStockCount++;
      totalQuantity += q;
      totalValue += q * p;
    });

    var totalRevenue = sales.reduce(function (sum, s) { return sum + (parseFloat(s.total) || 0); }, 0);

    var activeEventId = localStorage.getItem(RLW.keys.activeEventId) || '';
    var activeEvent = events.find(function (e) { return e.id === activeEventId; });
    var activeEventName = activeEvent ? activeEvent.name : null;

    return {
      totalItems: inventory.length,
      totalQuantity: totalQuantity,
      totalValue: totalValue,
      lowStockCount: lowStockCount,
      totalEvents: events.length,
      upcomingEvents: upcomingEvents.length,
      totalRevenue: totalRevenue,
      salesCount: sales.length,
      activeEventName: activeEventName
    };
  };

  /** Keys that store JSON (arrays/objects); others are stored as strings */
  RLW.keysJson = [
    RLW.keys.inventory,
    RLW.keys.events,
    RLW.keys.posSales,
    RLW.keys.userLocation,
    RLW.keys.discoveredEvents,
    RLW.keys.bookmarkedEvents,
    RLW.keys.trackedEvents
  ];

  /**
   * Get all app data from localStorage for backup.
   * @returns {Object} { version: 1, savedAt: string, data: { key: value, ... } }
   */
  RLW.getAllData = function () {
    var data = {};
    var k, key, raw;
    for (k in RLW.keys) {
      if (RLW.keys.hasOwnProperty(k)) {
        key = RLW.keys[k];
        raw = localStorage.getItem(key);
        if (raw === null) continue;
        if (RLW.keysJson.indexOf(key) !== -1) {
          try {
            data[key] = JSON.parse(raw);
          } catch (e) {
            data[key] = raw;
          }
        } else {
          data[key] = raw;
        }
      }
    }
    return { version: 1, savedAt: new Date().toISOString(), data: data };
  };

  /**
   * Restore app data from a backup object (from getAllData or parsed backup file).
   * Only sets keys present in backup.data; does not clear other keys.
   * @param {Object} backup - { version?: number, data: { key: value, ... } }
   */
  RLW.setAllData = function (backup) {
    var data = backup && backup.data ? backup.data : backup;
    if (!data || typeof data !== 'object') return;
    var key, val;
    for (key in data) {
      if (data.hasOwnProperty(key)) {
        val = data[key];
        if (RLW.keysJson.indexOf(key) !== -1) {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        } else {
          localStorage.setItem(key, typeof val === 'string' ? val : String(val));
        }
      }
    }
  };

  /**
   * Initialize mobile nav: hamburger toggle and close on link click or outside click.
   * Call once when DOM is ready. Looks for .nav-toggle and .nav-links inside .app-nav.
   */
  RLW.initMobileNav = function () {
    var nav = document.querySelector('.app-nav');
    if (!nav) return;
    var toggle = nav.querySelector('.nav-toggle');
    var links = nav.querySelector('.nav-links');
    if (!toggle || !links) return;

    function closeMenu() {
      nav.classList.remove('nav-open');
      document.body.classList.remove('nav-overlay-open');
    }

    function openMenu() {
      nav.classList.add('nav-open');
      document.body.classList.add('nav-overlay-open');
    }

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('nav-open')) closeMenu();
      else openMenu();
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('nav-open') && !nav.contains(e.target)) closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 768) closeMenu();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', RLW.initMobileNav);
  } else {
    RLW.initMobileNav();
  }
})();
