import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getAllWorkflowRequests,
  createWorkflowRequest,
  getWorkflowRequestById,
  updateWorkflowRequestStatus,
  getActivityLogsByRequestId,
  createActivityLog,
  getAllActiveUsers,
  getUserByEmail,
  getAllUsers,
  updateUserAccessStatus,
  updateUserRole,
  generateNextRequestId,
  upsertUser,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { ROLES, ACCESS_STATUSES, users } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { ONE_YEAR_MS } from "@shared/const";
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || user.accessStatus !== ACCESS_STATUSES.ACTIVE) {
          throw new Error("Invalid credentials or account inactive.");
        }
        if (!user.passwordHash) {
          throw new Error("Password not set for this account. Please register again.");
        }
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid credentials.");
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          fullName: z.string().min(1, "Name is required"),
          password: z.string().min(6, "Password must be at least 6 characters"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new Error("Email already registered.");
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        const openId = `local-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.insert(users).values({
          openId,
          email: input.email,
          name: input.fullName,
          passwordHash,
          role: ROLES.VIEWER,
          accessStatus: ACCESS_STATUSES.PENDING,
          loginMethod: "local",
        });

        await notifyOwner({
          title: `New Account Registered — ${input.fullName}`,
          content: `A new user registered an account.\n\nName: ${input.fullName}\nEmail: ${input.email}`,
        });

        return { success: true };
      }),
  }),

  // Workflow procedures
  workflow: router({
    // Get all workflow requests
    getAllRequests: publicProcedure.query(async () => {
      return await getAllWorkflowRequests();
    }),

    // Get a single request with activity logs
    getRequest: publicProcedure
      .input(z.object({ requestId: z.string() }))
      .query(async ({ input }) => {
        const request = await getWorkflowRequestById(input.requestId);
        if (!request) return null;
        
        const activities = await getActivityLogsByRequestId(input.requestId);
        return {
          ...request,
          activities,
        };
      }),

    // Create a new workflow request (Marketing or Admin only)
    createRequest: protectedProcedure
      .input(
        z.object({
          assigneeName: z.string(),
          assigneeEmail: z.string().email(),
          requestType: z.string(),
          mediaLink: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check if user is Marketing or Admin
        if (ctx.user?.role !== ROLES.MARKETING && ctx.user?.role !== ROLES.ADMIN) {
          throw new Error("Only Marketing and Admin users can create requests");
        }

        // Generate request ID
        const requestId = await generateNextRequestId();

        // Create the request
        await createWorkflowRequest({
          requestId,
          senderId: ctx.user!.id,
          senderName: ctx.user!.name || "",
          senderEmail: ctx.user!.email || "",
          assigneeName: input.assigneeName,
          assigneeEmail: input.assigneeEmail,
          requestType: input.requestType,
          mediaLink: input.mediaLink || null,
          notes: input.notes || null,
          status: "Pending Approval",
        });

        // Create initial activity log
        await createActivityLog({
          requestId,
          actorId: ctx.user!.id,
          actorName: ctx.user!.name || "",
          actorEmail: ctx.user!.email || "",
          action: "Created",
          note: "Request submitted.",
        });

        // Notify all active users
        const activeUsers = await getAllActiveUsers();
        if (activeUsers.length > 0) {
          await notifyOwner({
            title: `New Request — ${requestId} | ${input.requestType}`,
            content: `A new approval request has been created.\n\nRequest ID: ${requestId}\nType: ${input.requestType}\nFrom: ${ctx.user!.name}\nAssigned to: ${input.assigneeName}`,
          });
        }

        return { success: true, requestId };
      }),

    // Update request status (Admin only for Approved)
    updateStatus: protectedProcedure
      .input(
        z.object({
          requestId: z.string(),
          newStatus: z.enum([
            "Pending Approval",
            "Approved",
            "On Hold",
            "Revision Required",
            "Clarification Needed",
            "Ready to Publish",
          ]),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only Admins can approve
        if (input.newStatus === "Approved" && ctx.user?.role !== ROLES.ADMIN) {
          throw new Error("Only Admin users can approve requests");
        }

        // Update status
        await updateWorkflowRequestStatus(input.requestId, input.newStatus);

        // Create activity log
        await createActivityLog({
          requestId: input.requestId,
          actorId: ctx.user!.id,
          actorName: ctx.user!.name || "",
          actorEmail: ctx.user!.email || "",
          action: `Status changed to: ${input.newStatus}`,
          note: input.note || null,
        });

        // Notify all active users
        const activeUsers = await getAllActiveUsers();
        if (activeUsers.length > 0) {
          await notifyOwner({
            title: `Status Update — ${input.requestId} → ${input.newStatus}`,
            content: `A request status has been updated.\n\nRequest ID: ${input.requestId}\nNew Status: ${input.newStatus}\nUpdated by: ${ctx.user!.name}`,
          });
        }

        return { success: true };
      }),

    // Add comment (silent - no notification)
    addComment: protectedProcedure
      .input(
        z.object({
          requestId: z.string(),
          comment: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createActivityLog({
          requestId: input.requestId,
          actorId: ctx.user!.id,
          actorName: ctx.user!.name || "",
          actorEmail: ctx.user!.email || "",
          action: "Comment",
          note: input.comment,
        });

        return { success: true };
      }),

    // Send team update (notifies all active users)
    sendUpdate: protectedProcedure
      .input(
        z.object({
          requestId: z.string(),
          message: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createActivityLog({
          requestId: input.requestId,
          actorId: ctx.user!.id,
          actorName: ctx.user!.name || "",
          actorEmail: ctx.user!.email || "",
          action: "Team Update Sent",
          note: input.message,
        });

        // Notify all active users
        const activeUsers = await getAllActiveUsers();
        if (activeUsers.length > 0) {
          const request = await getWorkflowRequestById(input.requestId);
          await notifyOwner({
            title: `Update on ${input.requestId} — ${request?.requestType || "Request"}`,
            content: `${ctx.user!.name} sent a team update.\n\nRequest ID: ${input.requestId}\nMessage: ${input.message}`,
          });
        }

        return { success: true };
      }),

    // Request access (public) - creates pending user for admin activation
    requestAccess: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          fullName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // Check if user already exists
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new Error("This email already exists in the system");
        }

        // Create pending user record
        await upsertUser({
          openId: `pending-${input.email}-${Date.now()}`,
          email: input.email,
          name: input.fullName,
          role: ROLES.VIEWER,
          accessStatus: ACCESS_STATUSES.PENDING,
          loginMethod: "access_request",
        });

        // Notify owner about access request
        await notifyOwner({
          title: `New Access Request — ${input.fullName}`,
          content: `A new access request has been submitted.\n\nName: ${input.fullName}\nEmail: ${input.email}`,
        });

        return { success: true };
      }),
  }),

  // User management (Admin only)
  users: router({
    // Get all users
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== ROLES.ADMIN) {
        throw new Error("Only admins can view users");
      }
      return await getAllUsers();
    }),

    // Update user access status
    updateAccessStatus: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          status: z.enum([ACCESS_STATUSES.ACTIVE, ACCESS_STATUSES.PENDING, ACCESS_STATUSES.INACTIVE]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== ROLES.ADMIN) {
          throw new Error("Only admins can update user status");
        }
        await updateUserAccessStatus(input.userId, input.status);
        return { success: true };
      }),

    // Update user role
    updateRole: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum([ROLES.ADMIN, ROLES.MARKETING, ROLES.VIEWER]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== ROLES.ADMIN) {
          throw new Error("Only admins can update user roles");
        }
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
