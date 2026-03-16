"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_PROFILE,
  ValuraProfile,
  getProfile,
  profileExists,
  saveProfile as persistProfile,
} from "@/lib/user-profile";

interface ProfileContextValue {
  profile: ValuraProfile;
  updateProfile: (updates: Partial<ValuraProfile>) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  showPanel: boolean;
  setShowPanel: (v: boolean) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  showModal: false,
  setShowModal: () => {},
  showPanel: false,
  setShowPanel: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ValuraProfile>(DEFAULT_PROFILE);
  const [showModal, setShowModal] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProfile(getProfile());
    if (!profileExists()) {
      // Small delay so the page settles before the modal appears
      const t = setTimeout(() => setShowModal(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const updateProfile = useCallback((updates: Partial<ValuraProfile>) => {
    persistProfile(updates);
    setProfile(getProfile());
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch: render children with default context until mounted
    return (
      <ProfileContext.Provider
        value={{ profile, updateProfile, showModal: false, setShowModal, showPanel: false, setShowPanel }}
      >
        {children}
      </ProfileContext.Provider>
    );
  }

  return (
    <ProfileContext.Provider
      value={{ profile, updateProfile, showModal, setShowModal, showPanel, setShowPanel }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
