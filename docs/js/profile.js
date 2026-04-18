(function () {
  'use strict';

  // ── Auth guard ────────────────────────────────────────────────────────────────
  // Redirect to home if not logged in
  var token = localStorage.getItem('ada-token');
  if (!token) {
    window.location.replace('index.html');
    // Stop executing — the redirect is in flight
    throw new Error('unauthenticated');
  }

  // ── Panel switching ───────────────────────────────────────────────────────────
  var panels   = document.querySelectorAll('.settings-panel');
  var navItems = document.querySelectorAll('.settings-nav-item[data-panel]');

  function showPanel(id) {
    panels.forEach(function (p) {
      p.hidden = p.id !== 'panel-' + id;
    });
    navItems.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.panel === id);
    });
    // Store in sessionStorage so the same panel reopens on page refresh
    sessionStorage.setItem('profile-panel', id);
  }

  navItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showPanel(btn.dataset.panel);
      if (btn.dataset.panel === 'payment-history') loadInvoices();
    });
  });

  // Open the panel from sessionStorage, or default to 'account'
  var savedPanel = sessionStorage.getItem('profile-panel') || 'account';
  showPanel(savedPanel);
  if (savedPanel === 'payment-history') loadInvoices();

  // ── Account panel ─────────────────────────────────────────────────────────────
  var user = (function () {
    try { return JSON.parse(localStorage.getItem('ada-user')); } catch (e) { return null; }
  }());

  var avatarEl   = document.getElementById('profile-avatar-initials');
  var emailEl    = document.getElementById('profile-email-display');
  var nameInput  = document.getElementById('profile-display-name');
  var saveNameBtn = document.getElementById('save-name-btn');
  var saveNameMsg = document.getElementById('save-name-msg');

  if (user) {
    if (avatarEl) avatarEl.textContent = (user.email || '?')[0].toUpperCase();
    if (emailEl)  emailEl.textContent  = user.email || '';
  }
  if (nameInput) {
    nameInput.value = localStorage.getItem('ada-profile-name') || '';
  }

  if (saveNameBtn) {
    saveNameBtn.addEventListener('click', function () {
      var name = nameInput.value.trim();
      localStorage.setItem('ada-profile-name', name);
      saveNameMsg.hidden = false;
      saveNameMsg.textContent = 'Name saved.';
      setTimeout(function () { saveNameMsg.hidden = true; }, 3000);
    });
  }

  // ── Payment History panel ─────────────────────────────────────────────────────
  var invoicesLoaded = false;

  function loadInvoices() {
    if (invoicesLoaded) return;
    invoicesLoaded = true;

    var listEl  = document.getElementById('invoices-list');
    var emptyEl = document.getElementById('invoices-empty');
    var loadEl  = document.getElementById('invoices-loading');

    if (!listEl) return;

    fetch('/api/billing/invoices', {
      headers: { 'Authorization': 'Bearer ' + token },
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (loadEl) loadEl.hidden = true;
        if (!data.invoices || data.invoices.length === 0) {
          if (emptyEl) emptyEl.hidden = false;
          return;
        }
        listEl.innerHTML = '';
        data.invoices.forEach(function (inv) {
          var date   = new Date(inv.date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          var amount = (inv.amount / 100).toLocaleString('en-US', { style: 'currency', currency: inv.currency.toUpperCase() });
          var status = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);

          var row = document.createElement('div');
          row.className = 'invoice-row';
          row.innerHTML =
            '<span class="invoice-date">' + date + '</span>' +
            '<span class="invoice-amount">' + amount + '</span>' +
            '<span class="invoice-status invoice-status--' + inv.status + '">' + status + '</span>' +
            (inv.pdf ? '<a class="invoice-pdf-link" href="' + inv.pdf + '" target="_blank" rel="noopener">Download PDF</a>' : '<span></span>');
          listEl.appendChild(row);
        });
      })
      .catch(function () {
        if (loadEl) loadEl.hidden = true;
        if (listEl) listEl.innerHTML = '<p class="history-empty">Unable to load invoices. Please try again later.</p>';
      });
  }

  // ── Security panel — change password ─────────────────────────────────────────
  var changePasswordForm = document.getElementById('change-password-form');
  var changePasswordMsg  = document.getElementById('change-password-msg');

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var currentEl = document.getElementById('current-password');
      var newEl     = document.getElementById('new-password');
      var confirmEl = document.getElementById('confirm-password');
      var submitBtn = document.getElementById('change-password-btn');

      changePasswordMsg.hidden = true;
      changePasswordMsg.className = 'form-msg';

      if (newEl.value !== confirmEl.value) {
        changePasswordMsg.textContent = 'New passwords do not match.';
        changePasswordMsg.className   = 'form-msg form-msg--error';
        changePasswordMsg.hidden      = false;
        return;
      }

      submitBtn.disabled    = true;
      submitBtn.textContent = 'Updating…';

      try {
        var res  = await fetch('/api/auth/change-password', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({
            currentPassword: currentEl.value,
            newPassword:     newEl.value,
          }),
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update failed');
        changePasswordMsg.textContent = 'Password updated successfully.';
        changePasswordMsg.className   = 'form-msg form-msg--success';
        changePasswordMsg.hidden      = false;
        changePasswordForm.reset();
      } catch (err) {
        changePasswordMsg.textContent = err.message;
        changePasswordMsg.className   = 'form-msg form-msg--error';
        changePasswordMsg.hidden      = false;
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Update Password';
      }
    });
  }

}());
