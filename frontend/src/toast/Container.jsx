import Toast from "./Toast";
import { useToastStateContext } from "./hooks";

export default function ToastContainer() {  // Export for use in other modules
    const { toasts } = useToastStateContext();

    return (  // JSX return statement
        <div className="absolute bottom-10 ml-5 z-50">
            <div className="">
                {toasts &&
                    toasts.map((toast) => <Toast id={toast.id} key={toast.id} type={toast.type} message={toast.message} />)}
            </div>
        </div>
    );
}