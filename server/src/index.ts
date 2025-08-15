import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import all schemas
import {
  trackDocumentInputSchema,
  adminLoginInputSchema,
  changePasswordInputSchema,
  searchMailsInputSchema,
  createIncomingMailInputSchema,
  updateIncomingMailInputSchema,
  deleteMailInputSchema
} from './schema';

// Import all handlers
import { trackDocument } from './handlers/track_document';
import { adminLogin } from './handlers/admin_login';
import { changePassword } from './handlers/change_password';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { getRecentMails } from './handlers/get_recent_mails';
import { getAllMails } from './handlers/get_all_mails';
import { searchMails } from './handlers/search_mails';
import { createIncomingMail } from './handlers/create_incoming_mail';
import { updateIncomingMail } from './handlers/update_incoming_mail';
import { deleteMail } from './handlers/delete_mail';
import { getMailById } from './handlers/get_mail_by_id';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Public document tracking
  trackDocument: publicProcedure
    .input(trackDocumentInputSchema)
    .query(({ input }) => trackDocument(input)),

  // Admin authentication
  adminLogin: publicProcedure
    .input(adminLoginInputSchema)
    .mutation(({ input }) => adminLogin(input)),

  // Admin password management
  changePassword: publicProcedure
    .input(changePasswordInputSchema.extend({
      adminId: z.number() // In real implementation, this would come from auth context
    }))
    .mutation(({ input }) => changePassword(input.adminId, {
      current_password: input.current_password,
      new_password: input.new_password
    })),

  // Dashboard queries
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),

  getRecentMails: publicProcedure
    .input(z.object({ limit: z.number().int().positive().optional() }).optional())
    .query(({ input }) => getRecentMails(input?.limit)),

  // Mail management queries
  getAllMails: publicProcedure
    .query(() => getAllMails()),

  searchMails: publicProcedure
    .input(searchMailsInputSchema)
    .query(({ input }) => searchMails(input)),

  getMailById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMailById(input.id)),

  // Mail management mutations
  createIncomingMail: publicProcedure
    .input(createIncomingMailInputSchema)
    .mutation(({ input }) => createIncomingMail(input)),

  updateIncomingMail: publicProcedure
    .input(updateIncomingMailInputSchema)
    .mutation(({ input }) => updateIncomingMail(input)),

  deleteMail: publicProcedure
    .input(deleteMailInputSchema)
    .mutation(({ input }) => deleteMail(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`E-MOT TRPC server listening at port: ${port}`);
}

start();