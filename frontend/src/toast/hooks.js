import { useContext } from 'react';  // React library import
import { ToastStateContext, ToastDispatchContext } from './contexts.js';

export const useToastStateContext = () => useContext(ToastStateContext);  // Export for use in other modules
export const useToastDispatchContext = () => useContext(ToastDispatchContext);  // Export for use in other modules
