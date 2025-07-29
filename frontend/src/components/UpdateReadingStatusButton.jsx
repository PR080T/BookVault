import { useState }  from 'react'  // React library import
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react'  // React library import
import BooksService from '../services/books.service';  // Service layer import for API communication
import useToast from '../toast/useToast';
import Confetti from 'react-confetti'  // React library import
import { RiMastodonFill } from "react-icons/ri";  // React library import
import { Link } from 'react-router-dom';  // React library import
import BookRating from './Library/BookRating';
import UpdateReadingStatusView from './UpdateReadingStatusView';

function UpdateReadingStatusButton(props) {
    const [openModal, setOpenModal] = useState(false);  // React state hook for component state management
    const [openFinishModal, setOpenFinishModal] = useState(false);  // React state hook for component state management

    const [updatedProgress, setUpdatedProgress] = useState(props.currentPage || 0);  // React state hook for component state management
    const [updateButtonDisabled, setUpdateButtonDisabled] = useState(false);  // React state hook for component state management

    const toast = useToast(4000);

    const updateProgress = () => {
        BooksService.edit(props.id, {current_page: updatedProgress}).then(
            response => {
                toast("success", response.data.message);
                setOpenModal(false);  // State update
                props.onSucess()
            }
        ).catch(error => {
            console.error('Error updating progress:', error);
            toast("error", error.response?.data?.message || "Failed to update reading progress");
        })
    }
    
    const setFinished = () => {
        BooksService.edit(props.id, {current_page: props.totalPages, status: "Read"}).then(
            response => {
                toast("success", response.data.message);
                setOpenModal(false);  // State update
                setOpenFinishModal(true);  // State update
            }
        ).catch(error => {
            console.error('Error setting book as finished:', error);
            toast("error", error.response?.data?.message || "Failed to mark book as finished");
        })
    }    

    return (  // JSX return statement
        <>
            {props.buttonStyle == "alternative" ? (
                <Button 
                    onClick={() => setOpenModal(true)}  // Event handler assignment
                    aria-label={`Update reading progress for ${props.title}`}
                >
                    Update progress
                </Button>
            ) :(
                <Button 
                    color="light" 
                    pill 
                    size="sm" 
                    onClick={() => setOpenModal(true)}  // Event handler assignment
                    aria-label={`Update reading progress for ${props.title}`}
                >
                    Update progress
                </Button>
            )}
            <Modal size="lg" show={openModal} onClose={() => setOpenModal(false)}>
            <ModalHeader className="border-gray-200">Update reading progress</ModalHeader>
                <ModalBody>
                    <UpdateReadingStatusView title={props.title} totalPages={props.totalPages} 
                        onNoProgressError={() => setUpdateButtonDisabled(false)}
                        onProgressLesserError={() => setUpdateButtonDisabled(true)}
                        onProgressGreaterError={() => setUpdateButtonDisabled(true)}
                        currentPage={updatedProgress}
                        setCurrentPage={setUpdatedProgress}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button onClick={() => updateProgress()} disabled={updateButtonDisabled}>Update</Button>  // Event handler assignment
                    <Button color="alternative" onClick={() => setOpenModal(false)}>Cancel</Button>  // Event handler assignment
                    <Button color="alternative" onClick={() => setFinished()}>Set as finished</Button>  // Event handler assignment
                </ModalFooter>
            </Modal>

            <Modal show={openFinishModal} onClose={() => (setOpenFinishModal(false), props.onSucess())} popup>
                <ModalHeader />
                <ModalBody>
                    <Confetti width={"640"} height={386} recycle={false} />
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                        <img src={"/medal.svg"} width={140} height={140}/>
                        <div className="format lg:format-lg dark:format-invert">
                            <h2>Congratulations!</h2>
                            <p>On finishing reading <strong>{props.title}</strong></p>
                            
                        </div>
                        <div className="flex flex-col items-center">
                            <p>Rate this book</p>
                            <BookRating size={"lg"} id={props.id} title={props.title} rating={props.rating} onSuccess={() => {}} />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="flex justify-center gap-4">
                    <Button as={Link} to={"https:  // mastodonshare.com/?text=I just finished reading " + props.title  + " 📖&url=https://book-vault-pi.vercel.app"}
                        <RiMastodonFill className="mr-2 h-5 w-5" />
                        Share on Mastodon
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    )
}

export default UpdateReadingStatusButton  // Export for use in other modules
