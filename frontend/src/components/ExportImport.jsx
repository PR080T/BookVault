import { useState } from 'react';  // React library import
import { Button, Modal, ModalBody, ModalHeader, ModalFooter, FileInput, Alert, Select } from "flowbite-react";  // React library import
import { RiDownloadLine, RiUploadLine, RiFileTextLine } from "react-icons/ri";  // React library import
import BooksService from '../services/books.service';  // Service layer import for API communication
import TasksService from '../services/tasks.service';  // Service layer import for API communication
import FilesService from '../services/files.service';  // Service layer import for API communication
import useToast from '../toast/useToast';

function ExportImport() {
    const [showModal, setShowModal] = useState(false);  // React state hook for component state management
    const [isExporting, setIsExporting] = useState(false);  // React state hook for component state management
    const [isImporting, setIsImporting] = useState(false);  // React state hook for component state management
    const [exportFormat, setExportFormat] = useState('json');  // React state hook for component state management
    const toast = useToast(4000);

    const handleExport = async () => {
        setIsExporting(true);  // State update
        try {
            if (exportFormat === 'json') {
  // Client-side JSON export (immediate)
                const response = await BooksService.get();
                const books = response.data.items;
                
                const exportData = {
                    exportDate: new Date().toISOString(),
                    version: "1.0",
                    books: books.map(book => ({
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn,
                        description: book.description,
                        reading_status: book.reading_status,
                        current_page: book.current_page,
                        total_pages: book.total_pages,
                        rating: book.rating,
                        created_at: book.created_at
                    }))
                };

                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `bookvault-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast("success", `Exported ${books.length} books successfully!`);
            } else {
  // Server-side export (CSV/HTML) via background tasks
                await TasksService.create({
                    type: `${exportFormat}_export`,
                    data: {}
                });
                
                toast("info", `${exportFormat.toUpperCase()} export started! You'll be able to download it from your files once complete.`);
                setShowModal(false);  // State update
            }
        } catch (error) {
            console.error('Export error:', error);
            toast("error", "Failed to export books. Please try again.");
        } finally {
            setIsExporting(false);  // State update
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);  // State update
        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (fileExtension === 'json') {
  // Handle JSON import (client-side)
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (!importData.books || !Array.isArray(importData.books)) {
                    throw new Error("Invalid JSON file format");
                }

                let successCount = 0;
                let errorCount = 0;

                for (const book of importData.books) {
                    try {
                        await BooksService.add({
                            title: book.title,
                            author: book.author,
                            isbn: book.isbn,
                            description: book.description,
                            reading_status: book.reading_status || "To be read",
                            current_page: book.current_page || 0,
                            total_pages: book.total_pages || 0,
                            rating: book.rating || null
                        });
                        successCount++;
                    } catch (error) {
                        errorCount++;
                        console.warn(`Failed to import book: ${book.title}`, error);
                    }
                }

                if (successCount > 0) {
                    toast("success", `Successfully imported ${successCount} books!`);
                }
                if (errorCount > 0) {
                    toast("warning", `${errorCount} books could not be imported (possibly duplicates)`);
                }
            } else if (fileExtension === 'csv') {
  // Handle CSV import (server-side via file upload)
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'goodreads');  // Default to Goodreads format
                formData.append('allow_duplicates', 'false');

                try {
                    const response = await FilesService.upload(formData);
                    const result = response.data;
                    
                    if (response.status === 200 || response.status === 201) {
                        toast("success", result.message);
                    } else {
                        toast("error", result.message || "Failed to import CSV file");
                    }
                } catch (error) {
                    console.error('CSV import error:', error);
                    toast("error", "Failed to import CSV file. Please try again.");
                }
            } else {
                throw new Error("Unsupported file format");
            }

            setShowModal(false);  // State update
        } catch (error) {
            console.error('Import error:', error);
            toast("error", "Failed to import books. Please check the file format.");
        } finally {
            setIsImporting(false);  // State update
            event.target.value = '';
        }
    };

    return (  // JSX return statement
        <>
            <Button
                color="gray"
                size="sm"
                onClick={() => setShowModal(true)}  // Event handler assignment
                className="flex items-center gap-2"
            >
                <RiFileTextLine className="w-4 h-4" />
                Export/Import
            </Button>

            <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
                <ModalHeader>Export/Import Books</ModalHeader>
                <ModalBody className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <RiDownloadLine className="w-5 h-5" />
                            Export Books
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Download all your books for backup or transfer.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Export Format</label>
                            <Select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value)}  // Event handler assignment
                            >
                                <option value="json">JSON (Immediate Download)</option>
                                <option value="csv">CSV (Background Export)</option>
                                <option value="html">HTML (Background Export)</option>
                            </Select>
                        </div>
                        <Button
                            onClick={handleExport}  // Event handler assignment
                            disabled={isExporting}
                            className="w-full"
                        >
                            {isExporting ? "Exporting..." : `Export as ${exportFormat.toUpperCase()}`}
                        </Button>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <RiUploadLine className="w-5 h-5" />
                            Import Books
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Upload a JSON or CSV file to import books into your library.
                        </p>
                        <Alert color="info" className="mb-4">
                            <span className="text-sm">
                                <strong>Note:</strong> Duplicate books (same ISBN) will be skipped during import.
                                Supports BookVault JSON exports and Goodreads CSV exports.
                            </span>
                        </Alert>
                        <FileInput
                            accept=".json,.csv"
                            onChange={handleImport}  // Event handler assignment
                            disabled={isImporting}
                            helperText="Select a JSON or CSV file (BookVault or Goodreads format)"
                        />
                        {isImporting && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                                Importing books, please wait...
                            </p>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="gray" onClick={() => setShowModal(false)}>  // Event handler assignment
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}

export default ExportImport;  // Export for use in other modules
