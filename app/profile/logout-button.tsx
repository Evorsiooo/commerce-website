"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/ui/button";
export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to log out", response.status, response.statusText);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Failed to log out", error);
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
