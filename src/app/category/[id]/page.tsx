"use client";

import { useStore } from "@/context/StoreContext";
import PageHero from "@/components/PageHero";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CategoryPage() {
  const { id } = useParams();
  const { globalProducts: products, categories, addToCart } = useStore();

  const category = categories.find(c => c.id === Number(id));
  const categoryProducts = products.filter(p => p.category_id === Number(id));

  if (!category) {
    return (
      <div style={{ padding: '8rem 2rem', textAlign: 'center', minHeight: '80vh' }}>
        <h2>Category not found.</h2>
        <Link href="/" className="btn btn-glow" style={{ marginTop: '2rem' }}>Back to Shop</Link>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <PageHero
        bgType="dark"
        badge={{ icon: 'bx-category', label: 'Department' }}
        title="Category:"
        titleHighlight={category.name}
        subtitle={`Discover our exclusive range of ${category.name}`}
      />

      <div className="section-container" style={{ padding: '4rem 2rem', minHeight: '60vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '0.5rem' }}>{category.name} Collection</h2>
            <p style={{ color: '#64748b' }}>Showing {categoryProducts.length} items</p>
          </div>
          <Link href="/" style={{ color: '#721D1D', fontWeight: '600', textDecoration: 'none' }}>
            <i className='bx bx-left-arrow-alt'></i> Back to all products
          </Link>
        </div>

        {categoryProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '24px' }}>
            <i className='bx bx-shopping-bag' style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '1.5rem' }}></i>
            <h3 style={{ color: '#64748b' }}>No products found in this category.</h3>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Stay tuned! We're adding new items soon.</p>
            <Link href="/" className="btn btn-glow">Browse All Products</Link>
          </div>
        ) : (
          <div className="product-grid">
            {categoryProducts.map((product) => {
              const isSoldOut = product.gallery?.includes('out_of_stock') || false;
              return (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    <Link href={`/product/${product.id}`}>
                      <img src={product.image} alt={product.title} className="product-image" />
                    </Link>
                    {isSoldOut && (
                      <span className="shop-card-soldout" style={{ 
                        position: 'absolute', top: '1rem', left: '1rem', 
                        background: '#fee2e2', color: '#b91c1c', 
                        padding: '0.4rem 0.8rem', borderRadius: '50px', 
                        fontSize: '0.78rem', fontWeight: '800', 
                        textTransform: 'uppercase', zIndex: 5 
                      }}>Sold Out</span>
                    )}
                    <div className="product-image-overlay">
                      <button 
                        className="add-to-cart-btn" 
                        onClick={() => !isSoldOut && addToCart(product)}
                        disabled={isSoldOut}
                        style={isSoldOut ? { background: '#cbd5e1', cursor: 'not-allowed', color: '#64748b' } : {}}
                      >
                        {isSoldOut ? "Out of Stock" : "Add to Order"}
                      </button>
                    </div>
                  </div>
                <div className="product-info">
                  <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                    <h3 className="product-title">{product.title}</h3>
                  </Link>
                  <p className="product-desc" style={{ 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden', 
                    minHeight: '2.4rem' 
                  }}>
                    {product.description || product.desc}
                  </p>
                  <span className="product-price">{product.price} <i className='bx bxs-coin-stack'></i></span>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
