import { useReducer } from "react";  // React library import
import { ToastStateContext, ToastDispatchContext } from "./contexts.js";

function ToastReducer(state, action) {
    switch (action.type) {
        case "ADD_TOAST": {
            return {
                ...state,
                toasts: [...state.toasts, action.toast],
            };
        }
        case "DELETE_TOAST": {
            const updatedToasts = state.toasts.filter((e) => e.id != action.id);
            return {
                ...state,
                toasts: updatedToasts,
            };
        }
        default: {
            throw new Error("unhandled action");
        }
    }
}

export function ToastProvider({ children }) {  // Export for use in other modules
    const [state, dispatch] = useReducer(ToastReducer, {
        toasts: [],
    });

    return (  // JSX return statement
        <ToastStateContext.Provider value={state}>
            <ToastDispatchContext.Provider value={dispatch}>{children}</ToastDispatchContext.Provider>
        </ToastStateContext.Provider>
    );
}

