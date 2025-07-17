import { useContext } from 'react';
import { ToastStateContext, ToastDispatchContext } from './contexts.js';

export const useToastStateContext = () => useContext(ToastStateContext);
export const useToastDispatchContext = () => useContext(ToastDispatchContext);