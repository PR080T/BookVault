import { createContext } from "react";

export const ToastStateContext = createContext({ toasts: [] });
export const ToastDispatchContext = createContext(null);