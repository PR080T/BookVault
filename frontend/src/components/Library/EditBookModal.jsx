import { useState } from 'react'  // React library import
import { Modal, ModalHeader, ModalBody, ModalFooter, TextInput, Button, Popover, Label} from 'flowbite-react';  // React library import
import useToast from '../../toast/useToast';
import BooksService from '../../services/books.service';  // Service layer import for API communication
import { RiQuestionLine } from "react-icons/ri";  // React library import

function EditBookModal(props) {
    const [totalPages, setTotalPages] = useState(props.totalPages);  // React state hook for component state management
    const toast = useToast(4000);
    
    const handleEditBook = () => {
        BooksService.edit(props.id, {total_pages: parseInt(totalPages)}).then(
            response => {
                toast("success", response.data.message);
                props.close(false);
                props.onSuccess();
            },
            error => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();
                props.close(false);
                toast("error", resMessage);
            }
        )
    }

    const displayPopoverContent = (
        <div className="w-64 text-sm text-gray-500 dark:text-gray-400">
            <div className="border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Help</h3>
            </div>
            <div className="px-3 py-2">
                <p>The number of pages in the book you are reading.</p>
            </div>
        </div>
    )

    return (  // JSX return statement
        <>
            <Modal show={props.open} onClose={() => props.close(false)}>
                <ModalHeader className="border-gray-200">Edit book</ModalHeader>
                <ModalBody>                        
                    <div>
                        <div className="flex flex-row gap-2 items-center">
                            <Label htmlFor="editTotalPages">Total pages</Label>
                            <Popover trigger="hover" content={displayPopoverContent}>
                                <span><RiQuestionLine className="dark:text-white"/></span>
                            </Popover>
                        </div>
                        <TextInput id="editTotalPages" type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} />  // Event handler assignment
                    </div>
                </ModalBody>
                <ModalFooter>
                <Button onClick={() => handleEditBook()}>Save</Button>  // Event handler assignment
                <Button color="gray" onClick={() => props.close(false)}>  // Event handler assignment
                    Close
                </Button>
                </ModalFooter>
            </Modal>
        </>
    )
}

export default EditBookModal  // Export for use in other modules
