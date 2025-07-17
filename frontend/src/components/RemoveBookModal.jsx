import { Modal, ModalBody, ModalHeader, Button } from 'flowbite-react'
import BooksService from '../services/books.service';
import { RiErrorWarningLine } from "react-icons/ri";
import useToast from '../toast/useToast';
import { useStats } from '../contexts/StatsContext';

function RemoveBookModal(props) {
    const toast = useToast(4000);
    const { refreshStats } = useStats();

    const removeBook = () => {
        BooksService.remove(props.id).then(
            response => {
                toast("success", response.data.message);
                refreshStats(); // Refresh stats after removing book
                props.onSuccess();
            },
            error => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();
                toast("error", resMessage);
            }
        )
        props.close(false);
    }

    return (
        <div>
            <Modal show={props.open} size="md" onClose={() => props.close(false)} popup>
            <ModalHeader />
                <ModalBody>
                <div className="text-center">
                    <RiErrorWarningLine className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        Are you sure you want to remove this book?
                    </h3>
                    <div className="flex justify-center gap-4">
                    <Button color="red" onClick={() => removeBook()}>
                        {"Yes, I'm sure"}
                    </Button>
                    <Button color="alternative" onClick={() => props.close(false)}>
                        {"No, cancel"}
                    </Button>
                    </div>
                </div>
                </ModalBody>
            </Modal>
        </div>
    )
}

export default RemoveBookModal