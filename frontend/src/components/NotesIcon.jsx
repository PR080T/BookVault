import { useState} from 'react'
import { RiStickyNoteLine } from "react-icons/ri";
import NotesView from './NotesView';
import { Tooltip } from 'flowbite-react';

function NotesIcon(props) {
    const [openNotesModal, setOpenNotesModal] = useState();

    return (
        <>
        <Tooltip content="View notes">
            <div 
                onClick={() => setOpenNotesModal(true)} 
                className="flex flex-row gap-2 items-center px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:cursor-pointer transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
                <RiStickyNoteLine className="w-4 h-4"/>
                <span className="text-sm font-medium">{props.notes}</span>
            </div>
        </Tooltip>
        <NotesView id={props.id} open={openNotesModal} close={setOpenNotesModal} overrideNotes={props.overrideNotes} allowEditing={props.allowNoteEditing}/>
        </>
    )
}

export default NotesIcon