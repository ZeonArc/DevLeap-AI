"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function StripeCheckoutButton({ planId, label, className }: { planId: string, label: string, className?: string }) {
  const [loading, setLoading] = useState(false);
  const { userId, getToken } = useAuth();

  const handleCheckout = async () => {
    if (!userId) {
      alert("Please sign in first to upgrade to Pro.");
      return;
    }
    
    setLoading(true);
    try {
      const token = await getToken();
      
      // Create Checkout Session from our backend
      const response = await fetch("http://localhost:8000/api/v1/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_id: planId, user_id: userId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Backend returns { url: "https://checkout.stripe.com/..." }
      // Redirect to the Stripe-hosted checkout page
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from backend.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error initiating checkout. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={loading}
      className={`px-8 py-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold uppercase tracking-[0.2em] transition-colors rounded-sm flex justify-center items-center ${className || ''}`}
    >
      {loading ? "Loading..." : label}
    </button>
  );
}
