import { Footer as FFooter, FooterIcon } from 'flowbite-react';
import { IoLogoGithub } from "react-icons/io";
import { DarkThemeToggle } from "flowbite-react";

function Footer() {
  return (
    <FFooter container className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-[100vh] z-10 border-t border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="w-full sm:flex sm:items-center sm:justify-between py-4">
        <div className="mt-4 flex space-x-8 sm:mt-0 sm:justify-center items-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">v{import.meta.env.VITE_APP_VERSION}</p>
            <FooterIcon 
              target="_blank" 
              href="https://github.com/Mozzo1000/booklogr" 
              icon={IoLogoGithub}
              className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
            />
        </div>
        <div className="elegant-shadow rounded-lg">
          <DarkThemeToggle />
        </div>
     </div>
    </FFooter>
  )
}

export default Footer