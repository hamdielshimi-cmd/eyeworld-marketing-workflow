import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Authentication completely bypassed. Anyone with the URL has full Admin access.
  const user: User = {
    id: 1,
    email: "admin@eyeworld.local",
    name: "Eyeworld Admin",
    role: "Admin",
    accessStatus: "Active",
    createdAt: new Date(),
    updatedAt: new Date(),
    openId: "bypassed-admin",
    passwordHash: null,
    avatarUrl: null,
    loginMethod: "local"
  };

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
