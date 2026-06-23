"use client";

import { useStore } from "@/context/StoreContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { 
    globalProducts: products, categories, employees, orders, 
    addProduct, editProduct, deleteProduct, 
    addCategory, editCategory, deleteCategory,
    updateEmployeeBalance, issueAnnualBucks, addEmployee, editEmployee, deleteEmployee, updateOrderStatus,
    logout, currentUser,
    credits, cart, addToCart, removeFromCart, cartTotal, isCartOpen, setIsCartOpen,
    checkout
  } = useStore();
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('shop'); // default is now the Shop tab based on screenshot
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  
  const [isSaving, setIsSaving] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentCategorySelection, setParentCategorySelection] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: number, name: string} | null>(null);

  // Add/Edit Employee Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isSavingEmp, setIsSavingEmp] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({ name: '', email: '', password: '', site: 'Apprentice', balance: '50', role: 'employee', hireDate: '' });
  
  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', price: '', desc: '', image: '', categoryId: '', sizes: '', colors: '', gallery: '', isTopPick: false, inStock: true });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Quick balance adjust state
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [adjustBalanceVal, setAdjustBalanceVal] = useState('250');
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);

  // Employee Credit History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryEmpId, setSelectedHistoryEmpId] = useState<string | null>(null);

  // Shop filter and navigation state
  const [searchQuery, setSearchQuery] = useState('');
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Product details choices state
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [activeImage, setActiveImage] = useState<string>('');
  const [activeDetailTab, setActiveDetailTab] = useState('details');
  
  // Checkout states
  const [deliverySite, setDeliverySite] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Language switcher state & logic
  const [currentLang, setCurrentLang] = useState('en');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All statuses');

  useEffect(() => {
    const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
    if (match) {
      const parts = match[2].split('/');
      const code = parts[parts.length - 1];
      if (code) {
        setCurrentLang(code);
      }
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    
    // Set Google Translate cookie
    const cookieValue = `/en/${langCode}`;
    
    // 1. Set without domain (host-only)
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    
    // 2. Set for all domain and parent domain combinations (with and without dot prefix)
    const host = window.location.hostname;
    const parts = host.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const domain = parts.slice(i).join('.');
      if (domain) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain};`;
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${domain};`;
      }
    }
    
    // Reload to apply translation
    window.location.reload();
  };

  const colorMap: { [key: string]: string } = {
    'Black': '#000000',
    'White': '#ffffff',
    'Red': '#ef4444',
    'Blue': '#3b82f6',
    'Navy': '#1e3a8a',
    'Grey': '#64748b',
    'Gray': '#64748b',
    'Green': '#22c55e',
    'Yellow': '#eab308',
    'Orange': '#f97316',
    'Purple': '#a855f7',
    'Pink': '#ec4899',
    'Brown': '#78350f',
    'Beige': '#f5f5dc',
    'Maroon': '#800000',
    'Gold': '#ffd700',
    'Silver': '#c0c0c0',
    'Charcoal': '#36454f'
  };

  const levelCreditsMap: { [key: string]: number } = {
    'Apprentice': 50,
    'Journeyman': 100,
    'Shop': 100,
    'Office': 150,
    'Lead Carpenter': 150,
    'Senior Estimator': 150,
    'Safety': 150,
    'Foreman': 200,
    'Project Manager': 250,
    'Admin Manager': 250,
    'Executive': 250
  };

  const handleOpenModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ 
        title: product.title, 
        price: product.price.toString(), 
        desc: product.description || product.desc || '', 
        image: product.image, 
        categoryId: product.category_id?.toString() || '', 
        sizes: product.sizes ? product.sizes.join(', ') : '',
        colors: product.colors ? product.colors.join(', ') : '',
        gallery: product.gallery ? product.gallery.filter((g: string) => g !== 'out_of_stock').join(', ') : '',
        isTopPick: product.is_top_pick || false,
        inStock: !product.gallery?.includes('out_of_stock')
      });
    } else {
      setEditingProduct(null);
      setFormData({ title: '', price: '', desc: '', image: '', categoryId: '', sizes: '', colors: '', gallery: '', isTopPick: false, inStock: true });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.title || !formData.price || (!formData.image && !imageFile)) return alert("Please fill all required fields.");
    setIsSaving(true);
    try {
      const cleanGallery = formData.gallery ? formData.gallery.split(',').map(g => g.trim()).filter(Boolean) : [];
      const galleryData = formData.inStock ? cleanGallery : [...cleanGallery, 'out_of_stock'];

      const productData = { 
        ...formData, 
        price: Number(formData.price), 
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        gallery: galleryData
      };
      if (editingProduct) {
        await editProduct(editingProduct.id, productData, imageFile || undefined);
      } else {
        await addProduct(productData, imageFile || undefined);
      }
      setIsModalOpen(false);
    } catch (e: any) {
      alert("Error saving product: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const finalName = parentCategorySelection 
      ? `${parentCategorySelection} > ${newCategoryName.trim()}`
      : newCategoryName.trim();
    await addCategory(finalName);
    setNewCategoryName('');
    setParentCategorySelection('');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleQuickBalanceUpdate = async () => {
    if (!selectedEmpId) return alert("Please select an employee.");
    setIsAdjustingBalance(true);
    try {
      await updateEmployeeBalance(selectedEmpId, Number(adjustBalanceVal) || 0);
      alert("Balance updated successfully!");
    } catch (e: any) {
      alert("Error updating balance: " + e.message);
    } finally {
      setIsAdjustingBalance(false);
    }
  };

  const handleAddToCart = (product: any) => {
    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
    const color = product.colors && product.colors.length > 0 ? product.colors[0] : undefined;
    addToCart(product, size, color);
  };

  const handleCheckout = async () => {
    const deliveryInfo = {
      name: currentUser?.name,
      email: currentUser?.email,
      employeeId: currentUser?.id,
      site: deliverySite,
      notes: deliveryNotes
    };
    const success = await checkout(deliveryInfo);
    if (success) {
      setOrderPlaced(true);
    }
  };

  const handleProductClick = (product: any) => {
    setSelectedProductId(product.id);
    setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : undefined);
    setActiveImage(product.image);
    setActiveDetailTab('details');
  };

  // Calculations for stats
  const totalCredits = employees.reduce((acc, emp) => acc + emp.balance, 0);
  const activeEmployeesCount = employees.length;
  const totalOrdersCount = orders.filter(o => o.items > 0).length;
  const pendingOrdersCount = orders.filter(o => o.items > 0 && o.status === 'Processing').length;

  // Category & Subcategory logic
  const uniqueParents = Array.from(new Set(categories.map(c => c.name.split(' > ')[0])));
  
  let activeParent = 'all';
  if (selectedCategory !== 'all') {
    if (selectedCategory.startsWith('parent:')) {
      activeParent = selectedCategory.replace('parent:', '');
    } else {
      const selectedCatObj = categories.find(c => c.id.toString() === selectedCategory);
      if (selectedCatObj) {
        activeParent = selectedCatObj.name.split(' > ')[0];
      }
    }
  }

  const activeParentSubs = categories.filter(c => {
    const parts = c.name.split(' > ');
    return parts.length > 1 && parts[0] === activeParent;
  });

  // Filter products for Shop
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = false;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory.startsWith('parent:')) {
      const parentName = selectedCategory.replace('parent:', '');
      const matchingCatIds = categories
        .filter(c => c.name === parentName || c.name.startsWith(parentName + ' > '))
        .map(c => c.id);
      matchesCategory = matchingCatIds.includes(product.category_id);
    } else {
      matchesCategory = product.category_id?.toString() === selectedCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <ProtectedRoute>
      <>
      <div className="admin-container">
        
        {/* ===== SIDEBAR ===== */}
        <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <img src="/logo.webp" alt="S.R. Freeman" className="brand-img" />
              <div className="brand-subtitle">S.R. FREEMAN</div>
            </div>
            
            {/* Language Switcher */}
            <div className="lang-switcher">
              <button 
                onClick={() => changeLanguage('en')} 
                className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
              >
                EN
              </button>
              <button 
                onClick={() => changeLanguage('es')} 
                className={`lang-btn ${currentLang === 'es' ? 'active' : ''}`}
              >
                ES
              </button>
            </div>

            {/* Sidebar Navigation */}
            <nav className="sidebar-nav">
              {currentUser?.role === 'super_admin' && (
                <>
                  <div className="menu-section-label">ADMIN PANEL</div>
                  <button 
                    onClick={() => { setActiveTab('overview'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                    className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                  >
                    <i className='bx bx-grid-alt'></i> Overview
                  </button>
                  <button 
                    onClick={() => { setActiveTab('orders'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                    className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                  >
                    <i className='bx bx-receipt'></i> Orders
                  </button>
                  <button 
                    onClick={() => { setActiveTab('employees'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                    className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
                  >
                    <i className='bx bx-group'></i> Employees
                  </button>
                  <button 
                    onClick={() => { setActiveTab('inventory'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                    className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
                  >
                    <i className='bx bx-box'></i> Products
                  </button>
                  <button 
                    onClick={() => { setActiveTab('categories'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                    className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                  >
                    <i className='bx bx-category'></i> Categories
                  </button>
                  {/*
                  <button 
                    onClick={() => { setActiveTab('srf_credits'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                    className={`nav-item ${activeTab === 'srf_credits' ? 'active' : ''}`}
                  >
                    <i className='bx bx-coin-stack'></i> SRF Credits
                  </button>
                  */}
                </>
              )}

              <div className="menu-section-label" style={{ marginTop: currentUser?.role === 'super_admin' ? '1.5rem' : '0rem' }}>STORE</div>
              <button 
                onClick={() => { setActiveTab('shop'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                className={`nav-item ${activeTab === 'shop' ? 'active' : ''}`}
              >
                <i className='bx bx-store'></i> Shop
              </button>
              
              <button 
                onClick={() => { setIsCartOpen(true); setIsSidebarOpen(false); }}
                className="nav-item"
                style={{ position: 'relative' }}
              >
                <i className='bx bx-shopping-bag'></i> Cart
                {cart.length > 0 && (
                  <span className="cart-badge-nav" style={{
                    position: 'absolute',
                    right: '1.5rem',
                    background: '#721D1D',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '50px'
                  }}>
                    {cart.length}
                  </span>
                )}
              </button>

              {currentUser?.role !== 'super_admin' && (
                <>
                  <button 
                    onClick={() => { setActiveTab('my_orders'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                    className={`nav-item ${activeTab === 'my_orders' ? 'active' : ''}`}
                  >
                    <i className='bx bx-receipt'></i> My Orders
                  </button>
                  <button 
                    onClick={() => { setActiveTab('my_settings'); setSelectedProductId(null); setIsSidebarOpen(false); }}
                    className={`nav-item ${activeTab === 'my_settings' ? 'active' : ''}`}
                  >
                    <i className='bx bx-cog'></i> Settings
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="sidebar-bottom">
            {/* Profile Section */}
            <div className="admin-profile">
              <div className="profile-avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="profile-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{currentUser?.name || "User"}</div>
                <div className="profile-role">
                  {currentUser?.role === 'super_admin' ? 'Administrator' : 'Employee'}
                </div>
                {currentUser?.role !== 'super_admin' && (
                  <div className="profile-balance-pill" style={{ marginTop: '0.3rem', background: 'rgba(130,19,43,0.15)', border: '1px solid rgba(130,19,43,0.3)', color: '#ffcdd2', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '50px', fontWeight: 'bold', width: 'fit-content' }}>
                    {credits} Bucks
                  </div>
                )}
              </div>
            </div>
            
            {/* Sign Out */}
            <button onClick={handleLogout} className="btn-signout">
              <i className='bx bx-log-out'></i> SIGN OUT
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

        {/* ===== MAIN CONTENT AREA ===== */}
        <main className="admin-main">
          
          {/* Header with Grid Pattern */}
          <header className="admin-header">
            <div className="header-grid-overlay"></div>
            
            {/* Mobile Header Toolbar */}
            <div className="mobile-header-bar">
              <button onClick={() => setIsSidebarOpen(true)} className="mobile-menu-trigger">
                <i className='bx bx-menu'></i>
              </button>
              <img src="/logo.webp" alt="S.R. Freeman" className="mobile-logo" />
              <button onClick={() => setIsCartOpen(true)} className="mobile-cart-trigger" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.8rem', cursor: 'pointer', position: 'relative', padding: 0, display: 'flex', alignItems: 'center' }}>
                <i className='bx bx-shopping-bag'></i>
                {cart.length > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#721D1D', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1.5px solid #0f172a' }}>
                    {cart.length}
                  </span>
                )}
              </button>
            </div>

            <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <div className="header-pretitle">
                  {activeTab === 'shop' ? '✦ EMPLOYEE STORE' : 'S.R. FREEMAN'}
                </div>
                <h1 className="header-title">
                  {activeTab === 'orders' ? 'ALL ORDERS' : 
                   activeTab === 'employees' ? 'EMPLOYEES' : 
                   activeTab === 'inventory' ? 'PRODUCTS' :
                   activeTab === 'categories' ? 'CATEGORIES' :
                   activeTab === 'srf_credits' ? 'SRF CREDITS' :
                   activeTab === 'my_orders' ? 'MY ORDERS' :
                   activeTab === 'shop' ? (
                     <>YOUR GEAR.<br />YOUR CREDITS.</>
                   ) :
                   currentUser?.role === 'super_admin' ? 'DASHBOARD' : 'EMPLOYEE PORTAL'}
                </h1>
                <div className="header-subtitle">
                  {activeTab === 'orders' ? 'MANAGE AND FULFILL EMPLOYEE ORDERS' :
                   activeTab === 'employees' ? 'MANAGE TEAM MEMBERS AND SRF CREDITS' :
                   activeTab === 'inventory' ? 'MANAGE CATALOG ITEMS AND INVENTORY' :
                   activeTab === 'categories' ? 'MANAGE PRODUCT CATEGORIES' :
                   activeTab === 'srf_credits' ? 'ISSUE AND MANAGE EMPLOYEE CREDITS' :
                   activeTab === 'my_orders' ? 'TRACK YOUR WORKWEAR ORDERS AND DELIVERY STATUS' :
                   activeTab === 'shop' ? 'Company apparel, earned by your crew. Spend your SRF Credits below.' :
                   currentUser?.role === 'super_admin' ? 'SRF APPAREL — COMMAND CENTER' :
                   `Welcome back, ${currentUser?.name || 'User'}! • Balance: ${credits} Bucks`}
                </div>
              </div>

              {/* Right-aligned Header content based on activeTab */}
              <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {activeTab === 'shop' && (
                  <div className="credits-glass-card" style={{ margin: 0 }}>
                    <span className="credits-glass-val">
                      {credits.toLocaleString()} <i className='bx bxs-coin-stack' style={{ fontSize: '2rem', verticalAlign: 'middle', color: '#fbbf24' }}></i>
                    </span>
                    <span className="credits-glass-lbl" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', fontWeight: 'bold' }}>SRF Credits Available</span>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="header-select-wrapper" style={{ position: 'relative' }}>
                    <select 
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="header-filter-select"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '0.6rem 2.5rem 0.6rem 1.2rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      <option value="All statuses" style={{ background: '#181313', color: 'white' }}>All statuses</option>
                      <option value="Pending" style={{ background: '#181313', color: 'white' }}>Pending</option>
                      <option value="Approved" style={{ background: '#181313', color: 'white' }}>Approved</option>
                      <option value="Fulfilling" style={{ background: '#181313', color: 'white' }}>Fulfilling</option>
                      <option value="Shipped" style={{ background: '#181313', color: 'white' }}>Shipped</option>
                      <option value="Delivered" style={{ background: '#181313', color: 'white' }}>Delivered</option>
                      <option value="Cancelled" style={{ background: '#181313', color: 'white' }}>Cancelled</option>
                    </select>
                    <i className='bx bx-chevron-down' style={{
                      position: 'absolute',
                      right: '0.9rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.6)',
                      pointerEvents: 'none',
                      fontSize: '1.1rem'
                    }}></i>
                  </div>
                )}

                {activeTab === 'inventory' && (
                  <>
                    <div className="header-search-wrapper" style={{ position: 'relative', width: '240px' }}>
                      <i className='bx bx-search' style={{
                        position: 'absolute',
                        left: '0.9rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255,255,255,0.6)',
                        pointerEvents: 'none',
                        fontSize: '1.1rem'
                      }}></i>
                      <input
                        type="text"
                        value={inventorySearchQuery}
                        onChange={(e) => setInventorySearchQuery(e.target.value)}
                        placeholder="Search products..."
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          color: 'white',
                          padding: '0.6rem 1rem 0.6rem 2.4rem',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          outline: 'none',
                          width: '100%',
                          fontFamily: 'var(--font-body)',
                          transition: 'all 0.2s',
                        }}
                        className="header-search-input-field"
                      />
                    </div>
                    <button 
                      onClick={() => handleOpenModal()}
                      style={{ 
                        background: 'white', 
                        color: '#721D1D', 
                        border: 'none', 
                        borderRadius: '50px', 
                        padding: '0.7rem 1.6rem', 
                        fontWeight: '800', 
                        fontSize: '0.82rem', 
                        letterSpacing: '1px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <i className='bx bx-plus' style={{ fontWeight: '900', fontSize: '1rem' }}></i> ADD PRODUCT
                    </button>
                  </>
                )}


              </div>
            </div>
          </header>

          {/* Page Body Wrapper */}
          <div className="admin-body">
            
            {/* 0. SHOP TAB */}
            {activeTab === 'shop' && (
              <div className="tab-pane">
                
                {/* --- A. SINGLE PRODUCT DETAILS SCREEN --- */}
                {selectedProductId && selectedProduct ? (
                  <div className="product-detail-view">
                    
                    {/* Back to Shop Navigation */}
                    <button onClick={() => setSelectedProductId(null)} className="back-to-shop-btn">
                      <i className='bx bx-left-arrow-alt'></i> Back to Shop
                    </button>

                    <div className="product-view-grid">
                      
                      {/* Gallery Gallery Displays */}
                      <div className="product-view-gallery">
                        <div className="main-image-frame">
                          <img 
                            src={activeImage || selectedProduct.image} 
                            alt={selectedProduct.title} 
                            className="main-image" 
                          />
                        </div>

                        {/* Thumbnail Images */}
                        {selectedProduct.gallery && selectedProduct.gallery.filter((g: string) => g !== 'out_of_stock').length > 0 && (
                          <div className="thumbnails-grid">
                            {[selectedProduct.image, ...selectedProduct.gallery.filter((g: string) => g !== 'out_of_stock')].map((img: string, idx: number) => (
                              <div 
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`thumbnail-frame ${activeImage === img ? 'active' : ''}`}
                              >
                                <img src={img} alt="Thumbnail preview" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right side options details */}
                      <div className="product-view-info">
                        <span className="excl-label">SRF APPAREL EXCLUSIVE</span>
                        <h1 className="product-detail-title">{selectedProduct.title}</h1>
                        
                        <div className="product-detail-price">
                          {selectedProduct.price} <i className='bx bxs-coin-stack' style={{ color: '#fbbf24' }}></i>
                        </div>

                        <p className="product-detail-desc">
                          {selectedProduct.description || selectedProduct.desc || 'Premium SRF workwear engineered for durability and comfort on the job site.'}
                        </p>

                        {/* Sizes choices */}
                        {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                          <div className="choice-section">
                            <span className="choice-label">Select Size</span>
                            <div className="sizes-row">
                              {selectedProduct.sizes.map((size: string) => (
                                <button 
                                  key={size}
                                  onClick={() => setSelectedSize(size)}
                                  className={`size-select-btn ${selectedSize === size ? 'active' : ''}`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Colors choices */}
                        {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                          <div className="choice-section">
                            <span className="choice-label">Select Color</span>
                            <div className="color-swatches" style={{ marginTop: '0.4rem' }}>
                              {selectedProduct.colors.map((color: string) => {
                                const colorHex = colorMap[color] || '#e2e8f0';
                                return (
                                  <div 
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`color-swatch-item ${selectedColor === color ? 'active' : ''}`}
                                  >
                                    <div className="swatch-circle" style={{ background: colorHex }}>
                                      {selectedColor === color && (
                                        <i className='bx bx-check' style={{ 
                                          color: ['White', 'Yellow', 'Beige', 'Silver'].includes(color) ? '#000' : '#fff'
                                        }}></i>
                                      )}
                                    </div>
                                    <span className="swatch-label">{color}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Add / Action button */}
                        {(() => {
                          const isSoldOut = selectedProduct.gallery?.includes('out_of_stock') || false;
                          return (
                            <button 
                              onClick={() => {
                                addToCart(selectedProduct, selectedSize, selectedColor);
                              }}
                              disabled={isSoldOut}
                              className="btn-primary-custom full-width checkout-btn-detail"
                              style={{ height: '58px', fontSize: '1.05rem', marginTop: '1.5rem', borderRadius: '12px' }}
                            >
                              {isSoldOut ? "Out of Stock" : "Add to Order"} <i className='bx bx-cart-alt' style={{ fontSize: '1.3rem' }}></i>
                            </button>
                          );
                        })()}

                        {/* Tabbed Info details */}
                        <div className="tabs-accordion-wrap">
                          <div className="tabs-header-row">
                            <button 
                              onClick={() => setActiveDetailTab('details')}
                              className={`tab-toggle-btn ${activeDetailTab === 'details' ? 'active' : ''}`}
                            >
                              Product Details
                            </button>
                            <button 
                              onClick={() => setActiveDetailTab('shipping')}
                              className={`tab-toggle-btn ${activeDetailTab === 'shipping' ? 'active' : ''}`}
                            >
                              Delivery Info
                            </button>
                          </div>
                          
                          <div className="tab-body-content">
                            {activeDetailTab === 'details' ? (
                              <div className="tab-details-text">
                                {selectedProduct.description || selectedProduct.desc ? (
                                  <p>{selectedProduct.description || selectedProduct.desc}</p>
                                ) : (
                                  <ul>
                                    <li>Heavy-duty 100% breathable material.</li>
                                    <li>SRF Official Logo embroidered on left chest.</li>
                                    <li>Machine wash cold, tumble dry low.</li>
                                    <li>Approved for all active SRF field sites.</li>
                                  </ul>
                                )}
                              </div>
                            ) : (
                              <p className="tab-details-text">
                                Orders placed using SRF Bucks are processed internally. Gear is typically delivered directly to your site supervisor's office within 5-7 business days. 
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  
                  /* --- B. STANDARD PRODUCTS GRID BROWSE VIEW --- */
                  <>

                  {/* Filter and Search Bar */}
                  <div className="shop-filter-bar">
                    <div className="shop-search-wrapper">
                      <i className='bx bx-search shop-search-icon'></i>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search..." 
                        className="shop-search-input"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {/* Top-level Parent Category Filter */}
                      <div className="shop-categories-filter">
                        <button 
                          onClick={() => setSelectedCategory('all')} 
                          className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                        >
                          All
                        </button>
                        {uniqueParents.map(parentName => {
                          const isActive = activeParent === parentName;
                          return (
                            <button 
                              key={parentName} 
                              onClick={() => setSelectedCategory(`parent:${parentName}`)} 
                              className={`category-pill ${isActive ? 'active' : ''}`}
                            >
                              {parentName}
                            </button>
                          );
                        })}
                      </div>

                      {/* Sub-category Filter (only shown when a parent is active and has subcategories) */}
                      {activeParent !== 'all' && activeParentSubs.length > 0 && (
                        <div className="shop-categories-filter sub-filter" style={{ paddingLeft: '1rem', borderLeft: '3px solid #721D1D', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => setSelectedCategory(`parent:${activeParent}`)} 
                            className={`category-pill sub-pill ${selectedCategory === `parent:${activeParent}` ? 'active' : ''}`}
                            style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}
                          >
                            All {activeParent}
                          </button>
                          {activeParentSubs.map(subCat => {
                            const displayName = subCat.name.split(' > ')[1];
                            return (
                              <button 
                                key={subCat.id} 
                                onClick={() => setSelectedCategory(subCat.id.toString())} 
                                className={`category-pill sub-pill ${selectedCategory === subCat.id.toString() ? 'active' : ''}`}
                                style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}
                              >
                                {displayName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="shop-items-count">
                      {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>

                  {/* Shop Products Grid */}
                  <div className="shop-products-grid">
                    {filteredProducts.map(product => {
                      const sizesText = product.sizes && product.sizes.length > 0 ? product.sizes.join(' • ') : 'OS';
                      
                      // Mock sold out logic for specific items to match mockup screenshot
                       const isSoldOut = product.gallery?.includes('out_of_stock') || false;

                      return (
                        <div 
                          key={product.id} 
                          className="shop-product-card"
                          onClick={() => handleProductClick(product)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="shop-card-img-wrap">
                            {product.image ? (
                              <img src={product.image} alt={product.title} className="shop-card-img" />
                            ) : (
                              <i className='bx bx-package shop-card-placeholder'></i>
                            )}
                            {isSoldOut && <span className="shop-card-soldout">Sold Out</span>}
                          </div>

                          <div className="shop-card-details">
                            <h3 className="shop-card-title">{product.title}</h3>
                            <div className="shop-card-sizes">{sizesText}</div>
                            
                            <div className="shop-card-bottom" onClick={e => e.stopPropagation()}>
                              <span className="bucks-badge font-large">
                                {product.price} <i className='bx bxs-coin-stack' style={{ marginLeft: '2px' }}></i>
                              </span>
                              
                              <button 
                                onClick={() => handleAddToCart(product)} 
                                disabled={isSoldOut}
                                className="shop-card-add-btn"
                                title={isSoldOut ? "Out of Stock" : "Add to Order"}
                              >
                                <i className='bx bx-plus'></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </>
                )}

              </div>
            )}
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="tab-pane">
                
                {/* Stats Row */}
                <div className="overview-stats">
                  
                  {/* Card 1: Active Employees */}
                  <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                      <i className='bx bx-group'></i>
                    </div>
                    <div className="stat-value">{activeEmployeesCount}</div>
                    <div className="stat-label">Active Employees</div>
                  </div>

                  {/* Card 2: Total Orders */}
                  <div className="stat-card">
                    <div className="stat-icon-wrapper green">
                      <i className='bx bx-receipt'></i>
                    </div>
                    <div className="stat-value">{totalOrdersCount}</div>
                    <div className="stat-label">Total Orders</div>
                  </div>

                  {/* Card 3: Pending Orders */}
                  <div className="stat-card">
                    <div className="stat-icon-wrapper orange">
                      <i className='bx bx-time-five'></i>
                    </div>
                    <div className="stat-value">{pendingOrdersCount}</div>
                    <div className="stat-label">Pending Orders</div>
                  </div>

                  {/* Card 4: Credits Issued (Dark Red Background) */}
                  <div className="stat-card primary-theme">
                    <div className="stat-icon-wrapper theme">
                      <i className='bx bx-coin-stack'></i>
                    </div>
                    <div className="stat-value">{totalCredits}</div>
                    <div className="stat-label">Credits Issued</div>
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="quick-actions">
                  <div className="action-card" onClick={() => setActiveTab('orders')}>
                    <div className="action-info">
                      <h3 className="action-title">MANAGE ORDERS</h3>
                      <p className="action-desc">Update order statuses</p>
                    </div>
                    <div className="action-arrow">
                      <i className='bx bx-right-arrow-alt'></i>
                    </div>
                  </div>

                  <div className="action-card" onClick={() => setActiveTab('employees')}>
                    <div className="action-info">
                      <h3 className="action-title">MANAGE EMPLOYEES</h3>
                      <p className="action-desc">Add users, adjust credits</p>
                    </div>
                    <div className="action-arrow">
                      <i className='bx bx-right-arrow-alt'></i>
                    </div>
                  </div>

                  <div className="action-card" onClick={() => setActiveTab('inventory')}>
                    <div className="action-info">
                      <h3 className="action-title">MANAGE PRODUCTS</h3>
                      <p className="action-desc">Add/edit catalog items</p>
                    </div>
                    <div className="action-arrow">
                      <i className='bx bx-right-arrow-alt'></i>
                    </div>
                  </div>
                </div>

                {/* Recent Orders section */}
                <div className="recent-orders-section">
                  <div className="section-header">
                    <h2 className="section-title-text">Recent Orders</h2>
                    <button onClick={() => setActiveTab('orders')} className="view-all-link">
                      View all <i className='bx bx-right-arrow-alt'></i>
                    </button>
                  </div>

                  {orders.filter(o => o.items > 0).length === 0 ? (
                    <div className="empty-state">
                      <p>No orders yet</p>
                    </div>
                  ) : (
                    <div className="dashboard-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.filter(o => o.items > 0).slice(0, 5).map(order => (
                            <tr key={order.id} onClick={() => { setActiveTab('orders'); setExpandedOrder(order.id); }} style={{ cursor: 'pointer' }}>
                              <td><strong className="order-id-txt">{order.id}</strong></td>
                              <td>{order.date}</td>
                              <td>{order.items} items</td>
                              <td><span className="bucks-badge">{order.total} Bucks</span></td>
                              <td>
                                <span className={`status-pill ${order.status.toLowerCase()}`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === 'orders' && (() => {
              const filteredOrders = orders.filter(o => {
                if (o.items <= 0) return false;
                if (selectedStatusFilter === 'All statuses') return true;
                
                const status = o.status.toLowerCase();
                const filter = selectedStatusFilter.toLowerCase();
                
                if (filter === 'pending') {
                  return status === 'pending' || status === 'processing';
                }
                if (filter === 'fulfilling') {
                  return status === 'fulfilling' || status === 'processing';
                }
                if (filter === 'delivered') {
                  return status === 'delivered' || status === 'fulfilled';
                }
                if (filter === 'cancelled') {
                  return status === 'cancelled' || status === 'refunded';
                }
                return status === filter;
              });

              return (
                <div className="tab-pane">
                  {filteredOrders.length === 0 ? (
                    <div className="empty-card" style={{ padding: '6rem 2rem', textAlign: 'center', background: 'transparent' }}>
                      <div style={{ background: '#e2e8f0', opacity: 0.8, width: '80px', height: '80px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                        <i className='bx bx-paste' style={{ fontSize: '3rem', color: '#64748b' }}></i>
                      </div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#0f172a', marginBottom: '0.5rem' }}>No orders found</h3>
                      <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>Try changing the status filter</p>
                    </div>
                  ) : (
                    <div className="orders-list">
                      {filteredOrders.map(order => (
                        <div key={order.id} className="order-accordion-card">
                          <div className="order-summary-row" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                            <div className="order-summary-left">
                              <div className="order-title-wrapper">
                                <span className="order-id">{order.id}</span>
                                <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                              </div>
                              <div className="order-meta">{order.date} • {order.items} Items</div>
                            </div>
                            
                            <div className="order-summary-right">
                              <span className="order-total">{order.total} Bucks</span>
                              <div className="order-actions-wrap" onClick={e => e.stopPropagation()}>
                                <select 
                                  value={order.status} 
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className="order-status-select"
                                >
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Fulfilled">Fulfilled</option>
                                  <option value="Refunded">Refunded</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                              <i className={`bx bx-chevron-${expandedOrder === order.id ? 'up' : 'down'} accordion-arrow`}></i>
                            </div>
                          </div>

                          {/* Accordion Details */}
                          {expandedOrder === order.id && order.details && (
                            <div className="order-details-pane">
                              <div className="details-grid">
                                {/* Delivery info */}
                                <div className="details-col">
                                  <h4 className="details-section-title">Delivery Info</h4>
                                  <div className="details-info-box">
                                    <div className="info-item"><strong>Name:</strong> {order.details.deliveryInfo?.name || 'N/A'}</div>
                                    <div className="info-item"><strong>Email:</strong> {order.details.deliveryInfo?.email || 'N/A'}</div>
                                    <div className="info-item"><strong>Employee ID:</strong> {order.details.deliveryInfo?.employeeId || 'N/A'}</div>
                                    <div className="info-item"><strong>Site:</strong> {order.details.deliveryInfo?.site || 'N/A'}</div>
                                    {order.details.deliveryInfo?.notes && (
                                      <div className="info-notes">
                                        <strong>Notes:</strong> {order.details.deliveryInfo.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Items list */}
                                <div className="details-col">
                                  <h4 className="details-section-title">Ordered Items</h4>
                                  <div className="details-items-list">
                                    {order.details.cart?.map((item: any) => (
                                      <div key={item.cartItemId} className="details-item-row">
                                        <img src={item.image} alt={item.title} className="details-item-img" />
                                        <div className="details-item-meta">
                                          <div className="details-item-title">{item.title}</div>
                                          <div className="details-item-variants">
                                            {item.selectedSize && `Size: ${item.selectedSize}`} {item.selectedColor && `• Color: ${item.selectedColor}`}
                                          </div>
                                        </div>
                                        <div className="details-item-price-qty">
                                          <div className="details-item-price">{item.price} Bucks</div>
                                          <div className="details-item-qty">Qty: {item.quantity}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 3. EMPLOYEES TAB */}
            {activeTab === 'employees' && (
              <div className="tab-pane">
                <div className="pane-header-actions" style={{ marginBottom: '1.5rem' }}>
                  <div className="shop-search-wrapper" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
                    <i className='bx bx-search shop-search-icon' style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.2rem' }}></i>
                    <input 
                      type="text" 
                      value={empSearchQuery}
                      onChange={e => setEmpSearchQuery(e.target.value)}
                      placeholder="Search employees by name, email or ID..." 
                      className="shop-search-input"
                      style={{ paddingLeft: '3rem', width: '100%', height: '46px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                  </div>
                  <div className="pane-actions-row">
                    <button className="btn-secondary-custom" onClick={issueAnnualBucks}>
                      <i className='bx bx-refresh'></i> Issue Annual Bucks
                    </button>
                    <button className="btn-primary-custom" onClick={() => { setEditingEmpId(null); setEmpForm({ name: '', email: '', password: '', site: 'Apprentice', balance: '50', role: 'employee', hireDate: '' }); setIsEmpModalOpen(true); }}>
                      <i className='bx bx-user-plus'></i> Add Employee
                    </button>
                  </div>
                </div>

                <div className="dashboard-table-container card-shadow">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Level</th>
                        <th>Role</th>
                        <th>Balance</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.filter(emp => {
                        const term = empSearchQuery.toLowerCase().trim();
                        if (!term) return true;
                        return (
                          emp.name.toLowerCase().includes(term) ||
                          emp.email.toLowerCase().includes(term) ||
                          emp.id.toLowerCase().includes(term) ||
                          (emp.site && emp.site.toLowerCase().includes(term))
                        );
                      }).map(emp => (
                        <tr key={emp.id}>
                          <td>
                            <div className="employee-info-cell">
                              <span className="emp-avatar">{emp.name.charAt(0).toUpperCase()}</span>
                              <div>
                                <div className="emp-name">{emp.name}</div>
                                <div className="emp-sub">{emp.id} • {emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="location-txt">{emp.site || 'Apprentice'}</span></td>
                          <td>
                            {emp.role === 'super_admin' ? (
                              <span className="role-badge admin">Super Admin</span>
                            ) : (
                              <span className="role-badge employee">Employee</span>
                            )}
                          </td>
                          <td><strong className="bucks-badge font-large">{emp.balance} Bucks</strong></td>
                          <td className="text-right actions-cell">
                            <button onClick={() => {
                              setEditingEmpId(emp.id);
                              setEmpForm({ 
                                name: emp.name, 
                                email: emp.email, 
                                password: '', 
                                site: emp.site || 'Apprentice', 
                                balance: emp.balance.toString(), 
                                role: emp.role || 'employee',
                                hireDate: emp.created_at ? new Date(emp.created_at).toISOString().split('T')[0] : ''
                              });
                              setIsEmpModalOpen(true);
                            }} className="action-btn edit" title="Edit Employee">
                              <i className='bx bx-edit'></i>
                            </button>
                            <button onClick={() => {
                              setSelectedHistoryEmpId(emp.id);
                              setIsHistoryModalOpen(true);
                            }} className="action-btn history" title="View Credit History" style={{ marginRight: '4px' }}>
                              <i className='bx bx-history'></i>
                            </button>
                            {emp.role !== 'super_admin' && (
                              <button onClick={() => { if(confirm(`Delete ${emp.name}?`)) deleteEmployee(emp.id); }} className="action-btn delete" title="Delete Employee">
                                <i className='bx bx-trash'></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. PRODUCTS (INVENTORY) TAB */}
            {activeTab === 'inventory' && (() => {
              const filteredProducts = products.filter(product => {
                const term = inventorySearchQuery.toLowerCase().trim();
                if (!term) return true;
                const matchTitle = (product.title || '').toLowerCase().includes(term);
                const matchDesc = (product.description || product.desc || '').toLowerCase().includes(term);
                const matchCat = (product.category_name || '').toLowerCase().includes(term);
                return matchTitle || matchDesc || matchCat;
              });

              return (
                <div className="tab-pane">
                  {filteredProducts.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '5rem 2rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1.2rem',
                      marginTop: '1.5rem',
                      backdropFilter: 'blur(10px)',
                      boxShadow: 'inset 0 0 20px rgba(255,255,255,0.01)'
                    }}>
                      <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: 'rgba(114, 29, 29, 0.1)',
                        border: '1.5px solid rgba(114, 29, 29, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(114, 29, 29, 0.15)'
                      }}>
                        <i className='bx bx-search' style={{ fontSize: '2.2rem', color: '#fca5a5' }}></i>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <h3 style={{ color: 'white', margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.3rem', fontWeight: '800', letterSpacing: '0.5px' }}>
                          NO PRODUCTS FOUND
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', maxWidth: '400px', lineHeight: '1.5' }}>
                          We couldn't find any catalog items matching "<strong>{inventorySearchQuery}</strong>". Try checking spelling or searching for a different keyword.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="products-inventory-grid" style={{ paddingTop: '1.5rem' }}>
                      {filteredProducts.map(product => {
                        const isInStock = !product.gallery?.includes('out_of_stock');
                        return (
                          <div key={product.id} className="inventory-product-card">
                            <div className="card-image-wrap">
                              {product.image ? (
                                <img src={product.image} alt={product.title} className="card-img" />
                              ) : (
                                <div className="no-image-placeholder">
                                  <i className='bx bx-package'></i>
                                  <span>NO IMAGE</span>
                                </div>
                              )}
                              {!isInStock && (
                                <div className="card-soldout-overlay">
                                  <span className="card-soldout-capsule">Out of Stock</span>
                                </div>
                              )}
                            </div>

                            <div className="card-body">
                              <h3 className="card-product-title">{product.title}</h3>
                              <div className="card-product-price">
                                <i className='bx bxs-coin-stack'></i>
                                <span>{product.price} credits</span>
                              </div>

                              <div className="card-footer">
                                <label className="stock-switch">
                                  <input 
                                    type="checkbox" 
                                    checked={isInStock} 
                                    onChange={async () => {
                                      // Toggle stock state inline
                                      const cleanGallery = product.gallery ? product.gallery.filter((g: string) => g !== 'out_of_stock') : [];
                                      const newGallery = isInStock ? [...cleanGallery, 'out_of_stock'] : cleanGallery;
                                      
                                      try {
                                        await editProduct(product.id, {
                                          title: product.title,
                                          price: product.price,
                                          desc: product.description || product.desc,
                                          image: product.image,
                                          categoryId: product.category_id,
                                          sizes: product.sizes,
                                          colors: product.colors,
                                          isTopPick: product.is_top_pick,
                                          gallery: newGallery
                                        });
                                      } catch (e: any) {
                                        alert("Error updating stock status: " + e.message);
                                      }
                                    }}
                                  />
                                  <span className="slider round"></span>
                                  <span className="switch-text">{isInStock ? 'In Stock' : 'Out'}</span>
                                </label>

                                <div className="card-actions">
                                  <button onClick={() => handleOpenModal(product)} className="card-action-btn edit" title="Edit Product">
                                    <i className='bx bx-edit'></i>
                                  </button>
                                  <button onClick={() => { if(confirm(`Delete ${product.title}?`)) deleteProduct(product.id); }} className="card-action-btn delete" title="Delete Product">
                                    <i className='bx bx-trash'></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 5. CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div className="tab-pane">


                <div className="categories-card card-shadow">
                  <div className="add-category-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <input 
                        type="text" 
                        value={newCategoryName} 
                        onChange={e => setNewCategoryName(e.target.value)} 
                        placeholder="Enter category/subcategory name..." 
                        className="category-input"
                        style={{ width: '100%', height: '46px' }}
                      />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                      <select
                        value={parentCategorySelection}
                        onChange={e => setParentCategorySelection(e.target.value)}
                        className="srf-input-select"
                        style={{ width: '100%', height: '46px', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '0 1rem', fontSize: '0.95rem' }}
                      >
                        <option value="">No Parent (Main Category)</option>
                        {categories.filter(c => !c.name.includes(' > ')).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={handleAddCategory} className="btn-primary-custom" style={{ height: '46px' }}>Add Category</button>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id}>
                          <td>
                            {editingCategory?.id === cat.id ? (
                              <input 
                                type="text" 
                                value={editingCategory?.name || ''} 
                                onChange={e => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                                className="inline-edit-input"
                                autoFocus
                              />
                            ) : (
                              <span className="category-name-txt">
                                {cat.name.includes(' > ') ? (
                                  <>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>
                                      {cat.name.split(' > ')[0]} &gt;{' '}
                                    </span>
                                    <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                      {cat.name.split(' > ')[1]}
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{cat.name}</span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="text-right actions-cell">
                            {editingCategory?.id === cat.id ? (
                              <div className="inline-edit-actions">
                                <button 
                                  onClick={async () => {
                                    if (editingCategory) {
                                      await editCategory(cat.id, editingCategory.name);
                                      setEditingCategory(null);
                                    }
                                  }} 
                                  className="inline-save-btn"
                                >
                                  Save
                                </button>
                                <button onClick={() => setEditingCategory(null)} className="inline-cancel-btn">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => setEditingCategory({ id: cat.id, name: cat.name })} 
                                  className="action-btn edit"
                                  title="Rename"
                                >
                                  <i className='bx bx-edit'></i>
                                </button>
                                <button 
                                  onClick={() => { if(confirm(`Delete category "${cat.name}"?`)) deleteCategory(cat.id); }} 
                                  className="action-btn delete"
                                  title="Delete"
                                >
                                  <i className='bx bx-trash'></i>
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. SRF CREDITS MANAGEMENT TAB */}
            {activeTab === 'srf_credits' && (
              <div className="tab-pane">


                <div className="credits-grid">
                  
                  {/* Card 1: Issue Annual Bucks */}
                  <div className="credits-card-panel card-shadow">
                    <div className="card-panel-icon-wrap">
                      <i className='bx bx-refresh'></i>
                    </div>
                    <h3>Global Credit Reset</h3>
                    <p>Issue the annual allocation of <strong>250 SRF Bucks</strong> to all registered employee accounts. This will reset their balances to 250.</p>
                    <button onClick={issueAnnualBucks} className="btn-primary-custom full-width">
                      Reset All Balances to 250 Bucks
                    </button>
                  </div>

                  {/* Card 2: Adjust individual balance */}
                  <div className="credits-card-panel card-shadow">
                    <div className="card-panel-icon-wrap select-color">
                      <i className='bx bx-coin'></i>
                    </div>
                    <h3>Quick Balance Adjust</h3>
                    <p>Directly update the balance of a single employee in the database.</p>
                    
                    <div className="quick-adjust-form">
                      <div className="form-item">
                        <label>Select Employee</label>
                        <select 
                          value={selectedEmpId} 
                          onChange={e => setSelectedEmpId(e.target.value)}
                          className="srf-input-select"
                        >
                          <option value="">-- Choose Employee --</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.id} - Balance: {emp.balance})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-item">
                        <label>New Balance (Bucks)</label>
                        <input 
                          type="number" 
                          value={adjustBalanceVal} 
                          onChange={e => setAdjustBalanceVal(e.target.value)}
                          className="srf-input-text"
                          placeholder="250"
                        />
                      </div>

                      <button 
                        onClick={handleQuickBalanceUpdate} 
                        disabled={isAdjustingBalance}
                        className="btn-primary-custom full-width"
                      >
                        {isAdjustingBalance ? "Updating..." : "Update Balance"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Credit Distribution Info */}
                <div className="distribution-card card-shadow">
                  <h3>Credit Distribution Breakdown</h3>
                  <div className="dist-stats">
                    <div className="dist-stat-box">
                      <span className="dist-num">{totalCredits}</span>
                      <span className="dist-lbl">Total Credits Issued</span>
                    </div>
                    <div className="dist-stat-box">
                      <span className="dist-num">{activeEmployeesCount > 0 ? Math.round(totalCredits / activeEmployeesCount) : 0}</span>
                      <span className="dist-lbl">Average Employee Balance</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 7. MY ORDERS TAB (EMPLOYEE) */}
            {activeTab === 'my_orders' && (
              <div className="tab-pane">


                {orders.filter(o => o.employee_id === currentUser?.id && o.items > 0).length === 0 ? (
                  <div className="empty-card">
                    <i className='bx bx-receipt' style={{ fontSize: '4rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
                    <h3>No Orders Placed</h3>
                    <p>You haven't ordered any premium workwear yet. Visit the Shop to browse the catalog!</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.filter(o => o.employee_id === currentUser?.id && o.items > 0).map(order => (
                      <div key={order.id} className="order-accordion-card">
                        <div className="order-summary-row" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                          <div className="order-summary-left">
                            <div className="order-title-wrapper">
                              <span className="order-id">{order.id}</span>
                              <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                            </div>
                            <div className="order-meta">{order.date} • {order.items} Items</div>
                          </div>
                          
                          <div className="order-summary-right">
                            <span className="order-total">{order.total} Bucks</span>
                            <i className={`bx bx-chevron-${expandedOrder === order.id ? 'up' : 'down'} accordion-arrow`}></i>
                          </div>
                        </div>

                        {/* Accordion Details */}
                        {expandedOrder === order.id && order.details && (
                          <div className="order-details-pane">
                            <div className="details-grid">
                              {/* Delivery info */}
                              <div className="details-col">
                                <h4 className="details-section-title">Delivery Info</h4>
                                <div className="details-info-box">
                                  <div className="info-item"><strong>Name:</strong> {order.details.deliveryInfo?.name || 'N/A'}</div>
                                  <div className="info-item"><strong>Email:</strong> {order.details.deliveryInfo?.email || 'N/A'}</div>
                                  <div className="info-item"><strong>Site Location:</strong> {order.details.deliveryInfo?.site || 'N/A'}</div>
                                  {order.details.deliveryInfo?.notes && (
                                    <div className="info-notes">
                                      <strong>Delivery Notes:</strong> {order.details.deliveryInfo.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Items list */}
                              <div className="details-col">
                                <h4 className="details-section-title">Items Summary</h4>
                                <div className="details-items-list">
                                  {order.details.cart?.map((item: any) => (
                                    <div key={item.cartItemId} className="details-item-row">
                                      <img src={item.image} alt={item.title} className="details-item-img" />
                                      <div className="details-item-meta">
                                        <div className="details-item-title">{item.title}</div>
                                        <div className="details-item-variants">
                                          {item.selectedSize && `Size: ${item.selectedSize}`} {item.selectedColor && `• Color: ${item.selectedColor}`}
                                        </div>
                                      </div>
                                      <div className="details-item-price-qty">
                                        <div className="details-item-price">{item.price} Bucks</div>
                                        <div className="details-item-qty">Qty: {item.quantity}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 8. SETTINGS TAB (EMPLOYEE) */}
            {activeTab === 'my_settings' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h2 className="pane-title">Account Settings</h2>
                  <p className="pane-desc">Manage your profile and delivery preferences</p>
                </div>

                <div style={{ maxWidth: '600px' }}>
                  <div className="custom-form-container card-shadow" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Full Name</label>
                      <input type="text" value={currentUser?.name || ''} disabled style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontWeight: '500' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Employee Email</label>
                      <input type="email" value={currentUser?.email || ''} disabled style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontWeight: '500' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Role</label>
                      <input type="text" value={currentUser?.role === 'super_admin' ? 'Administrator' : 'Employee'} disabled style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontWeight: '500' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Default Delivery Site Location</label>
                      <input type="text" defaultValue={currentUser?.site || ''} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: '500' }} />
                    </div>
                    <button className="btn-primary-custom" onClick={() => alert("Settings saved successfully!")} style={{ padding: '0.8rem 2rem' }}>
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 9. CHECKOUT TAB (INLINE) */}
            {activeTab === 'checkout' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h2 className="pane-title">Complete Your Order</h2>
                  <p className="pane-desc">Review your items and confirm delivery location</p>
                </div>

                {orderPlaced ? (
                  <div className="empty-card" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ 
                      width: '80px', height: '80px', 
                      background: 'rgba(16,185,129,0.1)', 
                      borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 1.5rem auto',
                      border: '1px solid rgba(16,185,129,0.3)'
                    }}>
                      <i className='bx bx-check' style={{ fontSize: '3.5rem', color: '#10b981' }}></i>
                    </div>
                    <h3 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '0.8rem' }}>Order Confirmed!</h3>
                    <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
                      Your SRF Bucks have been deducted successfully. Your gear will be delivered to your site office shortly.
                    </p>
                    <button 
                      onClick={() => {
                        setOrderPlaced(false);
                        setDeliveryNotes("");
                        setActiveTab('shop');
                      }} 
                      className="btn-primary-custom"
                      style={{ padding: '0.8rem 2.5rem' }}
                    >
                      Return to Shop
                    </button>
                  </div>
                ) : (
                  <div className="checkout-content-grid">
                    
                    {/* Left: Delivery details & cart review */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {/* Form */}
                      <div className="custom-form-container card-shadow" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Delivery Site Information</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Full Name</label>
                            <input type="text" value={currentUser?.name || ''} disabled style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Employee ID</label>
                            <input type="text" value={currentUser?.id || ''} disabled style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }} />
                          </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Company Email</label>
                          <input type="text" value={currentUser?.email || ''} disabled style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }} />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Delivery Site / Address</label>
                          <input 
                            type="text"
                            value={deliverySite} 
                            onChange={(e) => setDeliverySite(e.target.value)} 
                            placeholder="Enter your delivery address, site name, or hub location..."
                            required
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', backgroundColor: '#fff', fontSize: '0.95rem', outline: 'none' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Delivery Notes (Optional)</label>
                          <textarea 
                            rows={3}
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            placeholder="e.g. Leave at front desk for construction lead Mike."
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#0f172a', resize: 'vertical', fontSize: '0.95rem' }}
                          />
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Review Items ({cart.length})</h3>
                        {cart.length === 0 ? (
                          <p style={{ color: '#64748b' }}>Your cart is empty. <span style={{ color: '#721D1D', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('shop')}>Browse catalog</span></p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cart.map((item) => (
                              <div key={item.cartItemId} style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px solid #f1f5f9', borderRadius: '12px', background: '#f8fafc' }}>
                                <img src={item.image} alt={item.title} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.2rem', color: '#0f172a' }}>{item.title}</h4>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {item.selectedSize && `Size: ${item.selectedSize} `}
                                    {item.selectedSize && item.selectedColor && ' • '}
                                    {item.selectedColor && `Color: ${item.selectedColor}`}
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>Qty: {item.quantity}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                                  <span style={{ fontWeight: '800', color: '#721D1D', fontSize: '1rem' }}>{item.price * item.quantity} Bucks</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment details & order summary */}
                    <div>
                      <div className="card-shadow" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'sticky', top: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0f172a', fontWeight: '700' }}>Order Summary</h3>
                        
                        <div style={{ background: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1.5px solid #721D1D', marginBottom: '1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                            <i className='bx bxs-coin-stack' style={{ fontSize: '1.5rem', color: '#721D1D' }}></i>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>SRF Bucks Balance</span>
                          </div>
                          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{credits} Bucks</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                            <span style={{ color: '#64748b' }}>Subtotal</span>
                            <span style={{ fontWeight: '700' }}>{cartTotal} Bucks</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                            <span style={{ color: '#64748b' }}>Shipping</span>
                            <span style={{ color: '#10b981', fontWeight: '700' }}>FREE</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.3rem', fontWeight: '800', marginBottom: '1.5rem' }}>
                          <span>Total</span>
                          <span style={{ color: '#721D1D' }}>{cartTotal} Bucks</span>
                        </div>

                        {cartTotal > credits ? (
                          <div style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1.2rem', fontWeight: '600' }}>
                            Insufficient balance.
                          </div>
                        ) : (
                          <div style={{ color: '#10b981', background: '#ecfdf5', border: '1px solid rgba(16,185,129,0.2)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1.2rem', fontWeight: '600' }}>
                            Remaining: {credits - cartTotal} Bucks
                          </div>
                        )}

                        <button 
                          className="btn-primary-custom full-width" 
                          style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: '700' }}
                          onClick={handleCheckout}
                          disabled={cart.length === 0 || cartTotal > credits}
                        >
                          Confirm & Place Order
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ===== CART DRAWER PANEL ===== */}
      {currentUser && (
        <>
          <div className={`cart-drawer ${isCartOpen ? 'active' : ''}`} style={isCartOpen ? { right: 0 } : {}}>
            <div className="cart-header">
              <h2>Your Order <span className="cart-count-badge">{cart.length} Items</span></h2>
              <button className="close-cart" onClick={() => setIsCartOpen(false)}><i className='bx bx-x'></i></button>
            </div>

            <div className="credit-summary-card">
              <div className="summary-row">
                <span>Available Balance:</span>
                <span className="balance-amount"><span>{credits}</span> <i className='bx bxs-coin-stack'></i></span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, ((credits - cartTotal) / 250) * 100))}%` }}></div>
              </div>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>Your order is empty.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.cartItemId} className="cart-item">
                    <img src={item.image} alt={item.title} />
                    <div className="cart-item-details">
                      <div className="cart-item-title">{item.title}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0' }}>
                        {item.selectedSize && `Size: ${item.selectedSize} `}
                        {item.selectedSize && item.selectedColor && '| '}
                        {item.selectedColor && `Color: ${item.selectedColor}`}
                      </div>
                      <div className="cart-item-price">{item.price} <i className='bx bxs-coin-stack'></i></div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>Qty: {item.quantity}</div>
                    </div>
                    <button className="remove-item" onClick={() => removeFromCart(item.cartItemId)}><i className='bx bx-trash'></i></button>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              <div className="cart-totals">
                <span>Order Total:</span>
                <span className="total-credits"><span>{cartTotal}</span> <i className='bx bxs-coin-stack'></i></span>
              </div>
              <div className={`cart-balance-check ${cartTotal > credits ? 'insufficient' : ''}`}>
                Balance After Purchase: <span>{credits - cartTotal}</span>
              </div>

              {cartTotal > credits && <p className="error-msg" style={{ display: 'block', marginBottom: '1rem', color: '#ef4444' }}>Insufficient SRF Bucks for this order.</p>}

              {cart.length > 0 && cartTotal <= credits ? (
                <button 
                  onClick={() => { setActiveTab('checkout'); setIsCartOpen(false); }}
                  className="btn-primary-custom full-width" 
                  style={{ padding: '1rem' }}
                >
                  Proceed to Checkout <i className='bx bx-check-shield'></i>
                </button>
              ) : (
                <button className="btn-primary-custom full-width" disabled style={{ padding: '1rem', opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' }}>
                  Proceed to Checkout <i className='bx bx-check-shield'></i>
                </button>
              )}
            </div>
          </div>
          <div className={`cart-overlay ${isCartOpen ? 'active' : ''}`} onClick={() => setIsCartOpen(false)}></div>
        </>
      )}

      {/* ===== PRODUCT MODAL (Add / Edit) ===== */}
      {isModalOpen && (
        <>
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)} />
          <div className="admin-modal">
            <div className="modal-header">
              <div>
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <p>Provide description, sizes, and images</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <i className='bx bx-x'></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-item">
                <label>Product Title *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Heavy Duty Canvas Jacket" className="srf-input-text" />
              </div>

              <div className="form-row-2">
                <div className="form-item">
                  <label>Category</label>
                  <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="srf-input-select">
                    <option value="">Uncategorized</option>
                    {Object.entries(
                      categories.reduce((acc, cat) => {
                        const parts = cat.name.split(' > ');
                        const parent = parts[0];
                        if (!acc[parent]) acc[parent] = [];
                        acc[parent].push(cat);
                        return acc;
                      }, {} as Record<string, any>)
                    ).map(([parent, cats]) => {
                      const hasSubs = (cats as any[]).some((c: any) => c.name.includes(' > '));
                      if (hasSubs) {
                        return (
                          <optgroup key={parent} label={parent}>
                            {(cats as any[]).map((cat: any) => {
                              const parts = cat.name.split(' > ');
                              const displayName = parts.length > 1 ? parts[1] : parts[0];
                              return (
                                <option key={cat.id} value={cat.id}>
                                  {displayName}
                                </option>
                              );
                            })}
                          </optgroup>
                        );
                      } else {
                        return (cats as any[]).map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ));
                      }
                    })}
                  </select>
                </div>
                <div className="form-item">
                  <label>Price (SRF Bucks) *</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="150" className="srf-input-text" />
                </div>
              </div>

              <div className="image-upload-panel">
                <label className="form-label-header">Product Image</label>
                <div className="upload-flex-container">
                  <div className="upload-fields">
                    <span className="helper-label">Upload image from device:</span>
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="file-selector" />
                    
                    <span className="helper-label spacer">Or enter image URL:</span>
                    <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://images.unsplash.com/..." className="srf-input-text" />
                  </div>
                  {(imageFile || formData.image) && (
                    <img src={imageFile ? URL.createObjectURL(imageFile) : formData.image} alt="Preview" className="image-preview-box" />
                  )}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-item">
                  <label>Sizes (Comma separated)</label>
                  <input type="text" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} placeholder="S, M, L, XL" className="srf-input-text" />
                </div>
                <div className="form-item">
                  <label>Colors (Comma separated)</label>
                  <input type="text" value={formData.colors} onChange={e => setFormData({...formData, colors: e.target.value})} placeholder="Navy, Black, Orange" className="srf-input-text" />
                </div>
              </div>

              <div className="form-item">
                <label>Description</label>
                <textarea rows={3} value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="Product specifications..." className="srf-textarea"></textarea>
              </div>

              <div className="form-item">
                <label>Gallery Images (Comma separated URLs)</label>
                <textarea rows={2} value={formData.gallery} onChange={e => setFormData({...formData, gallery: e.target.value})} placeholder="URL1, URL2, URL3" className="srf-textarea"></textarea>
              </div>

              <label className="checkbox-banner-item">
                <input type="checkbox" checked={formData.isTopPick} onChange={e => setFormData({...formData, isTopPick: e.target.checked})} className="srf-checkbox" />
                <div>
                  <div className="check-title">⭐ Show in Top Picks</div>
                  <div className="check-subtitle">Display on homepage carousel</div>
                </div>
              </label>

              <label className="checkbox-banner-item" style={{ marginTop: '0.5rem' }}>
                <input type="checkbox" checked={formData.inStock} onChange={e => setFormData({...formData, inStock: e.target.checked})} className="srf-checkbox" />
                <div>
                  <div className="check-title">📦 In Stock</div>
                  <div className="check-subtitle">Enable buying for this product</div>
                </div>
              </label>
            </div>

            <div className="modal-footer">
              <button onClick={handleSaveProduct} className="btn-primary-custom full-width" disabled={isSaving}>
                {isSaving ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== EMPLOYEE MODAL (Add / Edit) ===== */}
      {isEmpModalOpen && (
        <>
          <div className="modal-overlay" onClick={() => setIsEmpModalOpen(false)} />
          <div className="admin-modal" style={{ maxHeight: '95vh', overflow: 'hidden' }}>
            <div className="modal-header">
              <div>
                <h2>{editingEmpId ? 'Edit Employee' : 'Add Employee'}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setIsEmpModalOpen(false)}>
                <i className='bx bx-x'></i>
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {editingEmpId && (
                <div className="form-item" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-end', minHeight: '38px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', color: '#64748b', marginBottom: '4px' }}>EMPLOYEE ID</label>
                  <input type="text" value={editingEmpId} disabled className="srf-input-text" style={{ borderRadius: '8px', height: '46px', padding: '0 1rem', border: '1px solid #cbd5e1', width: '100%', background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} />
                </div>
              )}

              <div className="form-item">
                <label style={{ display: 'flex', alignItems: 'flex-end', minHeight: '38px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', color: '#64748b', marginBottom: '4px' }}>FULL NAME</label>
                <input 
                  type="text" 
                  value={empForm.name} 
                  onChange={e => setEmpForm({...empForm, name: e.target.value})} 
                  placeholder="John Smith" 
                  className="srf-input-text" 
                  disabled={!!editingEmpId}
                  style={{ borderRadius: '8px', height: '46px', padding: '0 1rem', border: '1px solid #cbd5e1', width: '100%', backgroundColor: editingEmpId ? '#f1f5f9' : '#ffffff', color: editingEmpId ? '#64748b' : '#0f172a', cursor: editingEmpId ? 'not-allowed' : 'text' }} 
                />
              </div>

              <div className="form-row-2">
                <div className="form-item">
                  <label style={{ display: 'flex', alignItems: 'flex-end', minHeight: '38px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', color: '#64748b', marginBottom: '4px' }}>EMAIL (optional)</label>
                  <input 
                    type="email" 
                    value={empForm.email} 
                    onChange={e => setEmpForm({...empForm, email: e.target.value})} 
                    placeholder="john@srfreeman.com" 
                    className="srf-input-text" 
                    disabled={!!editingEmpId}
                    style={{ borderRadius: '8px', height: '46px', padding: '0 1rem', border: '1px solid #cbd5e1', width: '100%', backgroundColor: editingEmpId ? '#f1f5f9' : '#ffffff', color: editingEmpId ? '#64748b' : '#0f172a', cursor: editingEmpId ? 'not-allowed' : 'text' }} 
                  />
                </div>
                <div className="form-item">
                  <label style={{ display: 'flex', alignItems: 'flex-end', minHeight: '38px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', color: '#64748b', marginBottom: '4px' }}>PASSWORD *</label>
                  <input type="text" value={empForm.password} onChange={e => setEmpForm({...empForm, password: e.target.value})} placeholder={editingEmpId ? 'Leave blank to keep' : 'Temporary password'} className="srf-input-text" style={{ borderRadius: '8px', height: '46px', padding: '0 1rem', border: '1px solid #cbd5e1', width: '100%', backgroundColor: '#ffffff', color: '#0f172a' }} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-item">
                  <label style={{ display: 'flex', alignItems: 'flex-end', minHeight: '38px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', color: '#64748b', marginBottom: '4px' }}>ROLE</label>
                  <select value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} className="srf-input-select" style={{ borderRadius: '8px', height: '46px', padding: '0 1rem', border: '1px solid #cbd5e1', width: '100%', backgroundColor: '#ffffff', color: '#0f172a' }}>
                    <option value="employee">employee</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </div>
                <div className="form-item">
                  <label style={{ display: 'flex', alignItems: 'flex-end', minHeight: '38px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', color: '#64748b', marginBottom: '4px' }}>LEVEL</label>
                  <select 
                    value={empForm.site} 
                    onChange={e => {
                      const levelVal = e.target.value;
                      const creditsVal = levelCreditsMap[levelVal] || 50;
                      setEmpForm({
                        ...empForm,
                        site: levelVal,
                        balance: creditsVal.toString()
                      });
                    }} 
                    className="srf-input-select" 
                    disabled={!!editingEmpId}
                    style={{ borderRadius: '8px', height: '46px', padding: '0 1rem', border: '1px solid #cbd5e1', width: '100%', backgroundColor: editingEmpId ? '#f1f5f9' : '#ffffff', color: editingEmpId ? '#64748b' : '#0f172a', cursor: editingEmpId ? 'not-allowed' : 'default' }}
                  >
                    {Object.keys(levelCreditsMap).map(lvl => (
                      <option key={lvl} value={lvl}>{lvl} ({levelCreditsMap[lvl]} cr)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-item">
                  <label style={{ display: 'flex', alignItems: 'flex-end', minHeight: '38px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', color: '#64748b', marginBottom: '4px' }}>HIRE DATE *</label>
                  <input 
                    type="date" 
                    value={empForm.hireDate} 
                    onChange={e => setEmpForm({...empForm, hireDate: e.target.value})} 
                    className="srf-input-text" 
                    disabled={!!editingEmpId}
                    style={{ borderRadius: '8px', height: '46px', padding: '0 1rem', border: '1px solid #cbd5e1', width: '100%', backgroundColor: editingEmpId ? '#f1f5f9' : '#ffffff', color: editingEmpId ? '#64748b' : '#0f172a', cursor: editingEmpId ? 'not-allowed' : 'text' }} 
                  />
                </div>
                {!editingEmpId ? (
                  <div className="form-item">
                    <label style={{ display: 'flex', alignItems: 'flex-end', minHeight: '38px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', color: '#64748b', marginBottom: '4px' }}>STARTING CREDITS (default: 50)</label>
                    <input type="number" value={empForm.balance} onChange={e => setEmpForm({...empForm, balance: e.target.value})} className="srf-input-text" style={{ borderRadius: '8px', height: '46px', padding: '0 1rem', border: '1px solid #cbd5e1', width: '100%' }} />
                  </div>
                ) : (
                  <div className="form-item" />
                )}
              </div>

              {!editingEmpId && (
                <div style={{
                  background: 'rgba(114, 29, 29, 0.04)',
                  border: '1px solid rgba(114, 29, 29, 0.1)',
                  borderRadius: '10px',
                  padding: '1rem 1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  color: '#721D1D',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  marginTop: '0.5rem'
                }}>
                  <i className='bx bx-link' style={{ fontSize: '1.3rem' }}></i>
                  <span>Will receive <strong style={{ fontWeight: '800' }}>{empForm.balance || 0} credits</strong> on onboarding</span>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setIsEmpModalOpen(false)}
                className="btn-secondary-custom"
                style={{ background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.8rem 1.8rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!empForm.name) return alert('Name is required.');
                  if (!editingEmpId && !empForm.password) return alert('Password is required for new employees.');
                  setIsSavingEmp(true);
                  try {
                    const empPayload = {
                      name: empForm.name,
                      email: empForm.email,
                      password: empForm.password,
                      site: empForm.site || 'Apprentice',
                      balance: Number(empForm.balance) || 50,
                      role: empForm.role || 'employee',
                      created_at: empForm.hireDate ? new Date(empForm.hireDate).toISOString() : undefined
                    };
                    if (editingEmpId) {
                      await editEmployee(editingEmpId, empPayload);
                    } else {
                      await addEmployee(empPayload);
                    }
                    setIsEmpModalOpen(false);
                  } catch (e: any) {
                    alert('Error saving employee: ' + e.message);
                  } finally {
                    setIsSavingEmp(false);
                  }
                }}
                className="btn-primary-custom"
                style={{ background: '#721D1D', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem 1.8rem', fontWeight: '700', cursor: 'pointer', boxShadow: 'none' }}
                disabled={isSavingEmp}
              >
                {isSavingEmp ? 'Saving...' : editingEmpId ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== EMPLOYEE CREDIT HISTORY MODAL ===== */}
      {isHistoryModalOpen && selectedHistoryEmpId && (() => {
        const emp = employees.find(e => e.id === selectedHistoryEmpId);
        if (!emp) return null;
        const empHistory = orders.filter(o => o.employee_id === selectedHistoryEmpId);
        
        return (
          <>
            <div className="modal-overlay" onClick={() => { setIsHistoryModalOpen(false); setSelectedHistoryEmpId(null); }} />
            <div className="admin-modal" style={{ maxWidth: '800px', width: '90%' }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <i className='bx bx-history' style={{ color: '#721D1D' }}></i> Credit History: {emp.name}
                  </h2>
                  <p>{emp.id} • {emp.email} • Location: {emp.site || 'N/A'}</p>
                </div>
                <button className="modal-close-btn" onClick={() => { setIsHistoryModalOpen(false); setSelectedHistoryEmpId(null); }}>
                  <i className='bx bx-x'></i>
                </button>
              </div>

              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#64748b' }}>Current Available Balance:</span>
                  <strong className="bucks-badge font-large" style={{ fontSize: '1.25rem', padding: '0.4rem 0.8rem' }}>{emp.balance} Bucks</strong>
                </div>

                {empHistory.length === 0 ? (
                  <div className="empty-card" style={{ padding: '3rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <i className='bx bx-coin-stack' style={{ fontSize: '3.5rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
                    <h3>No Transactions Recorded</h3>
                    <p>There are no purchases or balance adjustments registered for this employee yet.</p>
                  </div>
                ) : (
                  <div className="dashboard-table-container card-shadow" style={{ margin: 0, border: '1px solid #e2e8f0' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Ref ID</th>
                          <th>Type / Description</th>
                          <th>Change</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empHistory.map(item => {
                          let typeLabel = '';
                          let amountText = '';
                          let isCredit = false;
                          let desc = '';
                          let changeColor = '#dc2626'; // Debit Red
                          let changeSign = '-';

                          if (item.items > 0) {
                            // Standard Order Purchase
                            typeLabel = 'Order Purchase';
                            isCredit = false;
                            desc = `Purchased ${item.items} item(s)`;
                            amountText = `${item.total} Bucks`;
                          } else {
                            // Adjustment or Annual Issue
                            const type = item.details?.type || 'adjustment';
                            isCredit = item.status === 'Credit' || (item.details?.change && item.details.change > 0);
                            typeLabel = type === 'annual_issue' ? 'Annual Issue' : 'Admin Adjustment';
                            desc = item.details?.description || (isCredit ? 'Credits added by admin' : 'Credits deducted by admin');
                            amountText = `${item.total} Bucks`;
                          }

                          if (isCredit) {
                            changeColor = '#16a34a'; // Credit Green
                            changeSign = '+';
                          }

                          return (
                            <tr key={item.id}>
                              <td style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '500' }}>{item.date}</td>
                              <td><strong className="order-id-txt" style={{ fontSize: '0.88rem' }}>{item.id}</strong></td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>{typeLabel}</span>
                                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>{desc}</span>
                                </div>
                              </td>
                              <td>
                                <strong style={{ color: changeColor, fontSize: '0.95rem' }}>
                                  {changeSign}{amountText}
                                </strong>
                              </td>
                              <td style={{ fontSize: '0.88rem', fontWeight: '600', color: '#334155' }}>
                                {item.details?.balance_before !== undefined && item.details?.balance_after !== undefined ? (
                                  <span title={`Before: ${item.details.balance_before} Bucks`}>
                                    {item.details.balance_after} Bucks
                                  </span>
                                ) : (
                                  <span>-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button onClick={() => { setIsHistoryModalOpen(false); setSelectedHistoryEmpId(null); }} className="btn-secondary-custom full-width" style={{ justifyContent: 'center', padding: '0.9rem' }}>
                  Close History
                </button>
              </div>
            </div>
          </>
        );
      })()}
      </>
    </ProtectedRoute>
  );
}

// Global styles (using standard styled-jsx equivalent stylesheet)
const styleBlock = `
  /* Dashboard Container Layout */
  .admin-container {
    display: flex;
    min-height: 100vh;
    background-color: #f8fafc;
    font-family: 'Inter', sans-serif;
    color: #0f172a;
    position: relative;
  }

  /* ===== SIDEBAR STYLING ===== */
  .admin-sidebar {
    width: 280px;
    background-color: #181313;
    color: #f1f5f9;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2rem 1.5rem;
    position: sticky;
    top: 0;
    height: 100vh;
    flex-shrink: 0;
    z-index: 100;
    border-right: 1px solid rgba(255,255,255,0.05);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  }

  .admin-sidebar::-webkit-scrollbar {
    width: 4px;
  }

  .admin-sidebar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }

  .sidebar-top {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .sidebar-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 0.5rem;
  }

  .brand-img {
    height: 55px;
    width: auto;
    object-fit: contain;
    margin-bottom: 0.5rem;
  }

  .brand-subtitle {
    font-family: 'Outfit', sans-serif;
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 2px;
    color: #ffffff;
    text-transform: uppercase;
  }

  /* Menu Section labels */
  .menu-section-label {
    font-size: 0.68rem;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.28);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 1.2rem 1rem 0.4rem;
  }

  /* Language Button Toggler */
  .lang-switcher {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.2rem;
    border-radius: 50px;
    border: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 0.5rem;
  }

  .lang-btn {
    flex: 1;
    background: none;
    border: none;
    color: rgba(255,255,255,0.6);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.4rem 0.8rem;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .lang-btn.active {
    color: white;
    background: #721D1D;
  }

  .lang-btn:hover:not(.active) {
    color: white;
    background: rgba(255,255,255,0.08);
  }

  /* Navigation Links */
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    background: none;
    border: none;
    color: rgba(241, 245, 249, 0.65);
    font-size: 0.92rem;
    font-weight: 600;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .nav-item i {
    font-size: 1.2rem;
    color: rgba(241, 245, 249, 0.4);
    transition: color 0.2s;
  }

  .nav-item:hover {
    color: white;
    background: rgba(255,255,255,0.04);
  }

  .nav-item.active {
    color: white;
    background: #721D1D;
    box-shadow: 0 4px 15px rgba(130, 19, 43, 0.3);
  }

  .nav-item.active i {
    color: white;
  }

  /* Profile & Signout */
  .admin-profile {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem;
    background: rgba(255,255,255,0.03);
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 1rem;
  }

  .profile-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #721D1D;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 1.1rem;
    border: 1px solid rgba(255,255,255,0.2);
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  .profile-name {
    font-size: 0.88rem;
    font-weight: 700;
    color: white;
  }

  .profile-role {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.4);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .btn-signout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    background: #721D1D;
    border: none;
    color: white;
    padding: 0.8rem;
    border-radius: 8px;
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    font-size: 0.85rem;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-signout:hover {
    background: #a31d38;
    color: white;
  }

  /* ===== MAIN BODY ===== */
  .admin-main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* Header Burgundy Banner */
  .admin-header {
    background: linear-gradient(135deg, #721D1D 0%, #4c0817 100%);
    padding: 3.5rem 3rem;
    position: relative;
    color: white;
    flex-shrink: 0;
    border-bottom: 2px solid rgba(130, 19, 43, 0.3);
    overflow: hidden;
  }

  .admin-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1920');
    background-size: cover;
    background-position: center;
    opacity: 0.15;
    mix-blend-mode: overlay;
    pointer-events: none;
    z-index: 1;
  }

  .header-grid-overlay {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 2;
  }

  .header-content {
    position: relative;
    z-index: 10;
  }

  .header-filter-select option {
    background: #181313 !important;
    color: white !important;
  }

  .header-filter-select:hover {
    background: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }

  .header-search-input-field:hover {
    background: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.25) !important;
  }

  .header-search-input-field:focus {
    background: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1) !important;
  }

  .header-pretitle {
    font-family: 'Outfit', sans-serif;
    font-size: 0.9rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 3px;
    margin-bottom: 0.4rem;
  }

  .header-title {
    font-family: 'Outfit', sans-serif;
    font-size: 3.2rem;
    font-weight: 900;
    font-style: italic;
    letter-spacing: 1px;
    line-height: 1;
    margin-bottom: 0.4rem;
    text-shadow: 0 4px 10px rgba(0,0,0,0.25);
  }

  .header-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .mobile-header-bar {
    display: none;
  }

  /* Body container */
  .admin-body {
    padding: 2.5rem 3rem;
    flex-grow: 1;
  }

  .tab-pane {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    animation: fadeIn 0.4s ease forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Pane titles */
  .pane-header {
    margin-bottom: 0.5rem;
  }

  .pane-title {
    font-family: 'Outfit', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.2rem;
  }

  .pane-desc {
    color: #64748b;
    font-size: 0.95rem;
  }

  .pane-header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .pane-actions-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* ===== SHOP BANNER DESIGN ===== */
  .shop-banner {
    position: relative;
    background: linear-gradient(135deg, #721D1D 0%, #4c0817 100%);
    border-radius: 16px;
    padding: 3.5rem 3rem;
    color: white;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 2rem;
    box-shadow: 0 8px 30px rgba(130, 19, 43, 0.15);
  }

  .shop-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1920');
    background-size: cover;
    background-position: center;
    opacity: 0.15;
    mix-blend-mode: overlay;
    pointer-events: none;
    z-index: 1;
  }

  .shop-banner-overlay {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 2;
  }

  .shop-banner-left, .shop-banner-right {
    position: relative;
    z-index: 10;
  }

  .badge-store {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255,255,255,0.22);
    padding: 0.4rem 1.1rem;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 2.5px;
    display: inline-block;
    color: #ffffff;
    font-family: 'Outfit', sans-serif;
  }

  .banner-store-title {
    font-family: 'Outfit', sans-serif;
    font-size: 3.6rem;
    font-weight: 900;
    line-height: 1.05;
    margin: 1.2rem 0 0.8rem;
    letter-spacing: 0.5px;
    text-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .banner-store-desc {
    font-size: 0.95rem;
    color: rgba(255,255,255,0.7);
    max-width: 480px;
    line-height: 1.5;
    font-weight: 500;
  }

  .credits-glass-card {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 1.5rem 2.4rem;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 220px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  }

  .credits-glass-val {
    font-size: 2.8rem;
    font-weight: 900;
    font-family: 'Outfit', sans-serif;
    color: white;
    line-height: 1;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .credits-glass-lbl {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.55);
    text-transform: uppercase;
    margin-top: 0.6rem;
  }

  .shop-mobile-bar {
    display: none;
  }

  /* ===== SHOP FILTERS ===== */
  .shop-filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 2rem 0 0.8rem;
    flex-wrap: wrap;
    gap: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 1.5rem;
  }

  .shop-search-wrapper {
    position: relative;
    width: 320px;
  }

  .shop-search-input {
    width: 100%;
    padding: 0.85rem 1rem 0.85rem 2.8rem;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    background: white;
    outline: none;
    font-size: 0.95rem;
    transition: all 0.2s;
    color: #0f172a;
  }

  .shop-search-input:focus {
    border-color: #721D1D;
    box-shadow: 0 0 0 3px rgba(130,19,43,0.08);
  }

  .shop-search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 1.3rem;
  }

  .shop-categories-filter {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .category-pill {
    border: 1px solid #cbd5e1;
    background: white;
    color: #475569;
    padding: 0.55rem 1.2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .category-pill.active, .category-pill:hover {
    background: #721D1D;
    color: white;
    border-color: #721D1D;
    box-shadow: 0 4px 12px rgba(130,19,43,0.2);
  }

  .shop-items-count {
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ===== PRODUCTS SHOP GRID ===== */
  .shop-products-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.8rem;
  }

  @media (max-width: 1400px) {
    .shop-products-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 992px) {
    .shop-products-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 600px) {
    .shop-products-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ===== CHECKOUT GRID ===== */
  .checkout-content-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 992px) {
    .checkout-content-grid {
      grid-template-columns: 1fr;
    }
  }

  .shop-product-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 20px rgba(0,0,0,0.015);
  }

  .shop-product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.06);
    border-color: #cbd5e1;
  }

  .shop-card-img-wrap {
    height: 280px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid #f1f5f9;
    padding: 1.5rem;
  }

  .shop-card-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    mix-blend-mode: darken;
    transition: transform 0.5s;
  }

  .shop-product-card:hover .shop-card-img {
    transform: scale(1.05);
  }

  .shop-card-placeholder {
    font-size: 3.5rem;
    color: #cbd5e1;
  }

  .shop-card-soldout {
    position: absolute;
    top: 0.8rem;
    left: 0.8rem;
    background: #1e293b;
    color: white;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.35rem 0.8rem;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    z-index: 10;
  }

  .shop-card-details {
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .shop-card-title {
    font-weight: 700;
    font-size: 0.95rem;
    color: #0f172a;
    margin-bottom: 0.3rem;
    line-height: 1.4;
  }

  .shop-card-sizes {
    font-size: 0.78rem;
    color: #64748b;
    margin-bottom: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .shop-card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  .shop-card-add-btn {
    background: #721D1D;
    color: white;
    border: none;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.3rem;
    box-shadow: 0 4px 10px rgba(130,19,43,0.2);
  }

  .shop-card-add-btn:hover {
    background: #be185d;
    transform: scale(1.05);
    box-shadow: 0 6px 15px rgba(190,24,93,0.35);
  }

  .shop-card-add-btn:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ===== SINGLE PRODUCT DETAILS CONTAINER STYLE ===== */
  .product-detail-view {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 2.5rem;
    box-shadow: 0 4px 25px rgba(0,0,0,0.012);
    animation: fadeIn 0.4s ease forwards;
  }

  .back-to-shop-btn {
    background: none;
    border: none;
    color: #721D1D;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 2rem;
    padding: 0.5rem 0;
    transition: all 0.2s;
    font-family: 'Outfit', sans-serif;
  }

  .back-to-shop-btn:hover {
    color: #be185d;
    transform: translateX(-3px);
  }

  .product-view-grid {
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 3.5rem;
  }

  .product-view-gallery {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .main-image-frame {
    background: #f8fafc;
    border-radius: 20px;
    border: 1px solid #f1f5f9;
    padding: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 480px;
    overflow: hidden;
  }

  .main-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    mix-blend-mode: darken;
    transition: all 0.3s;
  }

  .thumbnails-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .thumbnail-frame {
    aspect-ratio: 1/1;
    border-radius: 10px;
    border: 2px solid transparent;
    overflow: hidden;
    cursor: pointer;
    padding: 3px;
    background: white;
    transition: all 0.2s;
  }

  .thumbnail-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
    opacity: 0.6;
    transition: all 0.2s;
  }

  .thumbnail-frame img:hover {
    opacity: 0.85;
  }

  .thumbnail-frame.active {
    border-color: #721D1D;
  }

  .thumbnail-frame.active img {
    opacity: 1;
  }

  .product-view-info {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .excl-label {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .product-detail-title {
    font-family: 'Outfit', sans-serif;
    font-size: 2.6rem;
    font-weight: 900;
    line-height: 1.15;
    color: #0f172a;
    letter-spacing: 0.5px;
  }

  .product-detail-price {
    font-size: 2rem;
    font-weight: 800;
    color: #721D1D;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .product-detail-desc {
    font-size: 1rem;
    color: #475569;
    line-height: 1.65;
    margin-bottom: 0.8rem;
  }

  .choice-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 0.8rem;
  }

  .choice-label {
    font-size: 0.88rem;
    font-weight: 700;
    color: #0f172a;
  }

  .sizes-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .size-select-btn {
    width: 52px;
    height: 52px;
    border-radius: 10px;
    background: #f8fafc;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .size-select-btn:hover {
    border-color: #721D1D;
    background: #f1f5f9;
  }

  .size-select-btn.active {
    background: #0f172a;
    color: white;
    border-color: #0f172a;
    box-shadow: 0 4px 10px rgba(15,23,42,0.15);
  }

  .checkout-btn-detail {
    box-shadow: 0 4px 20px rgba(130,19,43,0.3);
  }

  .checkout-btn-detail:hover {
    box-shadow: 0 6px 25px rgba(190,24,93,0.4);
  }

  .tabs-accordion-wrap {
    border-top: 1px solid #e2e8f0;
    margin-top: 1.5rem;
  }

  .tabs-header-row {
    display: flex;
    gap: 2rem;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 1.2rem;
  }

  .tab-toggle-btn {
    padding: 0.8rem 0;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #64748b;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-toggle-btn:hover {
    color: #0f172a;
  }

  .tab-toggle-btn.active {
    color: #0f172a;
    border-bottom-color: #0f172a;
  }

  .tab-body-content {
    color: #475569;
    line-height: 1.7;
    font-size: 0.92rem;
  }

  .tab-details-text ul {
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  /* ===== STAT CARDS ===== */
  .overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 1.8rem;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.02);
    display: flex;
    flex-direction: column;
    position: relative;
    transition: all 0.3s;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  }

  .stat-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    margin-bottom: 1.2rem;
  }

  .stat-icon-wrapper.blue { background: #eff6ff; color: #3b82f6; }
  .stat-icon-wrapper.green { background: #ecfdf5; color: #10b981; }
  .stat-icon-wrapper.orange { background: #fff7ed; color: #f97316; }
  .stat-icon-wrapper.theme { background: rgba(255,255,255,0.15); color: white; }

  .stat-value {
    font-size: 2.6rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.1;
    margin-bottom: 0.3rem;
  }

  .stat-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Stat Card - Primary Red Style */
  .stat-card.primary-theme {
    background: linear-gradient(135deg, #721D1D 0%, #5c0d1e 100%);
    border-color: #721D1D;
    color: white;
    box-shadow: 0 8px 30px rgba(130, 19, 43, 0.3);
  }

  .stat-card.primary-theme .stat-value {
    color: white;
  }

  .stat-card.primary-theme .stat-label {
    color: rgba(255, 255, 255, 0.7);
  }

  /* ===== QUICK ACTIONS ===== */
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .action-card {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
  }

  .action-card:hover {
    border-color: #721D1D;
    box-shadow: 0 10px 25px rgba(130, 19, 43, 0.08);
    transform: translateY(-2px);
  }

  .action-info {
    display: flex;
    flex-direction: column;
  }

  .action-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #0f172a;
    margin-bottom: 0.2rem;
  }

  .action-desc {
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 500;
  }

  .action-arrow {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 1.25rem;
    transition: all 0.3s;
  }

  .action-card:hover .action-arrow {
    background: #721D1D;
    color: white;
    transform: translateX(4px);
  }

  /* ===== TABLES STYLING ===== */
  .recent-orders-section {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 2rem;
    box-shadow: 0 4px 25px rgba(0,0,0,0.01);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 1rem;
  }

  .section-title-text {
    font-family: 'Outfit', sans-serif;
    font-size: 1.3rem;
    font-weight: 800;
    color: #0f172a;
  }

  .view-all-link {
    background: none;
    border: none;
    color: #721D1D;
    font-weight: 700;
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    transition: color 0.2s;
  }

  .view-all-link:hover {
    color: #e51a08;
  }

  .dashboard-table-container {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .admin-table th {
    padding: 1rem 1.2rem;
    color: #64748b;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .admin-table td {
    padding: 1.1rem 1.2rem;
    color: #334155;
    font-size: 0.92rem;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }

  .admin-table tr:hover td {
    background-color: #f8fafc;
  }

  .order-id-txt {
    color: #721D1D;
    font-family: 'Outfit', sans-serif;
    font-weight: 700;
  }

  .bucks-badge {
    display: inline-flex;
    align-items: center;
    background: #fef2f2;
    color: #721D1D;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 700;
    border: 1px solid rgba(130, 19, 43, 0.15);
  }

  .bucks-badge.font-large {
    font-size: 0.95rem;
    padding: 0.4rem 0.8rem;
  }

  /* Status Pills */
  .status-pill {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
  }

  .status-pill.processing { background: #fff7ed; color: #c2410c; border: 1px solid rgba(194, 65, 12, 0.15); }
  .status-pill.shipped { background: #eff6ff; color: #1d4ed8; border: 1px solid rgba(29, 78, 216, 0.15); }
  .status-pill.delivered { background: #ecfdf5; color: #047857; border: 1px solid rgba(4, 120, 87, 0.15); }
  .status-pill.fulfilled { background: #f0fdf4; color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.15); }
  .status-pill.refunded { background: #fef2f2; color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.15); }
  .status-pill.cancelled { background: #f1f5f9; color: #64748b; border: 1px solid rgba(100, 116, 139, 0.15); }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: #94a3b8;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
  }

  /* Tab Pane Containers */
  .card-shadow {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
    overflow: hidden;
  }

  /* Custom buttons */
  .btn-primary-custom {
    background: #721D1D;
    color: white;
    border: none;
    padding: 0.8rem 1.6rem;
    border-radius: 8px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(130,19,43,0.3);
  }

  .btn-primary-custom:hover {
    background: #be185d;
    transform: translateY(-1px);
  }

  .btn-primary-custom.full-width {
    width: 100%;
    justify-content: center;
  }

  .btn-secondary-custom {
    background: white;
    color: #334155;
    border: 1px solid #cbd5e1;
    padding: 0.8rem 1.6rem;
    border-radius: 8px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .btn-secondary-custom:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  /* Employee list specific styling */
  .employee-info-cell {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .emp-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #721D1D;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.95rem;
    border: 1px solid #cbd5e1;
  }

  .emp-name {
    font-weight: 700;
    color: #0f172a;
    font-size: 0.95rem;
  }

  .emp-sub {
    font-size: 0.78rem;
    color: #64748b;
    font-weight: 500;
  }

  .location-txt {
    font-weight: 600;
    color: #334155;
  }

  .role-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .role-badge.admin { background: #fef3c7; color: #d97706; }
  .role-badge.employee { background: #f0fdf4; color: #16a34a; }

  .action-btn {
    background: none;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.15rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .action-btn.edit { color: #64748b; }
  .action-btn.edit:hover { background: #f1f5f9; color: #0f172a; }
  .action-btn.history { color: #3b82f6; }
  .action-btn.history:hover { background: #eff6ff; color: #1d4ed8; }
  .action-btn.delete { color: #ef4444; }
  .action-btn.delete:hover { background: #fef2f2; color: #dc2626; }

  /* Product Inventory list styling */
  .product-info-cell {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .table-product-img {
    width: 44px;
    height: 44px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .product-title-txt {
    font-weight: 700;
    color: #0f172a;
  }

  .category-txt {
    color: #64748b;
    font-weight: 600;
  }

  .yes-pill { background: #dcfce7; color: #15803d; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }
  .no-pill { background: #f1f5f9; color: #64748b; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; }

  /* Fulfill Orders Accordion cards */
  .order-accordion-card {
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.015);
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .order-accordion-card:hover {
    border-color: #cbd5e1;
  }

  .order-summary-row {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .order-summary-left {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .order-title-wrapper {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .order-id {
    font-family: 'Outfit', sans-serif;
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
  }

  .order-meta {
    font-size: 0.88rem;
    color: #64748b;
    font-weight: 500;
  }

  .order-summary-right {
    display: flex;
    align-items: center;
    gap: 1.2rem;
  }

  .order-total {
    font-family: 'Outfit', sans-serif;
    font-size: 1.2rem;
    font-weight: 800;
    color: #721D1D;
  }

  .order-status-select {
    padding: 0.5rem 0.8rem;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    font-size: 0.85rem;
    font-weight: 700;
    color: #334155;
    background: #f8fafc;
    outline: none;
    cursor: pointer;
  }

  .accordion-arrow {
    font-size: 1.4rem;
    color: #94a3b8;
  }

  /* Order expanded details layout */
  .order-details-pane {
    padding: 1.5rem;
    background: #f8fafc;
    border-top: 1px dashed #cbd5e1;
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .details-col {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .details-section-title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.85rem;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .details-info-box {
    background: white;
    padding: 1.2rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #334155;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .info-notes {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #f1f5f9;
    font-style: italic;
    color: #475569;
  }

  .details-items-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .details-item-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    background: white;
    padding: 0.8rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .details-item-img {
    width: 46px;
    height: 46px;
    object-fit: cover;
    border-radius: 6px;
  }

  .details-item-meta {
    flex-grow: 1;
  }

  .details-item-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
  }

  .details-item-variants {
    font-size: 0.78rem;
    color: #64748b;
  }

  .details-item-price-qty {
    text-align: right;
    line-height: 1.3;
  }

  .details-item-price {
    font-size: 0.88rem;
    font-weight: 700;
    color: #721D1D;
  }

  .details-item-qty {
    font-size: 0.78rem;
    color: #64748b;
  }

  /* Categories page custom classes */
  .categories-card {
    background: white;
    padding: 1.8rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .add-category-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .category-input {
    flex-grow: 1;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
    outline: none;
  }

  .category-input:focus {
    border-color: #721D1D;
  }

  .category-name-txt {
    font-weight: 700;
    color: #0f172a;
  }

  .inline-edit-input {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    border: 1.5px solid #721D1D;
    width: 100%;
    outline: none;
  }

  .inline-edit-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .inline-save-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .inline-cancel-btn {
    background: #64748b;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
  }

  /* Credits management tab styling */
  .credits-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .credits-card-panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .credits-card-panel h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
  }

  .credits-card-panel p {
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .card-panel-icon-wrap {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: #fdf2f8;
    color: #db2777;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
  }

  .card-panel-icon-wrap.select-color {
    background: #eff6ff;
    color: #2563eb;
  }

  .quick-adjust-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-item label {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    display: flex;
    align-items: flex-end;
    min-height: 38px;
    margin-bottom: 0.2rem;
  }

  .srf-input-select, .srf-input-text {
    width: 100%;
    height: 46px;
    padding: 0 1rem;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    font-size: 0.92rem;
    outline: none;
    background: white;
    box-sizing: border-box;
  }

  .srf-input-select:focus, .srf-input-text:focus {
    border-color: #721D1D;
  }

  .distribution-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
    margin-top: 1.5rem;
  }

  .distribution-card h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
  }

  .dist-stats {
    display: flex;
    gap: 3rem;
    flex-wrap: wrap;
  }

  .dist-stat-box {
    display: flex;
    flex-direction: column;
  }

  .dist-num {
    font-size: 2.2rem;
    font-weight: 800;
    color: #721D1D;
    line-height: 1.1;
  }

  .dist-lbl {
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
  }

  /* Empty state Card style */
  .empty-card {
    background: white;
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    padding: 4rem 2rem;
    text-align: center;
    color: #475569;
  }

  .empty-card h3 {
    margin-top: 1rem;
    font-size: 1.3rem;
    color: #0f172a;
  }

  .empty-card p {
    color: #64748b;
    font-size: 0.95rem;
    margin-top: 0.3rem;
  }

  /* ===== MODAL GENERAL STYLING ===== */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 1000;
  }

  .admin-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 20px;
    width: 95%;
    max-width: 640px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    z-index: 1001;
    box-shadow: 0 30px 60px -12px rgba(0,0,0,0.35);
    animation: modalAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .admin-modal.small {
    max-width: 500px;
  }

  @keyframes modalAppear {
    from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  .modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .modal-header h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.5rem;
    color: #0f172a;
    font-weight: 800;
    margin: 0;
  }

  .modal-header p {
    color: #94a3b8;
    font-size: 0.82rem;
    margin: 0.2rem 0 0;
  }

  .modal-close-btn {
    background: #f1f5f9;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    transition: all 0.2s;
  }

  .modal-close-btn:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .modal-body {
    overflow-y: auto;
    padding: 1.8rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    flex: 1;
  }

  .form-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.2rem;
  }

  .image-upload-panel {
    background: #f8fafc;
    border: 1.5px dashed #cbd5e1;
    border-radius: 12px;
    padding: 1.2rem;
  }

  .form-label-header {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748b;
    margin-bottom: 0.8rem;
    display: block;
  }

  .upload-flex-container {
    display: flex;
    gap: 1.2rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .upload-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .helper-label {
    font-size: 0.78rem;
    color: #94a3b8;
    font-weight: 600;
    margin-bottom: 0.3rem;
  }

  .helper-label.spacer {
    margin-top: 0.8rem;
  }

  .file-selector {
    width: 100%;
    font-size: 0.8rem;
    padding: 0.4rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: white;
    box-sizing: border-box;
  }

  .image-preview-box {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    flex-shrink: 0;
  }

  .srf-textarea {
    width: 100%;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    font-size: 0.92rem;
    outline: none;
    box-sizing: border-box;
    resize: vertical;
    font-family: inherit;
  }

  .srf-textarea:focus {
    border-color: #721D1D;
  }

  .checkbox-banner-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    background: #fff;
    transition: all 0.2s;
  }

  .srf-checkbox {
    width: 18px;
    height: 18px;
    accent-color: #721D1D;
  }

  .check-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: #0f172a;
  }

  .check-subtitle {
    font-size: 0.78rem;
    color: #94a3b8;
  }

  .info-banner {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 0.8rem 1rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: #15803d;
    font-size: 0.82rem;
  }

  .info-banner i {
    font-size: 1.1rem;
  }

  .modal-footer {
    padding: 1.2rem 2rem;
    border-top: 1px solid #f1f5f9;
    flex-shrink: 0;
  }

  /* ===== RESPONSIVENESS ===== */
  
  /* Sidebar Overlay */
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(2px);
    z-index: 90;
  }

  @media (max-width: 992px) {
    .admin-sidebar {
      position: fixed;
      left: -280px;
      top: 0;
      transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      height: 100vh;
    }

    .admin-sidebar.open {
      left: 0;
    }

    .admin-header {
      padding: 2rem 2rem 2.5rem;
    }

    .shop-banner {
      padding: 2rem;
      flex-direction: column;
      align-items: flex-start;
    }

    .shop-mobile-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 0.8rem;
      position: relative;
      z-index: 10;
    }

    .banner-store-title {
      font-size: 2.6rem;
    }

    .credits-glass-card {
      min-width: 100%;
      box-sizing: border-box;
    }

    .mobile-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 0.8rem;
    }

    .mobile-menu-trigger {
      background: none;
      border: none;
      color: white;
      font-size: 1.8rem;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
    }

    .mobile-logo {
      height: 40px;
      width: auto;
    }

    .header-title {
      font-size: 2.4rem;
    }

    .admin-body {
      padding: 2rem;
    }

    .quick-actions {
      grid-template-columns: 1fr;
    }

    .credits-grid {
      grid-template-columns: 1fr;
    }

    .details-grid {
      grid-template-columns: 1fr;
    }

    .product-view-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1.2rem !important;
    }
    .header-actions {
      width: 100%;
    }
    .header-actions button, .header-actions .header-select-wrapper, .header-actions select {
      width: 100% !important;
    }
    .admin-header {
      padding: 1.5rem;
    }
    .admin-body {
      padding: 1.5rem;
    }
    .header-title {
      font-size: 2rem;
    }
    .pane-header-actions {
      flex-direction: column;
      align-items: flex-start;
    }
    .pane-actions-row {
      width: 100%;
    }
    .pane-actions-row button {
      width: 100%;
      justify-content: center;
    }
    .form-row-2 {
      grid-template-columns: 1fr;
    }
    .main-image-frame {
      height: 320px;
    }
    .product-detail-view {
      padding: 1.5rem;
    }
  }

  /* ===== PRODUCT INVENTORY REDESIGN ===== */
  .inventory-header-panel {
    background-color: #721D1D;
    background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 30px 30px;
    padding: 2.5rem 3rem;
    border-radius: 16px 16px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid rgba(0,0,0,0.1);
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .header-text-area {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .inventory-brand-lbl {
    color: #fca5a5;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .inventory-title {
    color: white;
    font-size: 2.6rem;
    font-family: 'Outfit', sans-serif;
    font-weight: 900;
    margin: 0;
    letter-spacing: -0.5px;
    line-height: 1.1;
    font-style: italic;
    text-transform: uppercase;
  }

  .inventory-subtitle {
    color: rgba(255,255,255,0.5);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 1px;
    margin: 0;
    text-transform: uppercase;
  }

  .inventory-add-btn {
    background: white;
    color: #721D1D;
    border: none;
    border-radius: 50px;
    padding: 0.9rem 2rem;
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .inventory-add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.22);
    background: #f8fafc;
  }

  .products-inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    padding: 0.5rem 0 2rem;
  }

  .inventory-product-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,0.02);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
  }

  .inventory-product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.07);
    border-color: #cbd5e1;
  }

  .card-image-wrap {
    height: 200px;
    background: #f8fafc;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #f1f5f9;
    padding: 1.5rem;
  }

  .card-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    mix-blend-mode: darken;
  }

  .no-image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
  }

  .no-image-placeholder i {
    font-size: 3rem;
  }

  .no-image-placeholder span {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .card-soldout-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(1px);
    z-index: 2;
  }

  .card-soldout-capsule {
    background: rgba(241, 245, 249, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.06);
    color: #64748b;
    padding: 0.5rem 1.2rem;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  }

  .card-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: space-between;
  }

  .card-product-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 3rem;
  }

  .card-product-price {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
  }

  .card-product-price i {
    color: #721D1D;
    font-size: 1.1rem;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 1.2rem;
    margin-top: auto;
  }

  /* Toggle Switch Styles */
  .stock-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    user-select: none;
  }

  .stock-switch input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  .stock-switch .slider {
    position: relative;
    width: 36px;
    height: 20px;
    background-color: #cbd5e1;
    transition: .3s cubic-bezier(0.16, 1, 0.3, 1);
    border-radius: 50px;
  }

  .stock-switch .slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s cubic-bezier(0.16, 1, 0.3, 1);
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }

  .stock-switch input:checked + .slider {
    background-color: #721D1D;
  }

  .stock-switch input:checked + .slider:before {
    transform: translateX(16px);
  }

  .stock-switch .switch-text {
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
  }

  .card-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: white;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.2s;
  }

  .card-action-btn:hover {
    border-color: #0f172a;
    color: #0f172a;
    background: #f8fafc;
  }

  .card-action-btn.delete:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: #fef2f2;
  }

  @media (max-width: 992px) {
    .inventory-header-panel {
      padding: 2rem;
    }
    .inventory-title {
      font-size: 2.2rem;
    }
  }

  @media (max-width: 576px) {
    .inventory-header-panel {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.2rem;
      padding: 1.5rem;
    }
    .inventory-add-btn {
      width: 100%;
      justify-content: center;
    }
  }
}
`;

// Appending custom stylesheet dynamically to the component structure
if (typeof document !== 'undefined') {
  const styleId = 'admin-custom-styles';
  let styleElement = document.getElementById(styleId);
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = styleBlock;
    document.head.appendChild(styleElement);
  } else {
    styleElement.innerHTML = styleBlock;
  }
}
