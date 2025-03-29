import React, { useContext, useEffect } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { UserContext } from "./UserContext";

const PrivateRoute = () => {
  const { user, loading, fetchUser } = useContext(UserContext);
  const location = useLocation();

  useEffect(() => {
    if (!user && localStorage.getItem("token")) {
      fetchUser(); // Fetch profile only if user is missing but token exists
    }
  }, [user, fetchUser]);

  if (loading) {
    return <div style={{ marginTop: "64px" }}>Loading user data...</div>; // Prevents redirect until loading is done
  }

  if (!user) {
    // Redirect to home page (/) instead of /login when not authenticated
    return <Navigate to="/" state={{ from: location }} replace />; 
  }

  return <Outlet />; // Grants access if authenticated
};

export default PrivateRoute;
