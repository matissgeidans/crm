import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user && user.id !== undefined,
    isAdmin: user?.role === "admin",
    isDriver: user?.role === "driver",
  };
}
