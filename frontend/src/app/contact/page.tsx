"use client";

import { useRef, useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { submitContactMessage } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

type Status = "idle" | "submitting" | "sent" | "error";

export default function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollReveal(containerRef);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      await submitContactMessage({ firstName, lastName, email, message });
      setStatus("sent");
      setFirstName("");
      setLastName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err, "Couldn't send that. Try again in a moment."));
    }
  };

  return (
    <main ref={containerRef} className="w-full">
      <section className="max-w-4xl mx-auto px-6 md:px-8 pt-20 md:pt-28 pb-14 text-center">
        <p className="reveal-up eyebrow mb-5">( contact )</p>
        <h1 className="reveal-up font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-tight mb-5">
          Get in touch.
        </h1>
        <p className="reveal-up text-muted text-lg max-w-lg mx-auto">
          Questions about Enterprise licensing, custom LLM tuning, or a partnership? Send a note below.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 md:px-8 pb-20 md:pb-24">
        {status === "sent" ? (
          <div className="reveal-up panel p-8 md:p-10 text-center">
            <p className="badge badge-success mb-4 inline-flex">
              <span className="dot" />
              message sent
            </p>
            <h2 className="font-display text-2xl mb-2">Thanks — we've got it.</h2>
            <p className="text-text-dim text-sm">
              We reply within 24 hours. In the meantime feel free to send another note.
            </p>
            <button type="button" className="btn btn-secondary mt-6" onClick={() => setStatus("idle")}>
              Send another message
            </button>
          </div>
        ) : (
          <form className="reveal-up panel p-8 md:p-10 space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-muted" htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  type="text"
                  required
                  className="field"
                  placeholder="Ada"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  required
                  className="field"
                  placeholder="Lovelace"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                className="field"
                placeholder="ada@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted" htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={5}
                required
                className="field resize-none"
                placeholder="Tell us what you need."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {status === "error" && error && (
              <p className="text-sm text-red-400" role="alert">{error}</p>
            )}

            <button type="submit" disabled={status === "submitting"} className="btn btn-primary w-full">
              {status === "submitting" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </section>

      <section className="border-t border-[var(--line)]">
        <div className="max-w-3xl mx-auto px-6 md:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-10 text-center">
            {[
              { label: "Email", value: "hello@devleap.ai" },
              { label: "Location", value: "Remote-first, global" },
              { label: "Response time", value: "Within 24 hours" },
            ].map(({ label, value }) => (
              <div key={label} className="reveal-up">
                <p className="eyebrow mb-2">{label}</p>
                <p className="text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
