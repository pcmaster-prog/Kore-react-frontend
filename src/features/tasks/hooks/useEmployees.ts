// src/features/tasks/hooks/useEmployees.ts
import { useQuery } from "@tanstack/react-query";
import { listEmployees } from "@/features/tasks/employeeApi";

const EMPLOYEES_KEY = ["employees"] as const;

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: listEmployees,
    staleTime: 5 * 60 * 1000,
  });
}
