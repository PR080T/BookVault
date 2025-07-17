import { useState, useEffect, useReducer, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import BookItem from './BookItem'
import { Tabs, Pagination } from "flowbite-react";
import BooksService from '../../services/books.service';
import PaneTabView from './PaneTabView';
import reducer, { initialState, actionTypes } from '../../useLibraryReducer';
import ReadingStats from './ReadingStats';
import ExportImport from '../ExportImport';
import ReadingGoals from '../ReadingGoals';
import { RiBook2Line } from "react-icons/ri";
import { RiBookOpenLine } from "react-icons/ri";
import { RiBookmarkLine } from "react-icons/ri";

function LibraryPane() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(0);
    const [state, dispatch] = useReducer(reducer, initialState);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const onPageChange = (page) => setPage(page);

    const translateTabsToStatus = useCallback(() => {
        let status = "Currently reading";
        if (activeTab == 0) {
            status = "Currently reading"
        } else if (activeTab == 1) {
            status = "To be read"
         }else if (activeTab == 2) {
            status = "Read"
        }
        return status;
    }, [activeTab])

    const getBooks = useCallback(async (status) => {
        try {
            if (import.meta.env.DEV) console.log(`Fetching books with status: ${status}, page: ${page}`);
            const response = await BooksService.get(status, page);
            if (import.meta.env.DEV) console.log(`Fetched ${response.data.items?.length || 0} books:`, response.data);
            dispatch({type: actionTypes.BOOKS, books: response.data})
            if (response.data.meta && response.data.meta.total_pages > 0) {
                setTotalPages(response.data.meta.total_pages)
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            // Set empty state on error
            dispatch({type: actionTypes.BOOKS, books: { items: [], meta: { total_items: 0 } }})
        }
    }, [page, dispatch])

    useEffect(() => {
        getBooks(translateTabsToStatus());
        setPage(1);
        
    }, [activeTab, getBooks, translateTabsToStatus])

    useEffect(() => {
      getBooks(translateTabsToStatus())
    }, [page, getBooks, translateTabsToStatus])

    // Refresh books when the window regains focus (user returns to the tab/app)
    useEffect(() => {
        const handleFocus = () => {
            // Add a small delay to ensure database transactions are committed
            setTimeout(() => {
                getBooks(translateTabsToStatus());
            }, 100);
        };

        window.addEventListener('focus', handleFocus);
        
        // Also listen for visibility change (when user switches tabs)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setTimeout(() => {
                    getBooks(translateTabsToStatus());
                }, 100);
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [getBooks, translateTabsToStatus])

    // Refresh books when navigating to the library page
    useEffect(() => {
        if (location.pathname === '/library') {
            // Add a small delay to ensure database transactions are committed
            setTimeout(() => {
                getBooks(translateTabsToStatus());
            }, 100);
        }
    }, [location.pathname, getBooks, translateTabsToStatus])

    return (
        <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <article className="format lg:format-lg dark:format-invert">
                <h2 className="mb-2">My Library</h2>
                <p className="text-gray-600 dark:text-gray-400">Organize and track your reading journey</p>
            </article>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Total books: {state.books?.meta?.total_items || 0}</span>
                </div>
                <button 
                    onClick={() => getBooks(translateTabsToStatus())}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Refresh
                </button>
                <ExportImport />
            </div>
        </div>
        <ReadingGoals />
        <ReadingStats />
        <Tabs onActiveTabChange={(tab) => setActiveTab(tab)} variant="underline" className="pt-1">
        <Tabs.Item active title="Currently reading" icon={RiBookOpenLine}>
        <PaneTabView>
            {(state.books?.items || []).map((item) => {
                return (
                    <div key={item.id}>
                        <BookItem internalID={item.id} allowNoteEditing={true} showNotes={true} showRating={true} showProgress={true} title={item.title} isbn={item.isbn} totalPages={item.total_pages} currentPage={item.current_page} author={item.author} rating={item.rating} notes={item.num_notes} onReadingStatusChanged={() => getBooks(translateTabsToStatus())}/>
                    </div>
                )
            })}
            </PaneTabView>
        </Tabs.Item>
        <Tabs.Item title="To be read" icon={RiBookmarkLine}>
            <PaneTabView>
            {(state.books?.items || []).map((item) => {
                return (
                    <div key={item.id}>
                        <BookItem internalID={item.id} showNotes allowNoteEditing={true} showRating={true} showProgress={false} showOptions title={item.title} isbn={item.isbn} totalPages={item.total_pages} currentPage={item.current_page} author={item.author} rating={item.rating} notes={item.num_notes} onReadingStatusChanged={() => getBooks(translateTabsToStatus())}/>
                    </div>
                )
            })}
            </PaneTabView>
        </Tabs.Item>
        <Tabs.Item title="Read" icon={RiBook2Line}>
            <PaneTabView>
            {(state.books?.items || []).map((item) => {
                return (
                    <div key={item.id}>
                        <BookItem internalID={item.id} showNotes allowNoteEditing={true} showProgress={false} showOptions showRating title={item.title} isbn={item.isbn} author={item.author} rating={item.rating} notes={item.num_notes} onReadingStatusChanged={() => getBooks(translateTabsToStatus())}  />
                    </div>
                )
            })}
            </PaneTabView>
        </Tabs.Item>
        </Tabs>
        {(state.books?.items || []).length > 0 &&
            <div className="flex flex-row justify-center pt-8">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} showIcons />
            </div>
        }

        {(state.books?.items || []).length <= 0 &&
            <div className="flex flex-col justify-center items-center text-center gap-6 pt-16 pb-16">
                <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <RiBook2Line size={64} className="text-gray-400 dark:text-gray-500"/>
                </div>
                <div className="format lg:format-lg dark:format-invert max-w-md">
                    <h3 className="text-xl font-semibold mb-2">No books in this shelf</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {activeTab === 0 && "Start reading a book to see it here."}
                        {activeTab === 1 && "Add books you want to read to build your reading list."}
                        {activeTab === 2 && "Books you've finished will appear here."}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Use the search feature to find and add books to your library.
                    </p>
                </div>
            </div>
        }
        </>
    )
}

export default LibraryPane