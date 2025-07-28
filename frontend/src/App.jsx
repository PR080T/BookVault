import React from "react";  // React library import
import { Routes, Route, Navigate, useLocation, useNavigate} from "react-router-dom";  // React library import
import BookDetails from "./pages/BookDetails";  // Page component import
import Library from "./pages/Library";  // Page component import
import Home from "./pages/Home";  // Page component import

import ToastContainer from "./toast/Container";
import NavigationMenu from "./components/Navbar"  // Reusable UI component import
import Login from "./pages/Login";  // Page component import
import Profile from "./pages/Profile";  // Page component import
import Footer from "./components/Footer";  // Reusable UI component import
import Register from "./pages/Register";  // Page component import
import AuthService from "./services/auth.service";  // Service layer import for API communication
import SidebarNav from "./components/SidebarNav";  // Reusable UI component import
import Verify from "./pages/Verify";  // Page component import
import Settings from "./pages/Settings";  // Page component import
import ErrorBoundary from "./components/ErrorBoundary";  // Reusable UI component import
import ConnectionStatus from "./components/ConnectionStatus";  // Reusable UI component import
import globalRouter from "./GlobalRouter";  // React Router for navigation
import { AnimatePresence } from "framer-motion";
import { StatsProvider } from "./contexts/StatsContext";

function PrivateRoute({ children }) {
  const auth = AuthService.getCurrentUser()
  return auth ? children : <Navigate to="/login" />;
}

function App() {
  const navigate = useNavigate();  // React Router hook for programmatic navigation
  globalRouter.navigate = navigate;

  let location = useLocation();  // React Router hook for current location

  // Keyboard shortcuts
  React.useEffect(() => {  // React effect hook for side effects
    const handleKeyDown = (event) => {
  // Ctrl/Cmd + K for quick search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (AuthService.getCurrentUser()) {
  // Trigger search modal or navigate to search
          const searchButton = document.querySelector('[aria-label="Open search"]');
          if (searchButton) {
            searchButton.click();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);  // JSX return statement
  }, []);

  return (  // JSX return statement
    <ErrorBoundary>
      <StatsProvider>
        <div className="min-h-screen">
          <div className="flex flex-row">
            {AuthService.getCurrentUser() &&
              <SidebarNav />
            }
            <div className="container mx-auto p-4 sm:p-8 md:p-16">

              {!AuthService.getCurrentUser() &&
                location.pathname != "/library"  &&
                  <NavigationMenu />
              
              }
              <AnimatePresence mode='wait'>
                <Routes location={location} key={location.pathname}>
                  <Route path="/">
                    <Route index element={<Home/>} />
              
                    <Route path="library" element={<PrivateRoute><Library /></PrivateRoute>} />
                    <Route path="books/:id" element={<BookDetails />} />
                    <Route exact path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="profile/:name" element={<Profile />} />
                    <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="verify" element={<Verify />} />

                  </Route>
                </Routes>
              </AnimatePresence>
            </div>
          </div>
          <Footer />
          <ToastContainer />
          <ConnectionStatus />
        </div>
      </StatsProvider>
    </ErrorBoundary>
  )
}

export default App  // Export for use in other modules
