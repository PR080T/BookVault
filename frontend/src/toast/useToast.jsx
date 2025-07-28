import { useToastDispatchContext } from "./hooks";

export function useToast(delay) {  // Export for use in other modules
    const dispatch = useToastDispatchContext();

    function toast(type, message) {
        const id = Math.random().toString(36).substr(2, 9);
        dispatch({
            type: "ADD_TOAST",
            toast: {
                type,
                message,
                id,
            },
        });

        setTimeout(() => {  // State update
            dispatch({ type: "DELETE_TOAST", id });
        }, delay);
    }

    return toast;
}

export default useToast;  // Export for use in other modules
