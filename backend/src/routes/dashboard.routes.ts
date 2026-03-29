import { Hono } from "hono";
import { requireUser } from "@/auth/requireUser";
import { ok, unauthorized } from "@/http/response";
import { getDashboardSummary } from "@/services/clientActionQueryService";

const dashboardRoutes = new Hono();

dashboardRoutes.get("/summary", async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);

  const summary = await getDashboardSummary(user.sub);
  return ok(c, summary);
});

export default dashboardRoutes;
