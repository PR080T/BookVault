import { Spinner } from "flowbite-react";  // React library import

function LoadingSpinner({ size = "md", text = "Loading...", fullScreen = false }) {

    const content = (
        <div className="flex flex-col items-center justify-center gap-4">
            <Spinner size={size} />
            {text && (
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (  // JSX return statement
            <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                {content}
            </div>
        );
    }

    return (  // JSX return statement
        <div className="flex items-center justify-center p-8">
            {content}
        </div>
    );
}

export default LoadingSpinner;  // Export for use in other modules
