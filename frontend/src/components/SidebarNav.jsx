import {useState} from 'react';
import SearchBar from './SearchBar'
import DarkModeToggle from './DarkModeToggle';
import { Sidebar, SidebarLogo, SidebarItem, SidebarItemGroup, SidebarItems, Modal, ModalBody, ModalHeader} from "flowbite-react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { RiBook2Line } from "react-icons/ri";
import { RiUser3Line } from "react-icons/ri";
import { RiLogoutBoxLine } from "react-icons/ri";
import { RiSideBarLine } from "react-icons/ri";
import { RiSideBarFill  } from "react-icons/ri";
import { RiSearch2Line } from "react-icons/ri";
import { RiLoginBoxLine } from "react-icons/ri";
import { RiSettings4Line } from "react-icons/ri";

const customTheme = {
  root: {
    inner: "h-full overflow-y-auto overflow-x-hidden bg-white/80 backdrop-blur-md dark:bg-slate-900/80 py-6 px-4 border-r border-slate-200 dark:border-slate-700 shadow-sm",
  },
  item: {
    base: "flex items-center justify-center rounded-xl p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 font-medium",
    active: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm",
    icon: {
      base: "h-5 w-5 flex-shrink-0 text-slate-600 dark:text-slate-400 transition duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
    }
  }
};

export default function SidebarNav() {
    const [sidebarState, setSidebarState] = useState(true);
    const [openSearchModal, setOpenSearchModal] = useState(false);
    let location = useLocation();
    let navigate = useNavigate();

    return (
        <>
        <Sidebar collapsed={sidebarState} theme={customTheme} className="hidden md:block">
          <SidebarLogo as={Link} href="/" img="/new-icon.svg" className="mr-3 h-16 sm:h-20" alt="BookVault Logo">
            <span className="self-center whitespace-nowrap text-2xl sm:text-3xl gradient-text font-bold">BookVault</span>
          </SidebarLogo>
            <SidebarItems>
                  <SidebarItemGroup>
                    {sidebarState ? (
                      <SidebarItem icon={RiSearch2Line} onClick={() => setOpenSearchModal(true)}>Search</SidebarItem>
                    ) :( 
                    <div className="flex items-center justify-center rounded-xl p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 font-medium">
                      <SearchBar hideESCIcon={true} showAttribution={false}></SearchBar>
                    </div>
                    )}
                  </SidebarItemGroup>
                  <SidebarItemGroup>
                    <SidebarItem as={Link} to="/library" active={location.pathname == "/library"} icon={RiBook2Line}>My Library</SidebarItem>
                    <SidebarItem as={Link} to="/profile" active={location.pathname == "/profile"} icon={RiUser3Line }>Profile</SidebarItem>

                    <SidebarItem as={Link} to="/settings" active={location.pathname == "/settings"} icon={RiSettings4Line}>Settings</SidebarItem>

                    {AuthService.getCurrentUser() ? ( 
                      <SidebarItem href="" onClick={() => (AuthService.logout(), navigate("/"))} icon={RiLogoutBoxLine}>Logout</SidebarItem>
                    ):(
                      <Link to="/login">
                        <SidebarItem href="" icon={RiLoginBoxLine}>Login</SidebarItem>
                      </Link>
                    )}
                </SidebarItemGroup>
                <SidebarItemGroup>
                  {!sidebarState && (
                    <div className="flex items-center justify-center rounded-xl p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 font-medium">
                      <div className="flex items-center justify-between w-full">
                        <span>Theme</span>
                        <DarkModeToggle size="md" />
                      </div>
                    </div>
                  )}
                  <SidebarItem icon={sidebarState ? RiSideBarFill : RiSideBarLine  } onClick={() => setSidebarState(!sidebarState)}>
                    {sidebarState ? (
                      <span>Expand</span>
                    ): (
                      <span>Collapse</span>
                    )}
                  </SidebarItem>
                  {sidebarState && (
                    <div className="flex items-center justify-center rounded-xl p-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 font-medium">
                      <DarkModeToggle size="md" className="mx-auto" />
                    </div>
                  )}
                </SidebarItemGroup>
            </SidebarItems>
        </Sidebar>

        {/* Mobile bottom navigation bar */}
        <nav className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-white/90 backdrop-blur-md border-t border-slate-200 dark:bg-slate-900/90 dark:border-slate-700 shadow-lg" role="navigation" aria-label="Mobile navigation">
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                <Link 
                    to="/library" 
                    className={`inline-flex flex-col pt-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 rounded-t-xl ${location.pathname == "/library" ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    aria-label="Go to Library"
                >
                    <div className="rounded-lg inline-flex flex-col items-center justify-center px-5 group">
                        <RiBook2Line className={`w-5 h-5 mb-2 ${location.pathname == "/library" ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}/>
                        <span className={`text-sm font-medium ${location.pathname == "/library" ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>Library</span>
                    </div>
                </Link>
                
                <button 
                    type="button" 
                    className="rounded-t-xl inline-flex flex-col items-center justify-center px-5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300" 
                    onClick={() => setOpenSearchModal(true)}
                    aria-label="Open search"
                >
                    <RiSearch2Line className="w-5 h-5 mb-2 text-slate-600 dark:text-slate-400"/>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Search</span>
                </button>

                <Link 
                    to="/profile" 
                    className={`inline-flex flex-col pt-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 rounded-t-xl ${location.pathname == "/profile" ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    aria-label="Go to Profile"
                >
                    <div className="inline-flex flex-col items-center justify-center px-5 group">
                        <RiUser3Line className={`w-5 h-5 mb-2 ${location.pathname == "/profile" ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}/>
                        <span className={`text-sm font-medium ${location.pathname == "/profile" ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>Profile</span>
                    </div>
                </Link>
                <Link 
                    to="/settings" 
                    className={`inline-flex flex-col pt-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 rounded-t-xl ${location.pathname == "/settings" ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    aria-label="Go to Settings"
                >
                    <div className="inline-flex flex-col items-center justify-center px-5 group">
                        <RiSettings4Line className={`w-5 h-5 mb-2 ${location.pathname == "/settings" ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}/>
                        <span className={`text-sm font-medium ${location.pathname == "/settings" ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>Settings</span>
                    </div>
                </Link>
                
                <div className="inline-flex flex-col pt-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300 rounded-t-xl">
                    <div className="inline-flex flex-col items-center justify-center px-5 group">
                        <div className="mb-2">
                            <DarkModeToggle size="md" />
                        </div>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Theme</span>
                    </div>
                </div>
            </div>
        </nav>
        
        {/* Modal for search */}
        <Modal dismissible show={openSearchModal} onClose={() => setOpenSearchModal(false)} position={"top-center"}>
            <ModalBody>
                <ModalHeader className='md:hidden border-b-0 pb-1 pt-0'></ModalHeader>  
                <SearchBar absolute={false} hideESCIcon={false} onNavigate={() =>setOpenSearchModal(false)}/>
            </ModalBody>
        </Modal>
        </>
    )
}