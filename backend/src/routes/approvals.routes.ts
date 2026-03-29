import { Hono } from "hono";
import { requireUser } from "@/auth/requireUser";
import { ok, unauthorized } from "@/http/response";
import { listApprovalRequests } from "@/services/clientActionQueryService";

const approvalsRoutes = new Hono();

approvalsRoutes.get("/", async (c) => {
  const user = requireUser(c);
  if (!user) return unauthorized(c);

  const approvals = await listApprovalRequests(user.sub);
  return ok(c, approvals);
});

export default approvalsRoutes;
