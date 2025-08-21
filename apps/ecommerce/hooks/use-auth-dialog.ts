import { create } from "zustand";
import type { AuthMode } from "@/components/auth/auth-dialog.types";

interface AuthDialogState {
  isOpen: boolean;
  mode: AuthMode;
  open: (mode?: AuthMode) => void;
  close: () => void;
  toggle: (mode?: AuthMode) => void;
  setMode: (mode: AuthMode) => void;
}

export const useAuthDialog = create<AuthDialogState>((set, get) => ({
  isOpen: false,
  mode: "signin",

  open: (mode = "signin") => {
    set({ isOpen: true, mode });
  },

  close: () => {
    set({ isOpen: false });
  },

  toggle: (mode = "signin") => {
    const { isOpen } = get();
    set({
      isOpen: !isOpen,
      mode: !isOpen ? mode : get().mode,
    });
  },

  setMode: (mode: AuthMode) => {
    set({ mode });
  },
}));
