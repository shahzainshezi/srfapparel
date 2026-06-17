"use client";

import { useState, useEffect, Suspense } from "react";
import { useStore } from "@/context/StoreContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0f172a' }} />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const { resetPassword } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Slider state (same as login)
  const slides = ['/slide1.jpg', '/slide2.jpg', '/slide3.jpg', '/slide4.jpg', '/slide5.jpg'];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !employeeId || !newPassword || !confirmPassword) {
      return setError("Please fill all fields.");
    }
    
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    
    setIsLoading(true);
    try {
      const isSuccess = await resetPassword(email.trim(), employeeId.trim(), newPassword);
      if (isSuccess) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError("Invalid Email or Employee ID. Verification failed.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      minHeight: "100vh",
      display: "flex",
      position: "relative",
      overflowX: "hidden",
      overflowY: "auto"
    }}>
      {/* ===== BACKGROUND IMAGE SLIDER ===== */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0
      }}>
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url('${slide}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: index === currentSlide ? 1 : 0,
              transition: "opacity 1.5s ease-in-out",
              transform: index === currentSlide ? "scale(1.05)" : "scale(1)",
              transitionProperty: "opacity, transform",
              transitionDuration: "1.5s, 8s",
              transitionTimingFunction: "ease-in-out, linear"
            }}
          />
        ))}
        {/* Dark overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.30) 100%)"
        }} />
      </div>

      {/* ===== LEFT SIDE — Branding ===== */}
      <div className="mobile-logo-top" style={{ 
        display: 'none', 
        justifyContent: 'center', 
        padding: '2rem 0',
        position: 'relative',
        zIndex: 10
      }}>
        <img src="/logo.webp" alt="SRF Apparel" style={{ height: "80px", objectFit: "contain" }} />
      </div>

      <div className="login-left" style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "4rem",
        position: "relative",
        zIndex: 1
      }}>
        <div className="desktop-logo">
          <Link href="/login">
            <img src="/logo.webp" alt="SRF Apparel" className="login-logo" style={{ height: "100px", objectFit: "contain", marginBottom: "3rem" }} />
          </Link>
        </div>

        <div className="portal-badge" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(130,19,43,0.4)",
          border: "1px solid rgba(130,19,43,0.6)",
          borderRadius: "50px",
          padding: "0.4rem 1rem",
          marginBottom: "1.5rem",
          width: "fit-content"
        }}>
          <i className="bx bx-key" style={{ color: "#fca5a5", fontSize: "1rem" }} />
          <span style={{ color: "#fca5a5", fontSize: "0.78rem", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
            Identity Verification
          </span>
        </div>

        <h1 style={{
          color: "white",
          fontSize: "3.5rem",
          fontFamily: "var(--font-heading)",
          fontWeight: "900",
          lineHeight: "1.1",
          marginBottom: "1.5rem",
          textTransform: "uppercase",
          letterSpacing: "-1px"
        }}>
          Lost your<br />
          <span style={{
            background: "linear-gradient(90deg, #ef4444, #82132B)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Password?</span>
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: "1.1rem",
          lineHeight: "1.7",
          maxWidth: "420px"
        }}>
          Don&apos;t worry, it happens. Provide your official employee email and ID to verify your account and set a new secure password.
        </p>
      </div>

      {/* ===== RIGHT SIDE — Reset Form ===== */}
      <div className="login-right" style={{
        width: "520px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2.5rem",
        position: "relative",
        zIndex: 1,
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {success ? (
             <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
                <div style={{
                  width: "80px", height: "80px",
                  background: "rgba(16,185,129,0.1)",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 2rem",
                  color: "#10b981", fontSize: "2.5rem",
                  boxShadow: "0 0 30px rgba(16,185,129,0.2)"
                }}>
                  <i className="bx bx-check-shield" />
                </div>
                <h2 style={{ color: "white", fontSize: "2.2rem", fontWeight: "800", marginBottom: "1rem" }}>Success!</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem", lineHeight: "1.6" }}>
                  Your password has been reset successfully.<br />
                  Redirecting you back to login...
                </p>
             </div>
          ) : (
            <>
              <h2 style={{
                color: "white",
                fontSize: "2rem",
                fontFamily: "var(--font-heading)",
                fontWeight: "800",
                marginBottom: "0.5rem"
              }}>
                Secure Reset
              </h2>
              <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: "2.5rem", fontSize: "0.95rem" }}>
                Enter your details to recover access
              </p>

              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  color: "#fca5a5",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  animation: "shake 0.4s ease"
                }}>
                  <i className="bx bx-error-circle" style={{ fontSize: "1.2rem", flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "1px" }}>Email</label>
                    <input 
                      type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@srf.com" required
                      style={{ width: "100%", padding: "0.9rem 1rem", background: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px", color: "#0f172a", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "1px" }}>Emp ID</label>
                    <input 
                      type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="EMP-XXX" required
                      style={{ width: "100%", padding: "0.9rem 1rem", background: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px", color: "#0f172a", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0.5rem 0" }} />

                <div>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "1px" }}>New Password</label>
                  <input 
                    type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required
                    style={{ width: "100%", padding: "0.9rem 1rem", background: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px", color: "#0f172a", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "1px" }}>Confirm Password</label>
                  <input 
                    type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required
                    style={{ width: "100%", padding: "0.9rem 1rem", background: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px", color: "#0f172a", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%", padding: "1rem",
                    background: isLoading ? "rgba(130,19,43,0.5)" : "linear-gradient(135deg, #82132B 0%, #c21807 100%)",
                    border: "none", borderRadius: "10px", color: "white",
                    fontSize: "0.95rem", fontWeight: "800", letterSpacing: "1.5px", textTransform: "uppercase",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    marginTop: "1rem",
                    boxShadow: isLoading ? "none" : "0 8px 25px rgba(130,19,43,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.8rem"
                  }}
                >
                  {isLoading ? "Verifying..." : "Update Password"}
                </button>

                <Link href="/login" style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "0.9rem", marginTop: "1rem", fontWeight: "600" }}>
                  <i className="bx bx-arrow-back" /> Back to Login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
        @media (max-width: 992px) {
          .login-container { flex-direction: column !important; height: auto !important; min-height: 100vh !important; }
          .mobile-logo-top { display: flex !important; }
          .desktop-logo { display: none !important; }
          .login-left { padding: 1rem 2rem 3rem !important; flex: none !important; text-align: center !important; }
          .login-left h1 { font-size: 2.6rem !important; }
          .login-right { width: 100% !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,0.1) !important; padding: 2rem 1.5rem 3rem !important; }
        }
      `}</style>
    </div>
  );
}
