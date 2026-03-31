import api from "@/lib/http";
import type { SupervisorDashData } from "./types";

export async function getSupervisorDashboard() {
  const res = await api.get('/dashboard/supervisor');
  return res.data?.data as SupervisorDashData;
}
