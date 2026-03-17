"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirects first-time visitors (no journey profile) to /journey
export default function JourneyRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const profile = localStorage.getItem("valura_profile");
      const journeyProfile = localStorage.getItem("valura_journey_profile");
      // Only redirect if neither a user profile nor a journey profile exists
      if (!profile && !journeyProfile) {
        router.replace("/journey");
      }
    } catch {
      // localStorage not available — don't redirect
    }
  }, [router]);

  return null;
}
