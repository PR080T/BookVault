import { useState } from 'react'  // React library import
import { Dropdown, DropdownHeader, DropdownItem, DropdownDivider } from 'flowbite-react'  // React library import
import BooksService from '../services/books.service';  // Service layer import for API communication
import useToast from '../toast/useToast';
import { FaEllipsisVertical } from "react-icons/fa6";  // React library import
import { RiDeleteBin6Line } from "react-icons/ri";  // React library import
import NotesView from './NotesView';
import { RiStickyNoteLine } from "react-icons/ri";  // React library import
import { RiBook2Line } from "react-icons/ri";  // React library import
import { RiBookOpenLine } from "react-icons/ri";  // React library import
import { RiBookmarkLine } from "react-icons/ri";  // React library import
import RemoveBookModal from './RemoveBookModal';
import EditBookModal from './Library/EditBookModal';
import { RiBallPenLine } from "react-icons/ri";  // React library import
import { useStats } from '../contexts/StatsContext';

function ActionsBookLibraryButton(props) {
    const [, setStatus] = useState();  // React state hook for component state management
    const [openNotesModal, setOpenNotesModal] = useState();  // React state hook for component state management
    const [openRemoveModal, setOpenRemoveModal] = useState();  // React state hook for component state management
    const [openEditBookModal, setOpenEditBookModal] = useState();  // React state hook for component state management

    const toast = useToast(4000);
    const { refreshStats } = useStats();

    const changeStatus = (statusChangeTo) => {
        BooksService.edit(props.id, {status: statusChangeTo}).then(
            response => {
                toast("success", response.data.message);
                refreshStats();  // Refresh stats after status change
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
    }

    const clickDropItem = (stateStatus) => {
        setStatus(stateStatus);  // State update
        changeStatus(stateStatus);
    }

    return (  // JSX return statement
        <>
        <Dropdown label="" dismissOnClick={false} renderTrigger={() => <span className="hover:cursor-pointer"><FaEllipsisVertical className="dark:text-white"/></span>}>
            <DropdownHeader>
                <span className="block text-sm font-bold">Reading status</span>
            </DropdownHeader>
            <DropdownItem onClick={() => (clickDropItem("Currently reading"))}><RiBookOpenLine size={18} className="mr-1"/>Currently reading</DropdownItem>  // Event handler assignment
            <DropdownItem onClick={() => (clickDropItem("To be read"))}><RiBookmarkLine size={18} className="mr-1"/>To be read</DropdownItem>  // Event handler assignment
            <DropdownItem onClick={() => (clickDropItem("Read"))}><RiBook2Line size={18} className="mr-1"/>Read</DropdownItem>  // Event handler assignment
            <DropdownDivider />

            <DropdownItem onClick={() => setOpenNotesModal(true)}><RiStickyNoteLine size={18} className="mr-1"/>Notes & Quotes</DropdownItem>  // Event handler assignment
            <DropdownItem onClick={() => setOpenEditBookModal(true)}><RiBallPenLine size={18} className="mr-1"/>Edit book</DropdownItem>  // Event handler assignment
            <DropdownItem onClick={() => setOpenRemoveModal(true)}><RiDeleteBin6Line size={18} className="mr-1" />Remove</DropdownItem>  // Event handler assignment
        </Dropdown>
        
        <NotesView id={props.id} open={openNotesModal} close={setOpenNotesModal} allowEditing={props.allowNoteEditing}/>
        <RemoveBookModal id={props.id} open={openRemoveModal} close={setOpenRemoveModal} onSuccess={props.onSuccess}/>
        <EditBookModal id={props.id} totalPages={props.totalPages} open={openEditBookModal} close={setOpenEditBookModal} onSuccess={props.onSuccess} />
        </>
    )
}

ActionsBookLibraryButton.defaultProps = {
    allowNoteEditing: true,
}

export default ActionsBookLibraryButton  // Export for use in other modules
