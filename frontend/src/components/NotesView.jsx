import { Button, ButtonGroup, Modal, ModalHeader, ModalBody, ListGroup, ListGroupItem, Dropdown, DropdownHeader, DropdownItem, TextInput, Textarea, Tooltip  } from 'flowbite-react'  // React library import
import { useEffect, useState, useCallback } from 'react'  // React library import
import BooksService from '../services/books.service';  // Service layer import for API communication
import { RiStickyNoteLine } from "react-icons/ri";  // React library import
import { RiEyeLine } from "react-icons/ri";  // React library import
import { RiDeleteBin6Line } from "react-icons/ri";  // React library import
import NotesService from '../services/notes.service';  // Service layer import for API communication
import useToast from '../toast/useToast';
import { RiErrorWarningLine } from "react-icons/ri";  // React library import

function NotesView(props) {
    const [notes, setNotes] = useState();  // React state hook for component state management
    const [selectedNote, setSelectedNote] = useState();  // React state hook for component state management
    const [removalConfModal, setRemovalConfModal] = useState();  // React state hook for component state management
    const [creationMode, setCreationMode] = useState(false);  // React state hook for component state management
    const [quoteCreationMode, setQuoteCreationMode] = useState(false);  // React state hook for component state management
    const [newNote, setNewNote] = useState();  // React state hook for component state management
    const [newQuotePage, setNewQuotePage] = useState();  // React state hook for component state management
    const [filter, setFilter] = useState("all");  // React state hook for component state management

    const toast = useToast(4000);

    const getNotes = useCallback(() => {
        if(props.overrideNotes) {
            setNotes(props.overrideNotes)  // State update
            setSelectedNote(props.overrideNotes[0])  // State update
        } else {
            BooksService.notes(props.id).then(
                response => {
                    setNotes(response.data.notes)  // State update
                    setSelectedNote(response.data.notes[0])  // State update
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
    }, [props.overrideNotes, props.id, toast])

    useEffect(() => {  // React effect hook for side effects
        if(props.open) {
            getNotes()
        }
    }, [props.open, getNotes])

    const changeVisibility = (visibility) => {
        NotesService.edit(selectedNote.id, {"visibility": visibility}).then(
            response => {
                toast("success", response.data.message)
                getNotes()
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

    const removeNote = () => {
        NotesService.remove(selectedNote.id).then(
            response => {
                toast("success", response.data.message)
                getNotes()
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
        setRemovalConfModal(false);  // State update
    }

    const addNote = () => {
        BooksService.addNote(props.id, {"content": newNote, "quote_page": newQuotePage}).then(
            response => {
                toast("success", response.data.message)
                getNotes();
                setCreationMode(false);  // State update
                setQuoteCreationMode(false);  // State update
                setNewQuotePage();  // State update
                setNewNote();  // State update
            },
            error => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();
                toast("error", resMessage);
                setCreationMode(false);  // State update
                setQuoteCreationMode(false);  // State update
                setNewQuotePage();  // State update
                setNewNote();  // State update
            }
        )
    }

    const listNotes = (item) => {
        return (  // JSX return statement
            item &&
            <ListGroupItem active={item.id == selectedNote.id} icon={RiStickyNoteLine} onClick={() => (setSelectedNote(item), setCreationMode(false), setQuoteCreationMode(false))}>  // Event handler assignment
                <div className="flex flex-col gap-2 items-start">
                    <div>
                        {new Date(item.created_at).toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'})}
                    </div>
                    <div className="flex flex-row gap-2">
                        <div>
                            {item.visibility}
                        </div>
                        <div>
                            {item.quote_page ? (
                                <p>Quote</p>
                            ): (
                                <p>Note</p>
                            )}
                            
                        </div>
                    </div>
                </div>
            </ListGroupItem>
        )
    };
    
    return (  // JSX return statement
        <>
        <Modal size={"5xl"} position={"top-center"} show={props.open} onClose={() => props.close(false)}>
        <ModalHeader className="border-gray-200">Notes & Quotes</ModalHeader>
            <ModalBody>
                <div className="grid grid-cols-3 gap-4">
                {notes?.length > 0 ? (
                    <div>
                        <div className="flex flex-col gap-4">
                        <ButtonGroup>
                            <Button color="alternative" onClick={() => setFilter("all")} className={`${filter == "all" ? 'text-cyan-700' : 'text-gray-900'}`}>All</Button>  // Event handler assignment
                            <Button color="alternative" onClick={() => setFilter("notes")} className={`${filter == "notes" ? 'text-cyan-700' : 'text-gray-900'}`}>Notes</Button>  // Event handler assignment
                            <Button color="alternative" onClick={() => setFilter("quotes")} className={`${filter == "quotes" ? 'text-cyan-700' : 'text-gray-900'}`}>Quotes</Button>  // Event handler assignment
                        </ButtonGroup>
                        <ListGroup className="w-full">
                            {notes?.map((item) => {
                                return (  // JSX return statement
                                    (item?.id &&
                                        filter == "quotes" ? (
                                            item?.quote_page && (
                                                listNotes(item)
                                        )
                                        ): filter == "notes" ? (
                                            !item?.quote_page && (
                                                listNotes(item)
                                            )
                                        ): (
                                            listNotes(item)
                                        )
                                    )
                                )
                            })}
                        </ListGroup>
                        {props.allowEditing &&
                            <div className="flex flex-row gap-2 justify-between">
                                <Button color="alternative" onClick={() => (setCreationMode(true), setQuoteCreationMode(false))}>Add note</Button>  // Event handler assignment
                                <Button color="alternative" onClick={() => (setCreationMode(true), setQuoteCreationMode(true))}>Add quote</Button>  // Event handler assignment
                            </div>
                        }
                        </div>
                    </div>
                    ):(
                        (!creationMode &&
                        <div className="col-span-3">
                            <div className="grid grid-cols-1 grid-rows-3 place-items-center justify-center items-center text-center">
                                <RiStickyNoteLine size={96} className="dark:text-white"/>
                                <div className="format lg:format-lg dark:format-invert">
                                    <h2>No notes found</h2>
                                    <p>There does not seem to be any notes or quotes for this book.</p>
                                </div>
                                <div className="inline-flex gap-4">
                                    <Button onClick={() => setCreationMode(true)}>Add note</Button>  // Event handler assignment
                                    <Button onClick={() => (setCreationMode(true), setQuoteCreationMode(true))}>Add quote</Button>  // Event handler assignment
                                </div>
                            </div>
                        </div>
                        )
                    )}
                    <div className={`${creationMode && notes?.length <= 0 ? "col-span-3" : "col-span-2"}`}>
                        <div className="flex flex-col gap-2 h-full">
                            <div className="basis-full">
                                {!creationMode ? (
                                    <div className="flex flex-col gap-2">
                                        {selectedNote?.quote_page &&
                                            <div>
                                                <p className="format dark:format-invert">Page: {selectedNote?.quote_page}</p>
                                            </div>
                                        }
                                        <div>
                                            <p className="dark:text-white">{selectedNote?.note}</p>
                                        </div>
                                    </div>
                                ):(
                                    <>
                                    <div className="format lg:format-lg dark:format-invert">
                                        {quoteCreationMode ? (
                                            <p>Add quote</p>
                                        ): (
                                            <p>Add note</p>
                                        )}
                                    </div>
                                    <Textarea required autoFocus rows={6} value={newNote} onChange={(e) => setNewNote(e.target.value)}/>  // Event handler assignment
                                    {quoteCreationMode &&
                                        <div className="flex flex-col gap-2">
                                            <p className="format dark:format-invert">Page:</p>
                                            <TextInput  type='number' required value={newQuotePage} onChange={(e) => setNewQuotePage(e.target.value)}/>  // Event handler assignment
                                        </div>
                                    }
                                    </>
                                )}
                            </div>
                            <div className="flex flex-row justify-end gap-4">
                                {!creationMode && props.allowEditing && notes?.length > 0 ? (
                                    <>
                                    <Tooltip content="Change visibility">
                                        <Dropdown color="alternative" label={<RiEyeLine className="h-5 w-5"/>}>
                                            <DropdownHeader>Change visibility</DropdownHeader>
                                            <DropdownItem onClick={() => changeVisibility("hidden")}>Hidden</DropdownItem>  // Event handler assignment
                                            <DropdownItem onClick={() => changeVisibility("public")}>Public</DropdownItem>  // Event handler assignment
                                        </Dropdown>
                                    </Tooltip>
                                    <Tooltip content="Remove">
                                        <Button className="hover:cursor-pointer" color="red" onClick={() => setRemovalConfModal(true)}>  // Event handler assignment
                                            <RiDeleteBin6Line className="h-5 w-5" />
                                        </Button>
                                    </Tooltip>
                                    </>
                                ): (
                                    (creationMode &&
                                    <>
                                    <Button color="gray" onClick={() => (setCreationMode(false), setQuoteCreationMode(false), setNewNote())}>Cancel</Button>  // Event handler assignment
                                    <Button onClick={() => addNote()}>Save</Button>  // Event handler assignment
                                    </>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>

        {/* REMOVE NOTE CONFIRMATION DIALOG */}
        <Modal show={removalConfModal} size="md" onClose={() => setRemovalConfModal(false)} popup>
        <ModalHeader />
            <ModalBody>
            <div className="text-center">
                <RiErrorWarningLine className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                Are you sure you want to remove this note?
                </h3>
                <div className="flex justify-center gap-4">
                <Button color="red" onClick={() => removeNote()}>  // Event handler assignment
                    {"Yes, I'm sure"}
                </Button>
                <Button color="light" onClick={() => setRemovalConfModal(false)}>  // Event handler assignment
                    {"No, cancel"}
                </Button>
                </div>
            </div>
            </ModalBody>
        </Modal>
        </>
    )
}


NotesView.defaultProps = {
    overrideNotes: undefined,
    allowEditing: true,
}

export default NotesView  // Export for use in other modules
