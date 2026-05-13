"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link href="/" className="logo">
            <img src="/logo.webp" alt="SRF Apparel" className="brand-logo" />
          </Link>
          <p>The official merchandise and workwear portal exclusively for SRF employees.</p>
        </div>
        <div className="footer-links">
          <h4>Shop</h4>
          <a href="#">Polos & Tees</a>
          <a href="#">Outerwear</a>
          <a href="#">Safety Gear</a>
          <a href="#">Headwear</a>
        </div>
        <div className="footer-links">
          <h4>Account</h4>
          <a href="#">My Balance</a>
          <a href="#">Order History</a>
          <a href="#">Shipping Policy</a>
        </div>
        <div className="footer-contact">
          <h4>Need Help?</h4>
          <p><i className='bx bx-envelope'></i> support@srfapparel.com</p>
          <p><i className='bx bx-buildings'></i> Internal HR Department</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 SRF Apparel. Internal Use Only.</p>
      </div>
    </footer>
  );
}
