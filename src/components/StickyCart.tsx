"use client";

import { useStore } from "@/context/StoreContext";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function StickyCart() {
  const { cart, isCartOpen, setIsCartOpen, currentUser } = useStore();
  const [prevCount, setPrevCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const pathname = usePathname();

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (totalItems > prevCount) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevCount(totalItems);
  }, [totalItems, prevCount]);

  // Don't render if there's no user, no items, if checkout page, or if the drawer is already open.
  if (!currentUser || totalItems === 0 || isCartOpen || pathname === "/checkout") {
    return null;
  }

  return (
    <button 
      onClick={() => setIsCartOpen(true)}
      className={`sticky-cart-btn ${pulse ? "pulse" : ""}`}
      aria-label="Open shopping cart"
    >
      <i className='bx bx-shopping-bag'></i>
      <span className="sticky-cart-badge">{totalItems}</span>
    </button>
  );
}
