import { Alert } from "flowbite-react";  // React library import
import { useToastDispatchContext } from "./hooks";
import { IoMdInformationCircleOutline, IoMdCheckmarkCircleOutline } from "react-icons/io";  // React library import
import { MdErrorOutline } from "react-icons/md";  // React library import

export default function Toast({ type, message, id }) {  // Export for use in other modules
    const dispatch = useToastDispatchContext();
    
    const handleDismiss = () => {
        dispatch({ type: "DELETE_TOAST", id });
    };

    return (  // JSX return statement
        <div className="animate-slide-in-right">
            {type === "success" && (
                <Alert 
                    icon={IoMdCheckmarkCircleOutline} 
                    color="success" 
                    onDismiss={handleDismiss}
                    className="shadow-lg border-l-4 border-green-500"
                    role="alert"
                    aria-live="polite"
                >
                    <span className="font-medium">Success!</span> {message}
                </Alert>
            )}
            {type === "error" && (
                <Alert 
                    icon={MdErrorOutline} 
                    color="failure" 
                    onDismiss={handleDismiss}
                    className="shadow-lg border-l-4 border-red-500"
                    role="alert"
                    aria-live="assertive"
                >
                    <span className="font-medium">Error!</span> {message}
                </Alert>
            )}
            {type === "info" && (
                <Alert 
                    icon={IoMdInformationCircleOutline} 
                    color="info" 
                    onDismiss={handleDismiss}
                    className="shadow-lg border-l-4 border-blue-500"
                    role="alert"
                    aria-live="polite"
                >
                    <span className="font-medium">Info:</span> {message}
                </Alert>
            )}
        </div>
    );
}