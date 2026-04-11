import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const dummyUser = {
    id: 1,
    email: "admin@eyeworld.local",
    name: "Eyeworld Admin",
    role: "Admin",
    accessStatus: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    openId: "bypassed-admin",
    passwordHash: null,
    avatarUrl: null,
    loginMethod: "local"
  };

  return {
    user: dummyUser,
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: async () => ({ data: dummyUser }),
    logout: async () => {},
  };
}
