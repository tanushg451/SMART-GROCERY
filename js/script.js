// ===== CART MANAGEMENT =====
function getCart() {
  return JSON.parse(localStorage.getItem('groceryCart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('groceryCart', JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCart().reduce((s, i) => s + (i.qty || 1), 0);
  badges.forEach(b => b.textContent = count);
}
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) { existing.qty = (existing.qty || 1) + 1; }
  else { cart.push({ ...product, qty: 1 }); }
  saveCart(cart);
  showNotification(product.name + ' added to cart!');
}
function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
  if (typeof renderCart === 'function') renderCart();
}

// ===== NOTIFICATION =====
function showNotification(msg) {
  let n = document.getElementById('notification');
  if (!n) {
    n = document.createElement('div');
    n.id = 'notification';
    n.className = 'notification';
    n.innerHTML = '<span class="check">✓</span><span class="msg"></span>';
    document.body.appendChild(n);
  }
  n.querySelector('.msg').textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 2500);
}

// ===== LOAD PRODUCTS FROM XML =====
function loadProducts(callback) {
  fetch('data/products.xml')
    .then(r => r.text())
    .then(text => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const items = xml.querySelectorAll('product');
      const products = [];
      items.forEach(item => {
        products.push({
          id: item.getAttribute('id'),
          category: item.getAttribute('category'),
          name: item.querySelector('name').textContent,
          price: parseInt(item.querySelector('price').textContent),
          unit: item.querySelector('unit').textContent,
          image: item.querySelector('image').textContent,
          description: item.querySelector('description').textContent,
        });
      });
      callback(products);
    });
}

// ===== RENDER PRODUCT CARDS =====
function renderProducts(products, container) {
  container.innerHTML = products.map(p => `
    <div class="product-card">
      <span class="category-tag">${p.category}</span>
      <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200/1a1a2e/00d4aa?text=${encodeURIComponent(p.name)}'">
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="description">${p.description}</p>
        <div class="price-row">
          <div><span class="price">₹${p.price}</span> <span class="unit">/ ${p.unit}</span></div>
          <button class="add-cart-btn" onclick='addToCart(${JSON.stringify(p)})'>+ Add</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== HAMBURGER =====
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  const ham = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (ham && links) {
    ham.addEventListener('click', () => links.classList.toggle('open'));
  }
});

// ===== AUTH MODAL =====
function openModal(type) {
  const overlay = document.getElementById('authModal');
  if (!overlay) return;
  overlay.classList.add('show');
  document.getElementById('modalTitle').textContent = type === 'login' ? 'Welcome Back' : 'Create Account';
  document.getElementById('signupFields').style.display = type === 'signup' ? 'block' : 'none';
  document.getElementById('switchText').innerHTML = type === 'login'
    ? 'No account? <a onclick="openModal(\'signup\')">Sign up</a>'
    : 'Have an account? <a onclick="openModal(\'login\')">Log in</a>';
}
function closeModal() {
  const overlay = document.getElementById('authModal');
  if (overlay) overlay.classList.remove('show');
}

// ===== SMART RECOMMENDATION ENGINE =====
function getRecommendations(familySize, budget) {
  const weeklyItems = [
    { name: 'Rice', baseQty: 1, unit: 'kg', pricePerUnit: 70, category: 'Staples', essential: true },
    { name: 'Wheat Flour', baseQty: 1, unit: 'kg', pricePerUnit: 56, category: 'Staples', essential: true },
    { name: 'Cooking Oil', baseQty: 0.5, unit: 'litre', pricePerUnit: 210, category: 'Staples', essential: true },
    { name: 'Dal (Toor)', baseQty: 0.5, unit: 'kg', pricePerUnit: 160, category: 'Staples', essential: true },
    { name: 'Sugar', baseQty: 0.25, unit: 'kg', pricePerUnit: 48, category: 'Staples', essential: true },
    { name: 'Milk', baseQty: 3.5, unit: 'litre', pricePerUnit: 68, category: 'Dairy', essential: true },
    { name: 'Curd', baseQty: 0.5, unit: 'kg', pricePerUnit: 90, category: 'Dairy', essential: false },
    { name: 'Paneer', baseQty: 0.25, unit: 'kg', pricePerUnit: 320, category: 'Dairy', essential: false },
    { name: 'Onions', baseQty: 1, unit: 'kg', pricePerUnit: 50, category: 'Vegetables', essential: true },
    { name: 'Tomatoes', baseQty: 1, unit: 'kg', pricePerUnit: 40, category: 'Vegetables', essential: true },
    { name: 'Potatoes', baseQty: 1, unit: 'kg', pricePerUnit: 35, category: 'Vegetables', essential: true },
    { name: 'Green Veggies', baseQty: 0.5, unit: 'kg', pricePerUnit: 60, category: 'Vegetables', essential: false },
    { name: 'Capsicum', baseQty: 0.25, unit: 'kg', pricePerUnit: 160, category: 'Vegetables', essential: false },
    { name: 'Bananas', baseQty: 0.5, unit: 'dozen', pricePerUnit: 45, category: 'Fruits', essential: false },
    { name: 'Apples', baseQty: 0.5, unit: 'kg', pricePerUnit: 180, category: 'Fruits', essential: false },
    { name: 'Bread', baseQty: 1, unit: 'pack', pricePerUnit: 45, category: 'Packaged', essential: false },
    { name: 'Eggs', baseQty: 6, unit: 'pcs', pricePerUnit: 8, category: 'Protein', essential: false },
    { name: 'Tea/Coffee', baseQty: 0.1, unit: 'kg', pricePerUnit: 400, category: 'Beverages', essential: false },
    { name: 'Spices Mix', baseQty: 0.1, unit: 'kg', pricePerUnit: 300, category: 'Spices', essential: true },
    { name: 'Butter', baseQty: 0.1, unit: 'kg', pricePerUnit: 560, category: 'Dairy', essential: false },
  ];

  const multiplier = 0.5 + (familySize * 0.5);
  let results = [];
  let total = 0;

  // Add essentials first
  const essentials = weeklyItems.filter(i => i.essential);
  const extras = weeklyItems.filter(i => !i.essential);

  for (const item of essentials) {
    const qty = Math.round(item.baseQty * multiplier * 10) / 10;
    const cost = Math.round(qty * item.pricePerUnit);
    if (total + cost <= budget) {
      results.push({ ...item, qty, cost });
      total += cost;
    }
  }
  for (const item of extras) {
    const qty = Math.round(item.baseQty * multiplier * 10) / 10;
    const cost = Math.round(qty * item.pricePerUnit);
    if (total + cost <= budget) {
      results.push({ ...item, qty, cost });
      total += cost;
    }
  }
  return { items: results, total };
}
