import { Button, Label, TextInput, Card } from 'flowbite-react'  // React library import
import { useState, useEffect } from 'react'  // React library import
import { useNavigate, useLocation} from 'react-router-dom';  // React library import
import AuthService from "../services/auth.service";  // Service layer import for API communication
import useToast from '../toast/useToast';
import AnimatedLayout from '../AnimatedLayout';

function Verify() {
    const [code, setCode] = useState();  // React state hook for component state management
    const [email, setEmail] = useState();  // React state hook for component state management

    let navigate = useNavigate();  // React Router hook for programmatic navigation
    let location = useLocation();  // React Router hook for current location
    const toast = useToast(4000);

    useEffect(() => {  // React effect hook for side effects
        setEmail(location.state.email);  // State update
    }, [location.state])
    

    const handleVerify = (e) => {
        e.preventDefault();
        AuthService.verify(email, code).then(
            response => {
                toast("success", response.data.message + ". Please login!")
                navigate("/login")
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

    const maskEmail = (address) => {
        const regex = /(^.|@[^@](?=[^@]*$)|\.[^.]+$)|./g;
        return address.replace(regex, (x, y) => y || '*')
    }; 

    return (  // JSX return statement
        <AnimatedLayout>
            <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <div className="w-full max-w-lg space-y-10">
                    {/* Header */}
                    <div className="text-center">
                        <div className="mb-6">
                            <img src="/new-icon.svg" className="h-16 w-16 mx-auto mb-4" alt="BookVault Logo" />
                        </div>
                        <h2 className="text-4xl font-bold gradient-text mb-3">Verify your account</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            {email ? 
                                <>A verification code has been sent to <span className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{maskEmail(email)}</span></> :
                                "Enter your email and verification code to activate your account"
                            }
                        </p>
                    </div>

                    {/* Verification Form */}
                    <Card className="glass-effect elegant-shadow-lg border-0 rounded-2xl">
                        <form className="space-y-8 p-8" onSubmit={handleVerify}>  // Event handler assignment
                            {!email && (
                                <div>
                                    <div className="mb-3 block">
                                        <Label htmlFor="email1" className="text-base font-semibold text-slate-700 dark:text-slate-200">Email address</Label>
                                    </div>
                                    <TextInput 
                                        id="email1" 
                                        type="email" 
                                        placeholder="name@example.com" 
                                        required 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)}  // Event handler assignment
                                        className="w-full"
                                        sizing="lg"
                                    />
                                </div>
                            )}
                            
                            <div>
                                <div className="mb-3 block">
                                    <Label htmlFor="code1" className="text-base font-semibold text-slate-700 dark:text-slate-200">Verification code</Label>
                                </div>
                                <TextInput 
                                    minLength="8" 
                                    maxLength="8" 
                                    id="code1" 
                                    type="text" 
                                    placeholder="ABCD1234" 
                                    required 
                                    value={code} 
                                    onChange={e => setCode(e.target.value)}  // Event handler assignment
                                    className="w-full font-mono text-center text-lg tracking-widest"
                                    sizing="lg"
                                />
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Enter the 8-character verification code from your email
                                </p>
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full btn-primary" 
                                size="xl"
                            >
                                Verify Account
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </AnimatedLayout>
    )
}

export default Verify  // Export for use in other modules
