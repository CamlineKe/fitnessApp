import React, { useContext, useEffect } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { UserContext } from "./UserContext";

const PrivateRoute = () => {
  const { user, loading, isAuthenticated, fetchUser } = useContext(UserContext);
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      fetchUser(); // Fetch profile only if not authenticated and not loading
    }
  }, [isAuthenticated, loading, fetchUser]);

  if (loading) {
    return <div style={{ marginTop: "64px" }}>Loading user data...</div>; // Prevents redirect until loading is done
  }

  if (!isAuthenticated) {
    // Redirect to home page (/) instead of /login when not authenticated
    return <Navigate to="/" state={{ from: location }} replace />; 
  }

  return <Outlet />; // Grants access if authenticated
};

export default PrivateRoute;
