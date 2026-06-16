import { useQuery } from "@tanstack/react-query";
import { getDashboardMaderas } from "../api";

export function useDashboardMaderas() {
  return useQuery({
    queryKey: ["maderas-dashboard"],
    queryFn: getDashboardMaderas,
  });
}
