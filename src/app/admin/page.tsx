"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/admin",
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Admin</h1>
          <button
            onClick={signIn}
            className="px-6 py-3 bg-neutral-100 text-neutral-950 rounded-lg font-medium hover:bg-white transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">Admin</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-neutral-500">{user.email}</p>
            <button
              onClick={signOut}
              className="text-sm text-neutral-500 hover:text-neutral-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <p className="text-neutral-400">
          Welcome! You are signed in as {user.email}.
        </p>
        <p className="text-neutral-500 mt-4">
          Post management coming soon...
        </p>
      </div>
    </main>
  );
}