import { useState } from 'react';
import { Modal, ModalBody, ModalHeader } from "flowbite-react";
import { RiAddLine, RiSearch2Line } from "react-icons/ri";
import SearchBar from './SearchBar';

function QuickAddButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-105"
                aria-label="Quick add book"
                title="Add a new book to your library"
            >
                <RiAddLine className="w-7 h-7 md:w-8 md:h-8 group-hover:scale-110 transition-transform duration-200" />
            </button>

            {/* Quick Add Modal */}
            <Modal 
                show={isOpen} 
                onClose={() => setIsOpen(false)}
                size="lg"
                position="center"
            >
                <ModalHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <RiSearch2Line className="w-5 h-5 text-blue-600" />
                        <span>Quick Add Book</span>
                    </div>
                </ModalHeader>
                <ModalBody className="p-6">
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Add a Book to Your Library
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                Search for a book by title, author, or ISBN to add it to your collection
                            </p>
                        </div>
                        <div className="relative">
                            <SearchBar 
                                absolute={false} 
                                hideESCIcon={false} 
                                showAttribution={true}
                                onNavigate={() => setIsOpen(false)}
                            />
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </>
    );
}

export default QuickAddButton;