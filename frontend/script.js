// ============================================================
//  CONFIGURATION – Set your backend base URL here
// ============================================================
const API_BASE = 'https://api.nthakayathu.coop/v1'; // Replace with your actual backend

// ============================================================
//  DATA – Default products, news, impact stories (soya-focused)
// ============================================================
let productsData = [
    { id: 1, name: 'Soya Oil', description: 'Premium, cold-pressed soya oil for cooking and industrial use.', price: 'K 6,500 / litre' },
    { id: 2, name: 'Soya Animal Feed', description: 'High-protein feed for poultry and livestock – made from our own soya.', price: 'K 4,200 / 50kg' },
    { id: 3, name: 'Soya Beans (Whole)', description: 'Non-GMO, high-quality soya beans for direct sale or further processing.', price: 'K 2,800 / kg' },
    { id: 4, name: 'Soya Flour', description: 'Gluten-free, protein-rich flour for baking and food fortification.', price: 'K 3,500 / kg' }
];

let newsData = [
    { id: 1, date: 'May 10, 2026', title: 'New Soya Oil Press Installed', excerpt: 'Capacity increased to 500 litres per day, creating 15 new jobs.' },
    { id: 2, date: 'April 22, 2026', title: 'Soya Farmers’ Training Program', excerpt: 'Over 200 farmers trained in conservation agriculture and intercropping.' },
    { id: 3, date: 'March 5, 2026', title: 'Export Deal Signed with Regional Buyer', excerpt: 'Nthakayathu to supply 50 tonnes of soya beans to Zambia.' }
];

let impactData = [
    { id: 1, name: "Grace's Soya Success", text: '“I tripled my income by switching to soya. Nthakayathu gave me quality seeds and a guaranteed market.”', meta: 'Grace, soya farmer', color: '#4a7c59' },
    { id: 2, name: 'Youth in Soya Processing', text: '“We run the oil pressing unit – the cooperative trained us and now we manage production.”', meta: 'Charles, youth leader', color: '#8b6b4d' },
    { id: 3, name: 'Community Nutrition', text: '“Soya flour has improved the health of our children. The cooperative supports school feeding programs.”', meta: 'Ester, community health worker', color: '#d4a84b' }
];

// ============================================================
//  ADMIN MODE DETECTION
// ============================================================
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('admin') === 'true';

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
//  RENDER FUNCTIONS
// ============================================================
function renderProducts() {
    productsGrid.innerHTML = productsData.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-icon"><i class="fas fa-seedling"></i></div>
            <h3>${p.name}</h3>
            <p>${p.description}</p>
            <span class="price">${p.price}</span>
            <button class="btn btn-sm btn-gold order-btn" data-id="${p.id}">Order <i class="fas fa-arrow-right"></i></button>
            ${isAdmin ? `
                <div class="admin-controls">
                    <button class="btn btn-sm btn-outline edit-product" data-id="${p.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-product" data-id="${p.id}">Delete</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderNews() {
    newsGrid.innerHTML = newsData.map(n => `
        <article data-id="${n.id}">
            <time>${n.date}</time>
            <h4>${n.title}</h4>
            <p>${n.excerpt}</p>
            <a href="#">Read more →</a>
            ${isAdmin ? `
                <div class="admin-controls">
                    <button class="btn btn-sm btn-outline edit-news" data-id="${n.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-news" data-id="${n.id}">Delete</button>
                </div>
            ` : ''}
        </article>
    `).join('');
}

function renderImpact() {
    impactGrid.innerHTML = impactData.map(s => `
        <div class="story-card">
            <div class="story-avatar" style="background:${s.color};"><i class="fas fa-user"></i></div>
            <h4>${s.name}</h4>
            <p>${s.text}</p>
            <span class="story-meta">${s.meta}</span>
        </div>
    `).join('');
}

// ============================================================
//  ADMIN UI TOGGLE
// ============================================================
if (isAdmin) {
    adminAddProductBtn.style.display = 'inline-flex';
    adminAddNewsBtn.style.display = 'inline-flex';
    console.log('🛠️ Admin mode active');
} else {
    adminAddProductBtn.style.display = 'none';
    adminAddNewsBtn.style.display = 'none';
}

// ============================================================
//  MODAL HANDLING
// ============================================================
function openModal(type, data = null) {
    editingType = type;
    if (type === 'product') {
        modalTitle.textContent = data ? 'Edit Product' : 'Add Product';
        modalName.value = data ? data.name : '';
        modalDesc.value = data ? data.description : '';
        modalPrice.value = data ? data.price : '';
        editId.value = data ? data.id : '';
        modalPrice.style.display = 'block';
        // Remove any previous label
        const label = document.querySelector('label[for="modalPrice"]');
        if (label) label.remove();
    } else if (type === 'news') {
        modalTitle.textContent = data ? 'Edit News' : 'Add News';
        modalName.value = data ? data.title : '';
        modalDesc.value = data ? data.excerpt : '';
        modalPrice.value = data ? data.date : '';
        editId.value = data ? data.id : '';
        modalPrice.placeholder = 'Date (e.g. April 1, 2026)';
        modalPrice.style.display = 'block';
    }
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    adminForm.reset();
    editId.value = '';
}

modalClose.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// ============================================================
//  ADMIN FORM SUBMIT
// ============================================================
adminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editId.value ? parseInt(editId.value) : null;
    const name = modalName.value.trim();
    const desc = modalDesc.value.trim();
    const price = modalPrice.value.trim();

    if (editingType === 'product') {
        if (id) {
            const index = productsData.findIndex(p => p.id === id);
            if (index !== -1) {
                productsData[index] = { ...productsData[index], name, description: desc, price };
            }
        } else {
            const newId = Date.now();
            productsData.push({ id: newId, name, description: desc, price });
        }
        renderProducts();
        // saveToBackend('products', productsData);
    } else if (editingType === 'news') {
        if (id) {
            const index = newsData.findIndex(n => n.id === id);
            if (index !== -1) {
                newsData[index] = { ...newsData[index], title: name, excerpt: desc, date: price };
            }
        } else {
            const newId = Date.now();
            newsData.push({ id: newId, date: price, title: name, excerpt: desc });
        }
        renderNews();
        // saveToBackend('news', newsData);
    }
    closeModal();
});

// ============================================================
//  EVENT DELEGATION (admin actions, order buttons)
// ============================================================
document.addEventListener('click', (e) => {
    // Order button
    if (e.target.closest('.order-btn')) {
        const btn = e.target.closest('.order-btn');
        alert(`Order placed for product ID ${btn.dataset.id} (demo)`);
        return;
    }

    if (!isAdmin) return;

    // Edit product
    if (e.target.closest('.edit-product')) {
        const btn = e.target.closest('.edit-product');
        const id = parseInt(btn.dataset.id);
        const product = productsData.find(p => p.id === id);
        if (product) openModal('product', product);
    }

    // Delete product
    if (e.target.closest('.delete-product')) {
        const btn = e.target.closest('.delete-product');
        const id = parseInt(btn.dataset.id);
        if (confirm('Delete this product?')) {
            productsData = productsData.filter(p => p.id !== id);
            renderProducts();
        }
    }

    // Edit news
    if (e.target.closest('.edit-news')) {
        const btn = e.target.closest('.edit-news');
        const id = parseInt(btn.dataset.id);
        const news = newsData.find(n => n.id === id);
        if (news) openModal('news', news);
    }

    // Delete news
    if (e.target.closest('.delete-news')) {
        const btn = e.target.closest('.delete-news');
        const id = parseInt(btn.dataset.id);
        if (confirm('Delete this news?')) {
            newsData = newsData.filter(n => n.id !== id);
            renderNews();
        }
    }
});

// Add product & news buttons
adminAddProductBtn.addEventListener('click', () => openModal('product'));
adminAddNewsBtn.addEventListener('click', () => openModal('news'));

// ============================================================
//  BACKEND SYNC (placeholder)
// ============================================================
async function saveToBackend(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to sync');
        console.log(`Synced ${endpoint} to backend`);
    } catch (error) {
        console.warn('Backend sync error (demo mode):', error);
    }
}

// ============================================================
//  GATED PROPOSAL REQUEST LOGIC
// ============================================================
const proposalModal = document.getElementById('proposalModal');
const proposalModalClose = document.getElementById('proposalModalClose');
const requestProposalBtn = document.getElementById('requestProposalBtn');
const proposalForm = document.getElementById('proposalForm');

if (requestProposalBtn) {
    requestProposalBtn.addEventListener('click', () => {
        proposalModal.style.display = 'flex';
    });
}
if (proposalModalClose) {
    proposalModalClose.addEventListener('click', () => {
        proposalModal.style.display = 'none';
    });
}
window.addEventListener('click', (e) => {
    if (e.target === proposalModal) proposalModal.style.display = 'none';
});

if (proposalForm) {
    proposalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('proposalName').value;
        const email = document.getElementById('proposalEmail').value;
        const org = document.getElementById('proposalOrg').value;
        const purpose = document.getElementById('proposalPurpose').value;

        console.log('Proposal Request:', { name, email, org, purpose });
        alert(`✅ Thank you, ${name}!\n\nWe have received your request for the full proposal.\nA verification link will be sent to ${email} within 24 hours.\n\n(Simulated – in production, the backend would email you the secured PDF.)`);
        proposalForm.reset();
        proposalModal.style.display = 'none';
    });
}

// ============================================================
//  HAMBURGER MENU TOGGLE
// ============================================================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ============================================================
//  LANGUAGE TOGGLE (demo)
// ============================================================
document.getElementById('langToggle').addEventListener('click', function () {
    this.innerHTML = this.innerHTML.includes('EN') ? '<i class="fas fa-globe"></i> CH' : '<i class="fas fa-globe"></i> EN';
});

// ============================================================
//  HEADER SCROLL EFFECT
// ============================================================
window.addEventListener('scroll', () => {
    document.querySelector('header').classList.toggle('scrolled', window.scrollY > 50);
});

// ============================================================
//  INITIAL RENDER
// ============================================================
renderProducts();
renderNews();
renderImpact();

// ============================================================
//  (Optional) Fetch data from backend on load
// ============================================================
// async function fetchData() {
//   try {
//     const res = await fetch(`${API_BASE}/products`);
//     const data = await res.json();
//     productsData = data;
//     renderProducts();
//   } catch (e) { console.warn('Using local data'); }
// }
// fetchData();
