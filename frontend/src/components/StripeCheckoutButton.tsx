"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getErrorMessage } from "@/lib/errors";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

      let response: Response;
      try {
        response = await fetch(`${API_BASE}/api/v1/billing/create-checkout-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ plan_id: planId, user_id: userId }),
        });
      } catch {
        throw new Error(
          `Can't reach the DevLeap API at ${API_BASE}. Check that the backend is running, then try again.`
        );
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from backend.");
      }
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err, "Error initiating checkout. Is the backend running?"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={className || "btn btn-primary"}
    >
      {loading ? "Loading…" : label}
    </button>
  );
}
