import { Navbar, NavbarBrand, NavbarToggle, NavbarCollapse, NavbarLink } from 'flowbite-react'  // React library import
import { Link, useLocation } from 'react-router-dom';  // React library import
import DarkModeToggle from './DarkModeToggle';

const customThemeNav = {
  root: {
    base: "bg-white/80 backdrop-blur-md dark:bg-slate-900/80 px-4 py-4 border-b border-slate-200 dark:border-slate-700 shadow-sm sm:px-6",
  },
  brand: {
    base: "flex items-center space-x-3 flex-shrink-0"
  },
  toggle: {
    base: "inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 md:hidden"
  },
  link: {
    base: "block py-2 pr-4 pl-3 md:p-0 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium",
    active: {
      on: "bg-blue-600 text-white dark:text-white md:bg-transparent md:text-blue-600 dark:md:text-blue-400 font-semibold rounded-lg md:rounded-none"
    }
  }
};

function NavigationMenu() {
    let location = useLocation();  // React Router hook for current location

    return (  // JSX return statement
        <>
          <div className="pb-10">
          <Navbar theme={customThemeNav}>
            <NavbarBrand as={Link} to="/" className="brand-logo flex items-center space-x-3">
              <img src="/new-icon.svg" className="h-12 sm:h-14 md:h-16 drop-shadow-lg flex-shrink-0" alt="BookVault Logo" />
              <span className="self-center whitespace-nowrap text-xl sm:text-2xl md:text-3xl font-bold gradient-text tracking-tight">BookVault</span>
            </NavbarBrand>
            <div className="flex items-center gap-3">
              <DarkModeToggle size="md" />
              <NavbarToggle />
            </div>
            <NavbarCollapse>
              {import.meta.env.VITE_DISABLE_HOMEPAGE === "false" &&
                <NavbarLink as={Link} to="/" active={location.pathname == "/"}>
                  Home
                </NavbarLink>
              }
              <NavbarLink as={Link} to="/login" active={location.pathname == "/login"}>
                Login
              </NavbarLink>
              <NavbarLink as={Link} to="/register" active={location.pathname == "/register"}>
                Register
              </NavbarLink>
            </NavbarCollapse>
          </Navbar>
          </div>
        </>
    )
}

export default NavigationMenu  // Export for use in other modules
