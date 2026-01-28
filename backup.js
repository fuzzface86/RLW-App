/**
 * Backup & Restore: download all data as JSON, restore from file.
 */
(function () {
  'use strict';

  function getFileName() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return 'rlw-express-backup-' + y + '-' + m + '-' + day + '.json';
  }

  function downloadBackup() {
    if (typeof RLW === 'undefined' || !RLW.getAllData) return;
    var backup = RLW.getAllData();
    var json = JSON.stringify(backup, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = getFileName();
    a.click();
    URL.revokeObjectURL(url);
  }

  function restoreBackup(file) {
    if (typeof RLW === 'undefined' || !RLW.setAllData) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var backup = JSON.parse(reader.result);
        RLW.setAllData(backup);
        alert('Restore complete. Reloading the app.');
        window.location.href = 'index.html';
      } catch (e) {
        alert('Invalid backup file. Please choose a file that was downloaded from Backup & Restore.');
      }
    };
    reader.readAsText(file);
  }

  function init() {
    var downloadBtn = document.getElementById('downloadBackupBtn');
    var restoreBtn = document.getElementById('restoreBackupBtn');
    var fileInput = document.getElementById('restoreFileInput');

    if (downloadBtn) downloadBtn.addEventListener('click', downloadBackup);
    if (restoreBtn) {
      restoreBtn.addEventListener('click', function () {
        if (fileInput) fileInput.click();
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', function (e) {
        var file = e.target && e.target.files && e.target.files[0];
        if (file) restoreBackup(file);
        fileInput.value = '';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
