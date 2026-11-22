"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { addUser } from "@/features/auth/authSlice";
import { useAuth } from "@/contexts/AuthContext";

const Auth = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Sync AuthContext user → Redux store whenever it changes
  useEffect(() => {
    if (user) {
      dispatch(addUser(user));
    }
  }, [user, dispatch]);

  // Gate: redirect to /login if not authenticated (except on /login itself)
  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLoading, user, pathname, router]);

  // Show nothing while hydrating from localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-belikan-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-belikan-primary text-white flex items-center justify-center text-xl font-serif font-bold animate-pulse shadow-belikan-card">

        </div>
      </div>
    );
  }

  // If not logged in and not on /login, show nothing (redirect happening)
  if (!user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
};

export default Auth;
