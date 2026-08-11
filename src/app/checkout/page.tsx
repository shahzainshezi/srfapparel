"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CLIENT_API_SECRET = process.env.NEXT_PUBLIC_CLIENT_API_SECRET || "srf_secret_api_key_2026_x9k";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, currentUser, checkout, credits } = useStore();

  // Form State
  const [employeeNumberInput, setEmployeeNumberInput] = useState("");
  const [shippingInfo, setShippingInfo] = useState({
    fullName: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });

  // Credit Balance Lookup State
  const [liveEmployee, setLiveEmployee] = useState<any>(null);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [isSearchingCredit, setIsSearchingCredit] = useState(false);
  const [creditSearchError, setCreditSearchError] = useState("");
  const [useEmployeeCredits, setUseEmployeeCredits] = useState(true);

  // Order Placement State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState("");

  // Sync shipping info if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setShippingInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.name,
        email: prev.email || currentUser.email,
      }));
      setLiveBalance(credits);
    }
  }, [currentUser, credits]);

  // Lookup credit balance by employee_number or employee_id
  const handleLookupCredit = async (empNum?: string) => {
    const queryNum = empNum || employeeNumberInput;
    if (!queryNum.trim()) {
      setCreditSearchError("Please enter an employee number.");
      return;
    }

    setIsSearchingCredit(true);
    setCreditSearchError("");

    try {
      const res = await fetch(`/api/credits/balance?employee_number=${encodeURIComponent(queryNum.trim())}`, {
        headers: {
          Authorization: `Bearer ${CLIENT_API_SECRET}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreditSearchError(data.error || "Employee not found in credit database.");
        setLiveEmployee(null);
        setLiveBalance(null);
      } else {
        setLiveEmployee(data.employee);
        setLiveBalance(data.balance);
      }
    } catch (err) {
      setCreditSearchError("Failed to verify credit balance. Please try again.");
    } finally {
      setIsSearchingCredit(false);
    }
  };

  // Handle final order submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (cart.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.phone) {
      setCheckoutError("Please fill out all required shipping details.");
      return;
    }

    setIsSubmitting(true);

    try {
      const targetEmpId = liveEmployee?.id || currentUser?.id;
      const availableBalance = liveBalance !== null ? liveBalance : credits;

      if (useEmployeeCredits) {
        if (!targetEmpId) {
          setCheckoutError("Please search or log in with your Employee ID to use credits.");
          setIsSubmitting(false);
          return;
        }

        if (availableBalance < cartTotal) {
          setCheckoutError(`Insufficient credit balance ($${availableBalance.toFixed(2)} available vs $${cartTotal.toFixed(2)} total).`);
          setIsSubmitting(false);
          return;
        }

        // 1. Deduct credits via API endpoint
        const deductRes = await fetch("/api/credits/deduct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CLIENT_API_SECRET}`,
          },
          body: JSON.stringify({
            employee_id: targetEmpId,
            amount: cartTotal,
            reference_note: `Checkout Order - ${cart.length} item(s)`,
          }),
        });

        const deductData = await deductRes.json();

        if (!deductRes.ok || !deductData.success) {
          setCheckoutError(deductData.error || "Failed to process credit deduction.");
          setIsSubmitting(false);
          return;
        }

        // 2. Complete order in local state context
        const orderPlaced = await checkout(shippingInfo);
        if (orderPlaced) {
          setOrderSuccessModal({
            orderId: deductData.transaction?.id ? `ORD-${deductData.transaction.id.slice(0, 8).toUpperCase()}` : `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            amountPaid: cartTotal,
            remainingBalance: deductData.new_balance,
            employeeName: liveEmployee ? `${liveEmployee.first_name} ${liveEmployee.last_name}` : currentUser?.name,
          });
        } else {
          setCheckoutError("Failed to record order details. Please contact support.");
        }
      } else {
        // Standard Checkout without credit deduction
        const orderPlaced = await checkout(shippingInfo);
        if (orderPlaced) {
          setOrderSuccessModal({
            orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            amountPaid: cartTotal,
            remainingBalance: availableBalance,
            employeeName: shippingInfo.fullName,
          });
        }
      }
    } catch (err: any) {
      setCheckoutError(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-wrapper" style={styles.pageBackground}>
      <div className="section-container" style={styles.container}>
        {/* Header Breadcrumb */}
        <div style={styles.headerBar}>
          <div>
            <Link href="/" style={styles.backLink}>
              <i className="bx bx-left-arrow-alt" style={{ fontSize: "1.2rem", marginRight: "6px" }}></i>
              Return to Shop
            </Link>
            <h1 style={styles.pageTitle}>Secure Checkout</h1>
            <p style={styles.pageSubtitle}>Complete your order using Employee Store Credits</p>
          </div>
        </div>

        {cart.length === 0 && !orderSuccessModal ? (
          <div style={styles.emptyCard}>
            <i className="bx bx-shopping-bag" style={{ fontSize: "4rem", color: "var(--primary)" }}></i>
            <h2 style={{ marginTop: "1rem", color: "var(--text-main)" }}>Your Cart is Empty</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Add items to your cart before proceeding to checkout.</p>
            <Link href="/" style={styles.actionBtn}>
              Browse SRF Collection
            </Link>
          </div>
        ) : (
          <div style={styles.grid}>
            {/* Left Column: Form & Credit Lookup */}
            <div>
              {/* Employee Credit Verification Box */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <i className="bx bx-wallet" style={{ fontSize: "1.5rem", color: "var(--primary)", marginRight: "10px" }}></i>
                  <h2 style={styles.cardTitle}>Employee Credit Bucks</h2>
                </div>

                <div style={{ padding: "1.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "1rem" }}>
                    <input
                      type="checkbox"
                      checked={useEmployeeCredits}
                      onChange={(e) => setUseEmployeeCredits(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                    />
                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                      Pay using SRF Employee Credit Balance
                    </span>
                  </label>

                  {useEmployeeCredits && (
                    <div style={styles.creditLookupBox}>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>
                        Enter your HR Employee Number (e.g. <strong>EMP-1001</strong>) to check & apply available credit balance:
                      </p>

                      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
                        <input
                          type="text"
                          placeholder="Enter Employee Number..."
                          value={employeeNumberInput}
                          onChange={(e) => setEmployeeNumberInput(e.target.value)}
                          style={styles.input}
                        />
                        <button
                          type="button"
                          onClick={() => handleLookupCredit()}
                          disabled={isSearchingCredit}
                          style={styles.secondaryBtn}
                        >
                          {isSearchingCredit ? "Checking..." : "Verify Credit"}
                        </button>
                      </div>

                      {creditSearchError && (
                        <div style={styles.errorBanner}>
                          <i className="bx bx-error-circle" style={{ marginRight: "6px" }}></i>
                          {creditSearchError}
                        </div>
                      )}

                      {/* Display Checked Balance */}
                      {liveBalance !== null && (
                        <div style={styles.balanceDisplayBox}>
                          <div>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Available Credit Balance</span>
                            <div style={styles.balanceText}>${liveBalance.toFixed(2)}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {liveEmployee && (
                              <span style={styles.employeeBadge}>
                                {liveEmployee.first_name} {liveEmployee.last_name} ({liveEmployee.employee_number})
                              </span>
                            )}
                            <div style={{ fontSize: "0.85rem", marginTop: "4px", color: liveBalance >= cartTotal ? "#10b981" : "#ef4444" }}>
                              {liveBalance >= cartTotal ? "✓ Covers Order Total" : `⚠ Need $${(cartTotal - liveBalance).toFixed(2)} more`}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Details Form */}
              <form onSubmit={handlePlaceOrder} style={{ marginTop: "1.5rem" }}>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <i className="bx bx-map-pin" style={{ fontSize: "1.5rem", color: "var(--primary)", marginRight: "10px" }}></i>
                    <h2 style={styles.cardTitle}>Shipping & Delivery Info</h2>
                  </div>

                  <div style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
                    <div>
                      <label style={styles.label}>Full Name *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.fullName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                        placeholder="John Doe"
                        style={styles.input}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={styles.label}>Email Address</label>
                        <input
                          type="email"
                          value={shippingInfo.email}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                          placeholder="employee@company.com"
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                          placeholder="+1 555-0199"
                          style={styles.input}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={styles.label}>Shipping Address *</label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                        placeholder="123 Corporate Blvd, Suite 400"
                        style={styles.input}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={styles.label}>City *</label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          placeholder="New York"
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Postal / ZIP Code</label>
                        <input
                          type="text"
                          value={shippingInfo.postalCode}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                          placeholder="10001"
                          style={styles.input}
                        />
                      </div>
                    </div>

                    {checkoutError && (
                      <div style={styles.errorBanner}>
                        <i className="bx bx-error-circle" style={{ marginRight: "6px" }}></i>
                        {checkoutError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{ ...styles.actionBtn, marginTop: "1rem", width: "100%" }}
                    >
                      {isSubmitting ? "Processing Order & Deducting Credits..." : `Complete Order ($${cartTotal.toFixed(2)})`}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <i className="bx bx-receipt" style={{ fontSize: "1.5rem", color: "var(--primary)", marginRight: "10px" }}></i>
                  <h2 style={styles.cardTitle}>Order Summary ({cart.length} Items)</h2>
                </div>

                <div style={{ padding: "1.5rem" }}>
                  <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "5px" }}>
                    {cart.map((item) => (
                      <div key={item.cartItemId} style={styles.cartItemRow}>
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{ width: "55px", height: "55px", objectFit: "cover", borderRadius: "8px" }}
                        />
                        <div style={{ flex: 1, marginLeft: "12px" }}>
                          <h4 style={{ fontSize: "0.95rem", color: "var(--text-main)", marginBottom: "2px" }}>{item.title}</h4>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Size: {item.selectedSize || "N/A"} | Qty: {item.quantity}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.2rem 0" }} />

                  <div style={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Shipping</span>
                    <span style={{ color: "#10b981", fontWeight: 600 }}>FREE (Company Benefit)</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Employee Credit Applied</span>
                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                      -${useEmployeeCredits ? cartTotal.toFixed(2) : "0.00"}
                    </span>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.2rem 0" }} />

                  <div style={{ ...styles.summaryRow, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>
                    <span>Total Due</span>
                    <span>${useEmployeeCredits ? "0.00" : cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Success Modal */}
        {orderSuccessModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalIconBox}>
                <i className="bx bx-check-circle" style={{ fontSize: "3.5rem", color: "#10b981" }}></i>
              </div>
              <h2 style={{ fontSize: "1.6rem", color: "var(--text-main)", marginTop: "1rem" }}>
                Order Placed Successfully!
              </h2>
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Thank you for your order, <strong>{orderSuccessModal.employeeName}</strong>.
              </p>

              <div style={styles.modalDetailsBox}>
                <div style={styles.modalDetailRow}>
                  <span>Order Reference ID:</span>
                  <strong>{orderSuccessModal.orderId}</strong>
                </div>
                <div style={styles.modalDetailRow}>
                  <span>Amount Deducted from Credits:</span>
                  <strong style={{ color: "var(--primary)" }}>${orderSuccessModal.amountPaid.toFixed(2)}</strong>
                </div>
                <div style={styles.modalDetailRow}>
                  <span>Remaining Credit Balance:</span>
                  <strong style={{ color: "#10b981" }}>${orderSuccessModal.remainingBalance.toFixed(2)}</strong>
                </div>
              </div>

              <div style={{ marginTop: "1.8rem", display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link href="/" style={styles.actionBtn}>
                  Return to Store
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline Styling System
const styles: Record<string, React.CSSProperties> = {
  pageBackground: {
    minHeight: "100vh",
    backgroundColor: "var(--bg-dark)",
    padding: "2rem 0 4rem",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1.5rem",
  },
  headerBar: {
    marginBottom: "2rem",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    color: "var(--text-muted)",
    textDecoration: "none",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
    fontWeight: 500,
  },
  pageTitle: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "var(--text-main)",
  },
  pageSubtitle: {
    color: "var(--text-muted)",
    fontSize: "0.95rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "2rem",
  },
  card: {
    backgroundColor: "var(--bg-card)",
    borderRadius: "16px",
    border: "1px solid var(--border)",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  },
  cardHeader: {
    padding: "1.2rem 1.5rem",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.01)",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--text-main)",
  },
  creditLookupBox: {
    backgroundColor: "var(--bg-card-hover)",
    padding: "1.2rem",
    borderRadius: "12px",
    border: "1px solid var(--border)",
  },
  balanceDisplayBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    backgroundColor: "var(--bg-card)",
    borderRadius: "10px",
    border: "1px solid var(--border)",
  },
  balanceText: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "var(--primary)",
  },
  employeeBadge: {
    display: "inline-block",
    backgroundColor: "rgba(153, 10, 39, 0.1)",
    color: "var(--primary)",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: "6px",
  },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-main)",
    marginBottom: "0.4rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--bg-card)",
    color: "var(--text-main)",
    fontSize: "0.95rem",
    outline: "none",
  },
  secondaryBtn: {
    padding: "0.75rem 1.2rem",
    backgroundColor: "var(--text-main)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.9rem 1.8rem",
    backgroundColor: "var(--primary)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "0 4px 14px var(--primary-glow)",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    padding: "0.8rem 1rem",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    borderRadius: "8px",
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  cartItemRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.95rem",
    marginBottom: "0.8rem",
    color: "var(--text-muted)",
  },
  emptyCard: {
    backgroundColor: "var(--bg-card)",
    borderRadius: "16px",
    padding: "4rem 2rem",
    textAlign: "center",
    border: "1px solid var(--border)",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: "var(--bg-card)",
    borderRadius: "20px",
    padding: "2.5rem",
    maxWidth: "500px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
  },
  modalIconBox: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalDetailsBox: {
    backgroundColor: "var(--bg-card-hover)",
    padding: "1.2rem",
    borderRadius: "12px",
    marginTop: "1.5rem",
    textAlign: "left",
    border: "1px solid var(--border)",
  },
  modalDetailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    marginBottom: "0.6rem",
  },
};
