import { useState, useEffect } from 'react'  // React library import
import { Link, useNavigate } from 'react-router-dom';  // React library import
import AuthService from '../services/auth.service';  // Service layer import for API communication
import { Button, Label, TextInput, Card } from 'flowbite-react';  // React library import
import { RiMailLine } from "react-icons/ri";  // React library import
import { RiLockPasswordLine } from "react-icons/ri";  // React library import
import { RiUser3Line } from "react-icons/ri";  // React library import
import useToast from '../toast/useToast';
import AnimatedLayout from '../AnimatedLayout';

function Register() {
    const [email, setEmail] = useState("");  // React state hook for component state management
    const [name, setName] = useState("");  // React state hook for component state management
    const [password, setPassword] = useState("");  // React state hook for component state management
    const [passwordConf, setPasswordConf] = useState("");  // React state hook for component state management
    const [passwordErrorText, setPasswordErrorText] = useState();  // React state hook for component state management
    const [registerButtonDisabled, setRegisterButtonDisabled] = useState(true);  // React state hook for component state management

    let navigate = useNavigate();  // React Router hook for programmatic navigation
    const toast = useToast(8000);

    const handleRegistration = (e) => {
        e.preventDefault();
        AuthService.register(email, name, password).then(
            response => {
              toast("success", response.data.message)
              navigate("/verify", {state: {"email": email}})
            },
            error => {
              const resMessage =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
              toast("error", resMessage);
            }
        )
    }

    const validatePassword = (pwd) => {
        if (pwd.length < 8) {
            return "Password must be at least 8 characters long";
        }
        if (!/[A-Z]/.test(pwd)) {
            return "Password must contain at least one uppercase letter";
        }
        if (!/[a-z]/.test(pwd)) {
            return "Password must contain at least one lowercase letter";
        }
        if (!/\d/.test(pwd)) {
            return "Password must contain at least one number";
        }
        return null;
    };

    useEffect(() => {  // React effect hook for side effects
        let errorText = "";
        
        if (password) {
            const passwordValidation = validatePassword(password);
            if (passwordValidation) {
                errorText = passwordValidation;
            }
        }
        
        if (passwordConf && password && passwordConf !== password) {
            errorText = "Passwords do not match";
        }
        
        setPasswordErrorText(errorText);  // State update
        setRegisterButtonDisabled(!!errorText || !password || !passwordConf || !email || !name);  // State update
    }, [password, passwordConf, email, name])




  return (  // JSX return statement
    <AnimatedLayout>
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-lg space-y-10">
          {/* Header */}
          <div className="text-center">
            <div className="mb-6">
              <img src="/new-icon.svg" className="h-16 w-16 mx-auto mb-4" alt="BookVault Logo" />
            </div>
            <h2 className="text-4xl font-bold gradient-text mb-3">Create your account</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">Join BookVault and start tracking your reading journey</p>
          </div>

          {/* Registration Form */}
          <Card className="glass-effect elegant-shadow-lg border-0 rounded-2xl">
            <form className="space-y-8 p-8" onSubmit={handleRegistration}>  // Event handler assignment
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="email1" className="text-sm font-medium text-gray-900 dark:text-white">Email address</Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <RiMailLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <TextInput 
                    id="email1" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}  // Event handler assignment
                    className="w-full pl-10"
                  />
                </div>
              </div>
              
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-white">Full name</Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <RiUser3Line className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <TextInput 
                    id="name" 
                    type="text" 
                    placeholder="John Doe"
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)}  // Event handler assignment
                    className="w-full pl-10"
                  />
                </div>
              </div>
              
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="password1" className="text-sm font-medium text-gray-900 dark:text-white">Password</Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <RiLockPasswordLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <TextInput 
                    id="password1" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}  // Event handler assignment
                    className="w-full pl-10"
                  />
                </div>
                {password && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>One uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>One lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>One number</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="password2" className="text-sm font-medium text-gray-900 dark:text-white">Confirm password</Label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <RiLockPasswordLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <TextInput 
                    id="password2" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    value={passwordConf} 
                    onChange={e => setPasswordConf(e.target.value)}  // Event handler assignment
                    color={passwordErrorText ? 'failure' : 'gray'} 
                    helperText={passwordErrorText}
                    className="w-full pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  disabled={registerButtonDisabled} 
                  className="w-full"
                  size="lg"
                >
                  Create account
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AnimatedLayout>
  )
}

export default Register  // Export for use in other modules
