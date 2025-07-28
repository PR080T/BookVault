import { createContext } from "react";  // React library import

export const ToastStateContext = createContext({ toasts: [] });  // Export for use in other modules
export const ToastDispatchContext = createContext(null);  // Export for use in other modules
