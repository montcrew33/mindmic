"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`
      }
    });

    setStatus(error ? error.message : "Check your email for the sign-in link.");
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <label className="field">
        <span>Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@example.com"
        />
      </label>
      <button className="button" type="submit">
        <Mail size={18} aria-hidden="true" />
        Send magic link
      </button>
      {status ? <p className="muted">{status}</p> : null}
    </form>
  );
}
