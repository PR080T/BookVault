import { useState, useEffect, useCallback } from 'react'  // React library import
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Dropdown, DropdownItem, DropdownHeader, DropdownDivider} from "flowbite-react";  // React library import
import BooksService from '../services/books.service';  // Service layer import for API communication
import useToast from '../toast/useToast';
import UpdateReadingStatusButton from './UpdateReadingStatusButton';
import { RiBook2Line } from "react-icons/ri";  // React library import
import { RiBookOpenLine } from "react-icons/ri";  // React library import
import { RiBookmarkLine } from "react-icons/ri";  // React library import
import { RiDeleteBin6Line } from "react-icons/ri";  // React library import
import RemoveBookModal from './RemoveBookModal';
import UpdateReadingStatusView from './UpdateReadingStatusView';
import { useStats } from '../contexts/StatsContext';

function AddToReadingListButton(props) {
    const [readingStatus, setReadingStatus] = useState();  // React state hook for component state management
    const [currentPage, setCurrentPage] = useState(0);  // React state hook for component state management
    const [totalPages, setTotalPages] = useState();  // React state hook for component state management
    const [openModalReading, setOpenModalReading] = useState(false);  // React state hook for component state management
    const [readID, setReadID] = useState();  // React state hook for component state management
    const [openRemoveModal, setOpenRemoveModal] = useState();  // React state hook for component state management
    const toast = useToast(4000);
    const { refreshStats } = useStats();

    const updateReadStatus = useCallback(() => {
        if (import.meta.env.DEV) console.log(`Checking status for ISBN: ${props.isbn}`);
        BooksService.status(props.isbn).then(
            response => {
                if (import.meta.env.DEV) console.log("Book status response:", response.data);
                setReadingStatus(response.data.reading_status);  // State update
                setReadID(response.data.id);  // State update
                setCurrentPage(response.data.current_page);  // State update
            },
            error => {
              const resMessage =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
              if (error.response.status != 404) {
                toast("error", resMessage);
              }
            }
        )
    }, [props.isbn, toast])

    const handleSave = (status, current_page) => {
        var arr = {}
        arr.title = props.data?.title;
        arr.isbn = props.isbn;
        arr.author = props.data?.author_name?.[0];  // Authors object from the API can have more than one object inside.. fix this later by flattening and getting a list of all authors names.
        if (props.description) {
            arr.description = props.description;
        }
        if (readingStatus) {
            arr.reading_status = readingStatus;
        }
        
        if (currentPage) {
            arr.current_page = currentPage;
        }

        if (totalPages) {
            arr.total_pages = totalPages;
        }

        if (status) {
            arr.reading_status = status;
        }
        if (current_page) {
            arr.current_page = current_page;
        }

        if (import.meta.env.DEV) console.log("Adding book with data:", arr);
        BooksService.add(arr).then(
            response => {
                if (import.meta.env.DEV) console.log("Book added successfully:", response.data);
                toast("success", response.data.message);
                updateReadStatus();
                refreshStats();  // Refresh stats after adding book
  // Call the onSuccess callback if provided
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
              toast("error", resMessage);
            }
        )
    }

    const editRead = (status, current_page) => {
        setOpenModalReading(false);  // State update
        if (!status) {
            status = readingStatus;
        }
        if (!current_page) {
            current_page = currentPage;
        }
        if (import.meta.env.DEV) console.log(`editRead called with status: ${status}, current_page: ${current_page}, readID: ${readID}`);
        if (readID) {
            if (import.meta.env.DEV) console.log("Editing existing book");
            BooksService.edit(readID, {"status": status, "current_page": current_page}).then(
                response => {
                    if (import.meta.env.DEV) console.log("Book edited successfully:", response.data);
                    setReadingStatus(status);  // State update
                    toast("success", response.data.message);
                    setOpenModalReading(false);  // State update
                    refreshStats();  // Refresh stats after editing book
  // Call the onSuccess callback if provided
                    if (props.onSuccess) {
                        props.onSuccess();
                    }
                }
            )
        } else {
            if (import.meta.env.DEV) console.log("Adding new book");
            setReadingStatus(status);  // State update
            setCurrentPage(current_page);  // State update
            handleSave(status, current_page);
        }
    }

    useEffect(() => {  // React effect hook for side effects
      setTotalPages(props.data?.number_of_pages_median)  // State update
      updateReadStatus();
    }, [props.data, updateReadStatus])
    
    const handleSetReadingToBeRead = () => {
        setReadingStatus("To be read");  // State update
        editRead("To be read");
    }

    const handleSetReadingCurrentlyReading = () => {
        setReadingStatus("Currently reading")  // State update
        setOpenModalReading(true);  // State update
    }
    const handleSetReadingRead = () => {
        setReadingStatus("Read");  // State update
        setCurrentPage(totalPages);  // State update
        editRead("Read", totalPages);
    }
    
    const handleBookRemoval = () => {
        setReadingStatus(undefined);  // State update
    }

    return (  // JSX return statement
        <div>
            <Modal show={openModalReading} onClose={() => setOpenModalReading(false)}>
                <ModalHeader className="border-gray-200">Add {props.data?.title} to currently reading</ModalHeader>
                <ModalBody>
                    <UpdateReadingStatusView title={props.data?.title} totalPages={totalPages} 
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                    />
                </ModalBody>
                <ModalFooter>
                <Button onClick={() => editRead()}>Save</Button>  // Event handler assignment
                <Button color="alternative" onClick={() => setOpenModalReading(false)}>  // Event handler assignment
                    Close
                </Button>
                </ModalFooter>
            </Modal>

            <ButtonGroup outline>
                {(() => {
                    if (readingStatus === "To be read") {
                        return <Button onClick={() => handleSetReadingCurrentlyReading()}><RiBookOpenLine className="mr-2 h-5 w-5" />Currently reading</Button>;  // Event handler assignment
                    } else if (readingStatus === "Currently reading") {
                        return <UpdateReadingStatusButton currentPage={currentPage} totalPages={totalPages} id={readID} title={props.data?.title} rating={0} buttonStyle={"alternative"} onSucess={updateReadStatus}/>
                    } else if (readingStatus === "Read") {
                        return <Button disabled><RiBook2Line className="mr-2 h-5 w-5" />Read</Button>;
                    }else {
                        return <Button onClick={() => handleSetReadingToBeRead()}><RiBookmarkLine className="mr-2 h-5 w-5" />Want to read</Button>;  // Event handler assignment
                    }
                })()}
        
                <Dropdown>
                    {(() => {
                        if (readingStatus === "To be read") {
                            return <>
                                <DropdownHeader ><span className="block text-sm opacity-50">Want to read</span></DropdownHeader>
                                <DropdownDivider />
                                <DropdownItem icon={RiBook2Line} onClick={() => handleSetReadingRead() }>Read</DropdownItem>  // Event handler assignment
                                <DropdownItem onClick={() => setOpenRemoveModal(true)}><RiDeleteBin6Line size={18} className="mr-1" />Remove</DropdownItem>  // Event handler assignment
                            </>;
                        } else if (readingStatus === "Currently reading") {
                            return <>
                                <DropdownHeader><span className="block text-sm opacity-50">Currently reading</span></DropdownHeader>
                                <DropdownDivider />
                                <DropdownItem icon={RiBookmarkLine} onClick={() => handleSetReadingToBeRead() }>Want to read</DropdownItem>  // Event handler assignment
                                <DropdownItem icon={RiBook2Line} onClick={() => handleSetReadingRead() }>Read</DropdownItem>  // Event handler assignment
                                <DropdownItem onClick={() => setOpenRemoveModal(true)}><RiDeleteBin6Line size={18} className="mr-1" />Remove</DropdownItem>  // Event handler assignment
                            </>;
                        } else if (readingStatus === "Read") {
                            return <>
                                <DropdownItem icon={RiBookmarkLine} onClick={() => handleSetReadingToBeRead() }>Want to read</DropdownItem>  // Event handler assignment
                                <DropdownItem icon={RiBookOpenLine} onClick={() => handleSetReadingCurrentlyReading() }>Currently reading</DropdownItem>  // Event handler assignment
                                <DropdownItem onClick={() => setOpenRemoveModal(true)}><RiDeleteBin6Line size={18} className="mr-1" />Remove</DropdownItem>  // Event handler assignment
                            </>;
                        }else {
                            return <>
                                <DropdownItem icon={RiBookOpenLine} onClick={() => handleSetReadingCurrentlyReading()}>Currently reading</DropdownItem>  // Event handler assignment
                                <DropdownItem icon={RiBook2Line} onClick={() => handleSetReadingRead()}>Read</DropdownItem>  // Event handler assignment
                            </>;
                        }
                    })()}
                    
                </Dropdown>
            </ButtonGroup>
            <RemoveBookModal id={readID} open={openRemoveModal} close={setOpenRemoveModal} onSuccess={handleBookRemoval}/>
        </div>
    )
}

export default AddToReadingListButton  // Export for use in other modules
