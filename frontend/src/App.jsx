import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Nutrition from './pages/Nutrition';
import MentalHealth from './pages/MentalHealth';
import Gamification from './pages/Gamification';
import Recommendation from './pages/Recommendation';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Notification from './components/Notification';
import { UserProvider, UserContext } from "./components/UserContext";
import PrivateRoute from './components/PrivateRoute';
import AuthCallback from './pages/AuthCallback';
import './App.css';

const App = () => {
  return (
    <UserProvider>
      <Router>
        <AppWithLayout />
      </Router>
    </UserProvider>
  );
};

const AppWithLayout = () => {
  const location = useLocation();
  const { user } = React.useContext(UserContext);

  const hideNavbarFooterRoutes = ['/', '/login', '/register', '/auth/callback', '/auth/fitbit/callback'];
  const shouldShowNavbarFooter = !hideNavbarFooterRoutes.includes(location.pathname) && user;

  return (
    <div className="app-container">
      {shouldShowNavbarFooter && <Navbar />}
      {user && <Notification />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/fitbit/callback" element={<AuthCallback />} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/mentalhealth" element={<MentalHealth />} />
            <Route path="/gamification" element={<Gamification />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </main>
      {shouldShowNavbarFooter && <Footer />}
    </div>
  );
};

export default App;