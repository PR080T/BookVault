import { Button } from 'flowbite-react';  // React library import
import { useEffect } from 'react'  // React library import
import { useNavigate, Link } from 'react-router-dom'  // React library import

import AuthService from '../services/auth.service';  // Service layer import for API communication
import AnimatedLayout from '../AnimatedLayout';

function Home() {
    let navigate = useNavigate();  // React Router hook for programmatic navigation
    useEffect(() => {  // React effect hook for side effects
        if(String(import.meta.env.VITE_DISABLE_HOMEPAGE).toLowerCase() === "true") {
            return navigate("/library")
        }
        if(AuthService.getCurrentUser()) {
            return navigate("/library")
        }
    }, [navigate])
    

    return (  // JSX return statement
        <AnimatedLayout>
        <div className="min-h-screen flex flex-col justify-between">
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative z-10 grid max-w-7xl px-6 mx-auto lg:gap-16 lg:py-20 lg:grid-cols-12 items-center">
                <div className="mr-auto place-self-center lg:col-span-7">
                    <div className="mb-10">
                        <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:bg-gradient-to-r dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                            📚 Your Personal Reading Companion
                        </span>
                    </div>
                    <h1 className="max-w-4xl mb-10 text-5xl font-bold tracking-tight leading-tight md:text-6xl xl:text-7xl gradient-text">
                        Transform Your Reading Journey with BookVault
                    </h1>
                    <p className="max-w-2xl mb-12 text-slate-600 dark:text-slate-300 lg:mb-16 md:text-xl lg:text-2xl leading-relaxed font-medium">
                        The most elegant way to organize your books, track reading progress, write personal reviews, and discover your next great read. 
                        <span className="gradient-text font-semibold">Your personal digital library awaits.</span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 mb-16">
                        <Button as={Link} to="/login" size="xl" className="btn-primary px-10 py-4 text-lg font-semibold">
                            Start Reading Journey
                        </Button>
                        <Button as={Link} to="/register" size="xl" className="btn-secondary px-10 py-4 text-lg font-semibold">
                            Create Free Account
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
                        <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800">
                            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                                <span className="text-white font-bold text-lg">✓</span>
                            </div>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">100% Free</span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Always free to use</span>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-blue-200 dark:border-blue-800">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                                <span className="text-white font-bold text-lg">🚫</span>
                            </div>
                            <span className="font-bold text-blue-700 dark:text-blue-300">Ad-Free</span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Clean experience</span>
                        </div>
                        <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                                <span className="text-white font-bold text-lg">🔒</span>
                            </div>
                            <span className="font-bold text-indigo-700 dark:text-indigo-300">Private</span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">Your data is yours</span>
                        </div>
                    </div>
                </div>
                <div className="mt-16 lg:mt-0 lg:col-span-5 hidden md:block">
                    <div className="relative">
                        <div className="glass-effect rounded-3xl p-8 elegant-shadow-lg">
                            <img src="/ReadingSideDoodle.svg" alt="Reading illustration" className="w-full max-w-lg mx-auto"/>
                        </div>
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-30 animate-pulse"></div>
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
                    </div>
                </div>
            </div>
        </section>
        </div>
        </AnimatedLayout>
    )
}

export default Home  // Export for use in other modules
