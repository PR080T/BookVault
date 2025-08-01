import { useEffect, useState } from 'react'  // React library import
import { Modal, ModalFooter, ModalBody, ModalHeader, Rating, RatingStar, Button, RangeSlider, TextInput, Tooltip } from 'flowbite-react'  // React library import
import useToast from '../../toast/useToast';
import BooksService from '../../services/books.service';  // Service layer import for API communication

/**
 * BookRating Component
 * 
 * A comprehensive rating component that allows users to view and set ratings for books.
 * Features:
 * - Visual star rating display (1-5 stars)
 * - Interactive rating modal with slider and number input
 * - Real-time validation (0-5 rating range)
 * - Toast notifications for success/error feedback
 * - Supports both display-only and interactive modes
 * 
 * Props:
 * @param {number} id - Book ID for API calls
 * @param {string} title - Book title for display
 * @param {number} rating - Current book rating (0-5)
 * @param {string} size - Star size ("sm", "md", "lg")
 * @param {boolean} disableGiveRating - If true, rating is display-only
 * @param {function} onSuccess - Callback function called after successful rating update
 */
function BookRating(props) {
  // State management for modal and rating input
    const [openModal, setOpenModal] = useState(false);  // React state hook for component state management
    const [rangeValue, setRangeValue] = useState(props.rating ? props.rating : 0);  // React state hook for component state management
    const [ratingErrorText, setRatingErrorText] = useState();  // React state hook for component state management
    const [saveButtonDisabled, setSaveButtonDisabled] = useState(false);  // React state hook for component state management

    const toast = useToast(4000);

    /**
     * Handles the book rating submission
     * Sends rating to backend API and provides user feedback
     */
    const handleRateBook = () => {
        BooksService.edit(props.id, {rating: rangeValue}).then(
            response => {
                toast("success", response.data.message);
                setOpenModal(false);  // State update
  // Call onSuccess callback if provided
                if (props.onSuccess) {
                    props.onSuccess();
                }
            },
            error => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();
                setOpenModal(false);  // State update
                toast("error", resMessage);
            }
        )
    }

    const handleOpenModal = () => {
        if(!props.disableGiveRating) {
            setOpenModal(true)  // State update
        }
    }

    useEffect(() => {  // React effect hook for side effects
        if (rangeValue > 5) {
            setRatingErrorText("Rating cannot be more than 5");  // State update
            setSaveButtonDisabled(true);  // State update
        } else if (rangeValue < 0) {
            setRatingErrorText("Rating cannot be less than 0.");  // State update
            setSaveButtonDisabled(true);  // State update
        } else {
            setRatingErrorText();  // State update
            setSaveButtonDisabled(false);  // State update
        }
      }, [rangeValue])

    const rating = () => {
        return (  // JSX return statement
            <Rating size={props.size} onClick={() => handleOpenModal()} className={`${!props.disableGiveRating ? "hover:bg-gray-100 hover:cursor-pointer":""} w-fit`}>  // Event handler assignment
                <RatingStar filled={Math.floor(props.rating) >= 1 ? true : false} />
                <RatingStar filled={Math.floor(props.rating) >= 2 ? true : false} />
                <RatingStar filled={Math.floor(props.rating) >= 3 ? true : false} />
                <RatingStar filled={Math.floor(props.rating) >= 4 ? true : false} />
                <RatingStar filled={Math.floor(props.rating) >= 5 ? true : false} />
                <p className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">{props.rating}</p>
            </Rating>
        )
    }

    return (  // JSX return statement
        <>
        {props.disableGiveRating ? (
            rating()
        ): (
            <Tooltip content={props.disableGiveRating ? undefined : "Give a rating"}>
                {rating()}
            </Tooltip>
        )}
        
        <Modal show={openModal} onClose={() => setOpenModal(false)}>
            <ModalHeader className="border-gray-200">Rate book</ModalHeader>
            <ModalBody>
                <p>How many stars would you like to give <strong>{props.title}</strong>?</p>
                <div className="flex flex-row items-center gap-4">
                    <div className="basis-10/12">
                        <RangeSlider min={0} max={5} step={0.5} value={rangeValue} onChange={(e) => setRangeValue(e.target.value)}/>  // Event handler assignment
                    </div>
                    <div className="basis-2/12">
                        <TextInput type="number" min={0} max={5} step={0.5} value={rangeValue} onChange={(e) => setRangeValue(e.target.value)} color={ratingErrorText ? 'failure' : 'gray'} />  // Event handler assignment
                        
                    </div>
                    
                </div>
                <span className="text-red-600 text-sm">
                            {ratingErrorText}
                        </span>
            </ModalBody>
            <ModalFooter>
            <Button onClick={() => handleRateBook()} disabled={saveButtonDisabled}>Save</Button>  // Event handler assignment
            <Button color="gray" onClick={() => setOpenModal(false)}>  // Event handler assignment
                Close
            </Button>
            </ModalFooter>
        </Modal>
        </>
    )
}

BookRating.defaultProps = {
    size: "sm",
    disableGiveRating: false,
}

export default BookRating  // Export for use in other modules
