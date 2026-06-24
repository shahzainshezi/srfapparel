"use client";

import { useStore } from "@/context/StoreContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageHero from "@/components/PageHero";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";


export default function ProductPage() {
  const { id } = useParams();
  const { addToCart, globalProducts } = useStore();
  const [activeTab, setActiveTab] = useState('details');
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  
  const colorMap: { [key: string]: string } = {
    'Black': '#000000',
    'White': '#ffffff',
    'Red': '#ef4444',
    'Blue': '#3b82f6',
    'Navy': '#1e3a8a',
    'New Navy': '#1B2A4A',
    'Grey': '#64748b',
    'Gray': '#64748b',
    'Heather Grey': '#9CA3AF',
    'Green': '#22c55e',
    'Yellow': '#eab308',
    'Orange': '#f97316',
    'Purple': '#a855f7',
    'Pink': '#ec4899',
    'Brown': '#78350f',
    'Carhartt Brown': '#8C5229',
    'Brite Lime': '#CCFF00',
    'Beige': '#f5f5dc',
    'Maroon': '#800000',
    'Gold': '#ffd700',
    'Silver': '#c0c0c0',
    'Charcoal': '#36454f',
    'Anthracite': '#3E4149',
    'Dark Khaki': '#998D76',
    'Steel': '#7A8B99',
    'Fresh Water Blue': '#85B4D0'
  };

  const getColorHex = (colorName: string) => {
    if (colorMap[colorName]) return colorMap[colorName];
    const lower = colorName.toLowerCase();
    for (const [k, v] of Object.entries(colorMap)) {
      if (lower.includes(k.toLowerCase())) return v;
    }
    return '#e2e8f0';
  };

  const product = globalProducts.find(p => p.id === Number(id));

  if (!product) {
    return (
      <div style={{ padding: '8rem 2rem', textAlign: 'center', minHeight: '80vh' }}>
        <h2>Product not found.</h2>
        <Link href="/" className="btn btn-glow" style={{ marginTop: '2rem' }}>Back to Shop</Link>
      </div>
    );
  }

  const mapProductImage = (url: string): string => {
    if (!url) return '';
    if (url.includes('SR-FREEMAN-6-25-scaled.jpg')) {
      return '/images/products/prod_9_brown.png';
    }
    if (url.endsWith('/1.jpg') || url.includes('/1.jpg')) {
      return '/images/products/prod_9_grey.png';
    }
    if (url.includes('288_1-scaled.jpg')) {
      return '/images/products/prod_9_navy.png';
    }
    return url;
  };

  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : null;
  const colors = product.colors && product.colors.length > 0 ? product.colors : null;

  const cleanGallery = product.gallery ? product.gallery.filter((g: string) => g !== 'out_of_stock') : [];
  const galleryImages = (cleanGallery.length > 0 
    ? [product.image, ...cleanGallery] 
    : [product.image]).map(mapProductImage);
  const isSoldOut = product.gallery?.includes('out_of_stock') || false;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    
    // Find matching image for this color
    let matchedImage = '';
    if (product.id === 2) {
      if (color === 'Fresh Water Blue') {
        matchedImage = product.image;
      } else if (color === 'Dark Khaki') {
        matchedImage = '/images/products/prod_2_dark_khaki_front.png';
      } else if (color === 'Navy') {
        matchedImage = '/images/products/prod_2_navy_front.png';
      } else if (color === 'Steel') {
        matchedImage = '/images/products/prod_2_steel_front.png';
      }
    } else if (product.id === 5) {
      if (color === 'Anthracite') {
        matchedImage = product.image;
      } else if (color === 'Black') {
        matchedImage = '/images/products/prod_5_black_front.png';
      } else if (color === 'Navy') {
        matchedImage = '/images/products/prod_5_navy_front.png';
      } else if (color === 'White') {
        matchedImage = '/images/products/prod_5_white_front.png';
      }
    } else if (product.id === 6) {
      if (color === 'Black') {
        matchedImage = product.image;
      } else if (color === 'Midnight Navy') {
        matchedImage = '/images/products/prod_6_navy_front.png';
      } else if (color === 'White') {
        matchedImage = '/images/products/prod_6_white_front.png';
      }
    } else if (product.id === 8) {
      if (color === 'Black') {
        matchedImage = '/images/products/prod_8_black_front.png';
      } else if (color === 'Carbon Heather') {
        matchedImage = '/images/products/prod_8_carbon_front.png';
      } else if (color === 'Heather Grey') {
        matchedImage = product.image;
      } else if (color === 'Navy') {
        matchedImage = '/images/products/prod_8_navy_front.png';
      }
    } else if (product.id === 9) {
      if (color === 'Black') {
        matchedImage = product.image;
      } else if (color === 'Carhartt Brown') {
        matchedImage = '/images/products/prod_9_brown.png';
      } else if (color === 'Heather Grey') {
        matchedImage = '/images/products/prod_9_grey.png';
      } else if (color === 'New Navy') {
        matchedImage = '/images/products/prod_9_navy.png';
      }
    } else {
      // Fallback keyword matching for other products
      const lowerColor = color.toLowerCase();
      const found = galleryImages.find(img => {
        const lowerImg = img.toLowerCase();
        return lowerImg.includes(lowerColor) || 
               (lowerColor.includes('navy') && lowerImg.includes('navy')) ||
               (lowerColor.includes('grey') && (lowerImg.includes('grey') || lowerImg.includes('gray'))) ||
               (lowerColor.includes('brown') && lowerImg.includes('brown')) ||
               (lowerColor.includes('black') && lowerImg.includes('black'));
      });
      if (found) matchedImage = found;
    }
    
    if (matchedImage) {
      setActiveImage(matchedImage);
    }
  };

  // Auto-select first available option
  useEffect(() => {
    if (sizes && !selectedSize) setSelectedSize(sizes[0]);
    if (colors && !selectedColor) {
      const firstColor = colors[0];
      setSelectedColor(firstColor);
      
      // Auto-set the correct image for first color
      if (product.id === 2) {
        if (firstColor === 'Fresh Water Blue') setActiveImage(product.image);
        else if (firstColor === 'Dark Khaki') setActiveImage('/images/products/prod_2_dark_khaki_front.png');
        else if (firstColor === 'Navy') setActiveImage('/images/products/prod_2_navy_front.png');
        else if (firstColor === 'Steel') setActiveImage('/images/products/prod_2_steel_front.png');
      } else if (product.id === 5) {
        if (firstColor === 'Anthracite') setActiveImage(product.image);
        else if (firstColor === 'Black') setActiveImage('/images/products/prod_5_black_front.png');
        else if (firstColor === 'Navy') setActiveImage('/images/products/prod_5_navy_front.png');
        else if (firstColor === 'White') setActiveImage('/images/products/prod_5_white_front.png');
      } else if (product.id === 6) {
        if (firstColor === 'Black') setActiveImage(product.image);
        else if (firstColor === 'Midnight Navy') setActiveImage('/images/products/prod_6_navy_front.png');
        else if (firstColor === 'White') setActiveImage('/images/products/prod_6_white_front.png');
      } else if (product.id === 8) {
        if (firstColor === 'Black') setActiveImage('/images/products/prod_8_black_front.png');
        else if (firstColor === 'Carbon Heather') setActiveImage('/images/products/prod_8_carbon_front.png');
        else if (firstColor === 'Heather Grey') setActiveImage(product.image);
        else if (firstColor === 'Navy') setActiveImage('/images/products/prod_8_navy_front.png');
      } else if (product.id === 9) {
        if (firstColor === 'Black') setActiveImage(product.image);
        else if (firstColor === 'Carhartt Brown') setActiveImage('/images/products/prod_9_brown.png');
        else if (firstColor === 'Heather Grey') setActiveImage('/images/products/prod_9_grey.png');
        else if (firstColor === 'New Navy') setActiveImage('/images/products/prod_9_navy.png');
      } else {
        setActiveImage(product.image);
      }
    } else if (product && !activeImage) {
      setActiveImage(product.image);
    }
  }, [sizes, colors, selectedSize, selectedColor, product, activeImage]);

  return (
    <ProtectedRoute>
      <PageHero
        bgType="image"
        bgImage="/slide1.jpg"
        badge={{ icon: 'bx-diamond', label: 'Premium Workwear' }}
        title="Gear"
        titleHighlight="Details"
        subtitle={product.title}
      />

      <div className="product-page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="product-page-grid">
          
          {/* Left: Huge Premium Image + Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '120px', alignSelf: 'start' }}>
            <div style={{ background: '#f8fafc', borderRadius: '24px', overflow: 'hidden', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px', border: '1px solid #f1f5f9' }}>
              <img 
                src={activeImage || product.image} 
                alt={product.title} 
                style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'darken', transition: 'all 0.5s ease' }} 
              />
            </div>
            
            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    style={{ 
                      aspectRatio: '1/1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: activeImage === img ? '2px solid #721D1D' : '2px solid transparent',
                      padding: '4px',
                      background: '#fff',
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', opacity: activeImage === img ? 1 : 0.6 }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div style={{ padding: '2rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>SRF APPAREL EXCLUSIVE</span>
            </div>
            
            <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', color: '#0f172a', marginBottom: '1rem', lineHeight: '1.1' }}>
              {product.title}
            </h1>
            
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              {product.price} <i className='bx bxs-coin-stack'></i>
            </div>

            <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              {product.description || product.desc || 'Premium SRF workwear engineered for durability and comfort on the job site.'}
            </p>

            {sizes && (
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>Select Size</span>
                  <a href="#" style={{ color: '#64748b', textDecoration: 'underline', fontSize: '0.9rem' }}>Size Guide</a>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  {sizes.map((size: string) => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{ 
                        width: '60px', height: '60px', borderRadius: '12px', 
                        background: selectedSize === size ? '#0f172a' : '#f8fafc',
                        color: selectedSize === size ? '#fff' : '#0f172a',
                        border: selectedSize === size ? 'none' : '1px solid #e2e8f0',
                        fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {colors && (
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>Select Color</span>
                </div>
                <div className="color-swatches">
                  {colors.map((color: string) => {
                    const colorHex = getColorHex(color);
                    return (
                      <div 
                        key={color}
                        onClick={() => handleColorSelect(color)}
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

            {!isSoldOut && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.8rem' }}>Quantity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{ width: '45px', height: '45px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#64748b', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', minWidth: '40px', textAlign: 'center', color: '#0f172a' }}>{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => q + 1)}
                      style={{ width: '45px', height: '45px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#64748b', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button 
              className="add-to-cart-btn" 
              onClick={() => {
                if (!isSoldOut) {
                  addToCart(product, selectedSize, selectedColor, quantity);
                  setQuantity(1);
                }
              }}
              disabled={isSoldOut}
              style={{ 
                width: '100%', height: '65px', fontSize: '1.2rem', borderRadius: '16px', marginBottom: '3rem',
                opacity: isSoldOut ? 0.6 : 1,
                cursor: isSoldOut ? 'not-allowed' : 'pointer'
              }}
            >
              {isSoldOut ? "Out of Stock" : "Add to Order"} <i className='bx bx-cart-alt' style={{ fontSize: '1.5rem' }}></i>
            </button>

            {/* Premium Details Tabs */}
            <div style={{ borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setActiveTab('details')}
                  style={{ padding: '1rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'details' ? '2px solid #0f172a' : '2px solid transparent', color: activeTab === 'details' ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '1.05rem', cursor: 'pointer' }}
                >
                  Product Details
                </button>
                <button 
                  onClick={() => setActiveTab('shipping')}
                  style={{ padding: '1rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'shipping' ? '2px solid #0f172a' : '2px solid transparent', color: activeTab === 'shipping' ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '1.05rem', cursor: 'pointer' }}
                >
                  Delivery Info
                </button>
              </div>
              
              {activeTab === 'details' && (
                <div style={{ color: '#475569', lineHeight: '1.8' }}>
                  {product.description || product.desc ? (
                    <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>{product.description || product.desc}</p>
                  ) : (
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      <li>Heavy-duty 100% breathable material.</li>
                      <li>SRF Official Logo embroidered on left chest.</li>
                      <li>Machine wash cold, tumble dry low.</li>
                      <li>Approved for all active SRF field sites.</li>
                    </ul>
                  )}
                </div>
              )}
              {activeTab === 'shipping' && (
                <p style={{ color: '#475569', lineHeight: '1.6' }}>
                  Orders placed using SRF Bucks are processed internally. Gear is typically delivered directly to your specified delivery address within 5-7 business days.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
      
    </ProtectedRoute>
  );
}
