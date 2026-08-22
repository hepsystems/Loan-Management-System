// ============================================================
//  CONFIGURATION
// ============================================================
const API_BASE = '/api';

// ============================================================
//  STATE
// ============================================================
let productsData = [];
let newsData = [];
let impactData = [];
let authToken = localStorage.getItem('nth_token') || null;
let currentUser = null;
try {
  const storedUser = localStorage.getItem('nth_user');
  currentUser = (storedUser && storedUser !== 'undefined') ? JSON.parse(storedUser) : null;
} catch (err) {
  console.warn('Corrupted nth_user in localStorage, resetting:', err.message);
  localStorage.removeItem('nth_user');
  localStorage.removeItem('nth_token');
  currentUser = null;
  authToken = null;
}

function isAdmin() {
  return currentUser && currentUser.role === 'admin';
}

function isLoggedIn() {
  return !!authToken && !!currentUser;
}

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

// ============================================================
//  DOM REFS
// ============================================================
const productsGrid = document.getElementById('productsGrid');
const newsGrid = document.getElementById('newsGrid');
const impactGrid = document.getElementById('impactGrid');
const adminAddProductBtn = document.getElementById('adminAddProductBtn');
const adminAddNewsBtn = document.getElementById('adminAddNewsBtn');
const modal = document.getElementById('adminModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const adminForm = document.getElementById('adminForm');
const editId = document.getElementById('editId');
const modalName = document.getElementById('modalName');
const modalDesc = document.getElementById('modalDesc');
const modalPrice = document.getElementById('modalPrice');

let editingType = ''; // 'product' or 'news'

// ============================================================
//  API HELPERS
// ============================================================
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function apiSend(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${method} ${path} failed`);
  return data;
}

// ============================================================
//  LOAD DATA FROM BACKEND
// ============================================================
async function loadAllData() {
  try {
    const [products, news, impact] = await Promise.all([
      apiGet('/products'),
      apiGet('/news'),
      apiGet('/impact')
    ]);
    productsData = products;
    newsData = news;
    impactData = impact;
    renderProducts();
    renderNews();
    renderImpact();
  } catch (err) {
    console.warn('Using fallback / offline data:', err.message);
    // Keep empty or previous; page still works
    renderProducts();
    renderNews();
    renderImpact();
  }
  loadSettings();
}

// ============================================================
//  RENDER FUNCTIONS
// ============================================================
function renderProducts() {
  if (!productsGrid) return;
  productsGrid.innerHTML = productsData.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-icon"><i class="fas fa-seedling"></i></div>
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description)}</p>
      <span class="price">${escapeHtml(p.price)}</span>
      <button class="btn btn-sm btn-gold order-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}">Order <i class="fas fa-arrow-right"></i></button>
      ${isAdmin() ? `
        <div class="admin-controls">
          <button class="btn btn-sm btn-outline edit-product" data-id="${p.id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-product" data-id="${p.id}">Delete</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function renderNews() {
  if (!newsGrid) return;
  newsGrid.innerHTML = newsData.map(n => `
    <article data-id="${n.id}">
      <time>${escapeHtml(n.date)}</time>
      <h4>${escapeHtml(n.title)}</h4>
      <p>${escapeHtml(n.excerpt)}</p>
      <a href="#">Read more →</a>
      ${isAdmin() ? `
        <div class="admin-controls">
          <button class="btn btn-sm btn-outline edit-news" data-id="${n.id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-news" data-id="${n.id}">Delete</button>
        </div>
      ` : ''}
    </article>
  `).join('');
}

function renderImpact() {
  if (!impactGrid) return;
  impactGrid.innerHTML = impactData.map(s => `
    <div class="story-card" data-id="${s.id}">
      <div class="story-avatar" style="background:${s.color || '#4a7c59'};"><i class="fas fa-user"></i></div>
      <h4>${escapeHtml(s.name)}</h4>
      <p>${escapeHtml(s.text)}</p>
      <span class="story-meta">${escapeHtml(s.meta || '')}</span>
      ${isAdmin() ? `
        <div class="admin-controls">
          <button class="btn btn-sm btn-outline edit-impact" data-id="${s.id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-impact" data-id="${s.id}">Delete</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// ============================================================
//  SITE SETTINGS (hero stats) — admin-editable instead of hardcoded
// ============================================================
async function loadSettings() {
  try {
    const settings = await apiGet('/settings');
    const elMembers = document.getElementById('statMembers');
    const elSoya = document.getElementById('statSoya');
    const elProcessing = document.getElementById('statProcessing');
    if (elMembers) elMembers.textContent = settings.statMembers;
    if (elSoya) elSoya.textContent = settings.statSoyaFarmers;
    if (elProcessing) elProcessing.textContent = settings.statProcessing;
  } catch (err) {
    console.warn('Using default hero stats:', err.message);
  }
}

// ============================================================
//  MEMBERS (admin only)
// ============================================================
async function loadMembers() {
  const panel = document.getElementById('membersPanel');
  const tbody = document.getElementById('membersTableBody');
  if (!panel || !tbody) return;

  if (!isAdmin()) {
    panel.style.display = 'none';
    return;
  }

  try {
    const members = await apiSend('GET', '/members');
    panel.style.display = 'block';
    tbody.innerHTML = members.map(m => `
      <tr data-id="${m.id}">
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.username)}</td>
        <td>${escapeHtml(m.email)}</td>
        <td>${escapeHtml(m.phone || '—')}</td>
        <td>${escapeHtml(m.role)}</td>
        <td>${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
      </tr>
    `).join('') || '<tr><td colspan="6">No members yet.</td></tr>';
  } catch (err) {
    console.warn('Could not load members:', err.message);
    panel.style.display = 'none';
  }
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
//  ADMIN UI TOGGLE
// ============================================================
function updateAdminUI() {
  if (adminAddProductBtn) {
    adminAddProductBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
  }
  if (adminAddNewsBtn) {
    adminAddNewsBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
  }
  const adminAddImpactBtn = document.getElementById('adminAddImpactBtn');
  if (adminAddImpactBtn) {
    adminAddImpactBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
  }
  const adminEditStatsBtn = document.getElementById('adminEditStatsBtn');
  if (adminEditStatsBtn) {
    adminEditStatsBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
  }
  renderProducts();
  renderNews();
  renderImpact();
  loadMembers();
  updateLoginUI();
}

function updateLoginUI() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  // Inject status area if missing
  let statusEl = document.getElementById('loginStatus');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'loginStatus';
    statusEl.style.marginTop = '1rem';
    loginForm.parentNode.insertBefore(statusEl, loginForm.nextSibling);
  }

  if (isLoggedIn()) {
    statusEl.innerHTML = `
      <p style="color:var(--green, #2d5a3d); font-weight:600;">
        Logged in as <strong>${escapeHtml(currentUser.name || currentUser.username)}</strong>
        (${escapeHtml(currentUser.role)})
      </p>
      <button type="button" class="btn btn-sm btn-outline" id="logoutBtn" style="margin-top:0.5rem;">
        <i class="fas fa-sign-out-alt"></i> Log out
      </button>
    `;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('nth_token');
        localStorage.removeItem('nth_user');
        updateAdminUI();
      });
    }
  } else {
    statusEl.innerHTML = '';
  }
}

// ============================================================
//  MODAL HANDLING
// ============================================================
const modalExtra = document.getElementById('modalExtra');

function openModal(type, data = null) {
  editingType = type;
  modalExtra.style.display = 'none';
  modalExtra.value = '';
  if (type === 'product') {
    modalTitle.textContent = data ? 'Edit Product' : 'Add Product';
    modalName.value = data ? data.name : '';
    modalDesc.value = data ? data.description : '';
    modalPrice.value = data ? data.price : '';
    editId.value = data ? data.id : '';
    modalPrice.placeholder = 'Price (e.g. K 6,500 / litre)';
    modalPrice.style.display = 'block';
  } else if (type === 'news') {
    modalTitle.textContent = data ? 'Edit News' : 'Add News';
    modalName.value = data ? data.title : '';
    modalDesc.value = data ? data.excerpt : '';
    modalPrice.value = data ? data.date : '';
    editId.value = data ? data.id : '';
    modalPrice.placeholder = 'Date (e.g. April 1, 2026)';
    modalPrice.style.display = 'block';
  } else if (type === 'impact') {
    modalTitle.textContent = data ? 'Edit Impact Story' : 'Add Impact Story';
    modalName.value = data ? data.name : '';
    modalDesc.value = data ? data.text : '';
    modalPrice.value = data ? data.meta : '';
    editId.value = data ? data.id : '';
    modalPrice.placeholder = 'Meta (e.g. Machinga District)';
    modalPrice.style.display = 'block';
    modalExtra.value = data ? (data.color || '') : '';
    modalExtra.style.display = 'block';
  }
  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
  adminForm.reset();
  editId.value = '';
  if (modalExtra) modalExtra.style.display = 'none';
}

if (modalClose) modalClose.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
  if (e.target === settingsModal) closeSettingsModal();
});

// ============================================================
//  SITE SETTINGS MODAL (hero stats)
// ============================================================
const settingsModal = document.getElementById('settingsModal');
const settingsModalClose = document.getElementById('settingsModalClose');
const settingsForm = document.getElementById('settingsForm');
const adminEditStatsBtnEl = document.getElementById('adminEditStatsBtn');

function openSettingsModal() {
  document.getElementById('settingsMembers').value = document.getElementById('statMembers')?.textContent || '';
  document.getElementById('settingsSoya').value = document.getElementById('statSoya')?.textContent || '';
  document.getElementById('settingsProcessing').value = document.getElementById('statProcessing')?.textContent || '';
  settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
  settingsModal.style.display = 'none';
}

if (adminEditStatsBtnEl) adminEditStatsBtnEl.addEventListener('click', openSettingsModal);
if (settingsModalClose) settingsModalClose.addEventListener('click', closeSettingsModal);

if (settingsForm) {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAdmin()) {
      alert('Admin login required');
      return;
    }
    try {
      await apiSend('PUT', '/settings', {
        statMembers: document.getElementById('settingsMembers').value.trim(),
        statSoyaFarmers: document.getElementById('settingsSoya').value.trim(),
        statProcessing: document.getElementById('settingsProcessing').value.trim()
      });
      await loadSettings();
      closeSettingsModal();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  });
}

// ============================================================
//  ADMIN FORM SUBMIT → real API
// ============================================================
if (adminForm) {
  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAdmin()) {
      alert('Admin login required');
      return;
    }

    const id = editId.value ? parseInt(editId.value, 10) : null;
    const name = modalName.value.trim();
    const desc = modalDesc.value.trim();
    const price = modalPrice.value.trim();

    try {
      if (editingType === 'product') {
        if (id) {
          await apiSend('PUT', `/products/${id}`, { name, description: desc, price });
        } else {
          await apiSend('POST', '/products', { name, description: desc, price });
        }
        productsData = await apiGet('/products');
        renderProducts();
      } else if (editingType === 'news') {
        if (id) {
          await apiSend('PUT', `/news/${id}`, { title: name, excerpt: desc, date: price });
        } else {
          await apiSend('POST', '/news', { title: name, excerpt: desc, date: price });
        }
        newsData = await apiGet('/news');
        renderNews();
      } else if (editingType === 'impact') {
        const color = modalExtra.value.trim() || undefined;
        if (id) {
          await apiSend('PUT', `/impact/${id}`, { name, text: desc, meta: price, color });
        } else {
          await apiSend('POST', '/impact', { name, text: desc, meta: price, color });
        }
        impactData = await apiGet('/impact');
        renderImpact();
      }
      closeModal();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  });
}

// ============================================================
//  EVENT DELEGATION (orders, admin actions)
// ============================================================
document.addEventListener('click', async (e) => {
  // Order button → collect details and POST
  if (e.target.closest('.order-btn')) {
    const btn = e.target.closest('.order-btn');
    const productId = btn.dataset.id;
    const productName = btn.dataset.name || '';

    const customerName = prompt('Your full name:');
    if (!customerName) return;
    const customerEmail = prompt('Your email:');
    if (!customerEmail) return;
    const customerPhone = prompt('Phone (optional):') || '';
    const quantity = prompt('Quantity:', '1') || '1';

    try {
      const result = await apiSend('POST', '/orders', {
        productId,
        productName,
        quantity,
        customerName,
        customerEmail,
        customerPhone
      });
      alert(`✅ Order received!\n\nOrder ID: ${result.order.id}\nWe will contact you at ${customerEmail}.`);
    } catch (err) {
      alert('Order failed: ' + err.message);
    }
    return;
  }

  if (!isAdmin()) return;

  // Edit product
  if (e.target.closest('.edit-product')) {
    const btn = e.target.closest('.edit-product');
    const id = parseInt(btn.dataset.id, 10);
    const product = productsData.find(p => p.id === id);
    if (product) openModal('product', product);
  }

  // Delete product
  if (e.target.closest('.delete-product')) {
    const btn = e.target.closest('.delete-product');
    const id = parseInt(btn.dataset.id, 10);
    if (!confirm('Delete this product?')) return;
    try {
      await apiSend('DELETE', `/products/${id}`);
      productsData = await apiGet('/products');
      renderProducts();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  // Edit news
  if (e.target.closest('.edit-news')) {
    const btn = e.target.closest('.edit-news');
    const id = parseInt(btn.dataset.id, 10);
    const news = newsData.find(n => n.id === id);
    if (news) openModal('news', news);
  }

  // Delete news
  if (e.target.closest('.delete-news')) {
    const btn = e.target.closest('.delete-news');
    const id = parseInt(btn.dataset.id, 10);
    if (!confirm('Delete this news?')) return;
    try {
      await apiSend('DELETE', `/news/${id}`);
      newsData = await apiGet('/news');
      renderNews();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  // Edit impact story
  if (e.target.closest('.edit-impact')) {
    const btn = e.target.closest('.edit-impact');
    const id = parseInt(btn.dataset.id, 10);
    const story = impactData.find(s => s.id === id);
    if (story) openModal('impact', story);
  }

  // Delete impact story
  if (e.target.closest('.delete-impact')) {
    const btn = e.target.closest('.delete-impact');
    const id = parseInt(btn.dataset.id, 10);
    if (!confirm('Delete this impact story?')) return;
    try {
      await apiSend('DELETE', `/impact/${id}`);
      impactData = await apiGet('/impact');
      renderImpact();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }
});

if (adminAddProductBtn) {
  adminAddProductBtn.addEventListener('click', () => openModal('product'));
}
if (adminAddNewsBtn) {
  adminAddNewsBtn.addEventListener('click', () => openModal('news'));
}
const adminAddImpactBtnEl = document.getElementById('adminAddImpactBtn');
if (adminAddImpactBtnEl) {
  adminAddImpactBtnEl.addEventListener('click', () => openModal('impact'));
}

// ============================================================
//  MEMBERSHIP / LOGIN FORM
// ============================================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = loginForm.querySelector('input[type="text"], input[name="username"], #loginUsername');
    const passwordInput = loginForm.querySelector('input[type="password"], input[name="password"], #loginPassword');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    try {
      const data = await apiSend('POST', '/auth/login', { username, password });
      if (!data || !data.token || !data.user) {
        throw new Error('Unexpected response from server');
      }
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('nth_token', authToken);
      localStorage.setItem('nth_user', JSON.stringify(currentUser));
      updateAdminUI();

      if (currentUser.role === 'member' || currentUser.role === 'admin') {
        // Optional: load member dashboard info
        try {
          const dash = await apiSend('GET', '/member/dashboard');
          console.log('Member dashboard:', dash);
          alert(`Welcome, ${currentUser.name}!\n\nYou now have access to the member portal resources.`);
        } catch (_) {
          alert(`Welcome, ${currentUser.name}!`);
        }
      }
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  });
}

// ============================================================
//  MEMBER REGISTRATION → real API
// ============================================================
const registerModal = document.getElementById('registerModal');
const registerModalClose = document.getElementById('registerModalClose');
const openRegisterBtn = document.getElementById('openRegisterBtn');
const registerForm = document.getElementById('registerForm');

if (openRegisterBtn) {
  openRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (registerModal) registerModal.style.display = 'flex';
  });
}
if (registerModalClose) {
  registerModalClose.addEventListener('click', () => {
    if (registerModal) registerModal.style.display = 'none';
  });
}
window.addEventListener('click', (e) => {
  if (e.target === registerModal) registerModal.style.display = 'none';
});

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName')?.value?.trim();
    const username = document.getElementById('registerUsername')?.value?.trim();
    const email = document.getElementById('registerEmail')?.value?.trim();
    const phone = document.getElementById('registerPhone')?.value?.trim() || '';
    const password = document.getElementById('registerPassword')?.value || '';
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value || '';

    if (!name || !username || !email || !password) {
      alert('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const data = await apiSend('POST', '/auth/register', { name, username, email, phone, password });
      if (!data || !data.token || !data.user) {
        throw new Error('Unexpected response from server');
      }
      // Auto sign-in after successful registration
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('nth_token', authToken);
      localStorage.setItem('nth_user', JSON.stringify(currentUser));
      updateAdminUI();

      registerForm.reset();
      if (registerModal) registerModal.style.display = 'none';
      alert(`✅ Welcome, ${currentUser.name}! Your member account has been created and you are now signed in.`);
    } catch (err) {
      alert('Registration failed: ' + err.message);
    }
  });
}

// ============================================================
//  GATED PROPOSAL REQUEST → real API
// ============================================================
const proposalModal = document.getElementById('proposalModal');
const proposalModalClose = document.getElementById('proposalModalClose');
const requestProposalBtn = document.getElementById('requestProposalBtn');
const proposalForm = document.getElementById('proposalForm');

if (requestProposalBtn) {
  requestProposalBtn.addEventListener('click', () => {
    if (proposalModal) proposalModal.style.display = 'flex';
  });
}
if (proposalModalClose) {
  proposalModalClose.addEventListener('click', () => {
    if (proposalModal) proposalModal.style.display = 'none';
  });
}
window.addEventListener('click', (e) => {
  if (e.target === proposalModal) proposalModal.style.display = 'none';
});

if (proposalForm) {
  proposalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('proposalName')?.value?.trim();
    const email = document.getElementById('proposalEmail')?.value?.trim();
    const org = document.getElementById('proposalOrg')?.value?.trim() || '';
    const purpose = document.getElementById('proposalPurpose')?.value?.trim();

    if (!name || !email || !purpose) {
      alert('Please fill in name, email and purpose');
      return;
    }

    try {
      const result = await apiSend('POST', '/proposals', { name, email, org, purpose });
      alert(`✅ ${result.message || 'Request received.'}\n\nWe will email ${email} within 24 hours.`);
      proposalForm.reset();
      if (proposalModal) proposalModal.style.display = 'none';
    } catch (err) {
      alert('Request failed: ' + err.message);
    }
  });
}

// ============================================================
//  CONTACT FORM → real API
// ============================================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl = contactForm.querySelector('[name="name"], #contactName, input[type="text"]');
    const emailEl = contactForm.querySelector('[name="email"], #contactEmail, input[type="email"]');
    const subjectEl = contactForm.querySelector('[name="subject"], #contactSubject');
    const messageEl = contactForm.querySelector('[name="message"], #contactMessage, textarea');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const subject = subjectEl ? subjectEl.value.trim() : '';
    const message = messageEl ? messageEl.value.trim() : '';

    if (!name || !email || !message) {
      alert('Please fill in name, email and message');
      return;
    }

    try {
      const result = await apiSend('POST', '/contact', { name, email, subject, message });
      alert(`✅ ${result.message || 'Message sent. Thank you!'}`);
      contactForm.reset();
    } catch (err) {
      alert('Send failed: ' + err.message);
    }
  });
}

// ============================================================
//  HAMBURGER MENU
// ============================================================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ============================================================
//  LANGUAGE TOGGLE (still demo – wire real i18n later)
// ============================================================
const langToggle = document.getElementById('langToggle');
if (langToggle) {
  langToggle.addEventListener('click', function () {
    this.innerHTML = this.innerHTML.includes('EN')
      ? '<i class="fas fa-globe"></i> CH'
      : '<i class="fas fa-globe"></i> EN';
  });
}

// ============================================================
//  HEADER SCROLL EFFECT
// ============================================================
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (header) header.classList.toggle('scrolled', window.scrollY > 50);
});

// ============================================================
//  INIT
// ============================================================
updateAdminUI();
loadAllData();
