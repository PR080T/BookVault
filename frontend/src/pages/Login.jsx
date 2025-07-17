import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { Button, Label, TextInput, Card } from 'flowbite-react';
import { RiMailLine } from "react-icons/ri";
import { RiLockPasswordLine } from "react-icons/ri";
import useToast from '../toast/useToast';
import AnimatedLayout from '../AnimatedLayout';


function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    let navigate = useNavigate();
    const toast = useToast(8000);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            await AuthService.login(username, password);
            toast("success", "Login successful");
            navigate("/");
        } catch (error) {
            const resMessage =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            
            // Show more user-friendly error messages
            if (resMessage.includes("Network error") || resMessage.includes("Unable to connect")) {
                toast("error", "Cannot connect to server. Please check your internet connection and try again.");
            } else if (resMessage.includes("timeout")) {
                toast("error", "Request timed out. Please try again.");
            } else {
                toast("error", resMessage);
            }
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <AnimatedLayout>
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-lg space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="mb-6">
              <img src="/new-icon.svg" className="h-16 w-16 mx-auto mb-4" alt="BookVault Logo" />
            </div>
            <h2 className="text-4xl font-bold gradient-text mb-3">Welcome back</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">Sign in to your BookVault account</p>
          </div>

          {/* Demo Mode Notice */}
          {String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === "true" && ( 
            <div className="glass-effect rounded-2xl p-6 text-center elegant-shadow border border-blue-200/50 dark:border-blue-800/50">
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">This is a demo of BookVault</p>
              <p className="text-blue-600 dark:text-blue-400 mb-4">Some features are <a className="font-semibold underline hover:no-underline" href="https://github.com/Mozzo1000/booklogr/blob/main/demo/README.md">disabled.</a></p>
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-2">Demo Credentials:</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Email: demo@bookvault.app</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Password: demo</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <Card className="glass-effect elegant-shadow-lg border-0 rounded-2xl">
            <form className="space-y-8 p-8" onSubmit={handleLogin}>
              <div>
                <div className="mb-3 block">
                  <Label htmlFor="email1" className="text-base font-semibold text-slate-700 dark:text-slate-200">Email address</Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <RiMailLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <TextInput 
                    id="email1" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10"
                    sizing="lg"
                  />
                </div>
              </div>
              <div>
                <div className="mb-3 block">
                  <Label htmlFor="password1" className="text-base font-semibold text-slate-700 dark:text-slate-200">Password</Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <RiLockPasswordLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <TextInput 
                    id="password1" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10"
                    sizing="lg"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full btn-primary" 
                  size="xl"
                  disabled={isLoading}
                  isProcessing={isLoading}
                  processingLabel="Signing in..."
                >
                  {isLoading ? "Signing in..." : "Sign in to BookVault"}
                </Button>
                <Button 
                  as={Link} 
                  to="/register" 
                  className="w-full btn-secondary"
                  size="lg"
                >
                  Create new account
                </Button>
              </div>
            </form>
          </Card>


        </div>
      </div>
    </AnimatedLayout>
  )
}

export default Login