import {useState} from 'react';  // React library import
import { FileInput, Button, Label, Checkbox, Card, Select } from "flowbite-react";  // React library import
import FilesService from '../../services/files.service';  // Service layer import for API communication
import useToast from '../../toast/useToast';

function FileImport() {
    const [file, setFile] = useState(null);  // React state hook for component state management
    const [uploading, setUploading] = useState(false);  // React state hook for component state management
    const [allowDuplicates, setAllowDuplicates] = useState(false);  // React state hook for component state management
    const [platform, setPlatform] = useState("csv");  // React state hook for component state management
    const toast = useToast(4000);

    const handleUpload = () => {
  // Validation
        if (!file) {
            toast("error", "Please select a file to upload");
            return;
        }

  // Check file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            toast("error", "Please select a CSV file");
            return;
        }

  // Check file size (16MB limit)
        if (file.size > 16 * 1024 * 1024) {
            toast("error", "File size must be less than 16MB");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", platform);

        if (allowDuplicates) {
            formData.append("allow_duplicates", "true");
        }

        setUploading(true);  // State update
        FilesService.upload(formData).then(
            response => {
                toast("success", response.data.message);
                setFile(null);  // State update
                setUploading(false);  // State update
  // Reset file input
                document.getElementById('file-upload').value = '';
            },
            error => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();
                toast("error", resMessage);
                setUploading(false);  // State update
            }
        );
    };

    return (  // JSX return statement
        <Card>
            <div className="flex flex-col gap-4 justify-center">
                <div className="format lg:format-lg dark:format-invert">
                    <h3>Import books</h3>
                    <p></p>
                </div>
                <div >
                    <div>
                        <Label className="mb-2 block" htmlFor="platform">Platform</Label>
                        <Select id="platform" required value={platform} onChange={(e) => setPlatform(e.target.value)}>  // Event handler assignment
                            <option value="csv">BookLogr CSV</option>
                            <option value="goodreads">Goodreads</option>
                        </Select>
                    </div>
                    <br />
                    <div>
                        <Label className="mb-2 block" htmlFor="file-upload">File</Label>
                        <FileInput className="block w-full cursor-pointer rounded-lg border file:-ms-4 file:me-4 file:cursor-pointer file:border-none file:bg-gray-800 file:py-2.5 file:pe-4 file:ps-8 file:text-sm file:font-medium file:leading-[inherit] file:text-white hover:file:bg-gray-700 focus:outline-none focus:ring-1 dark:file:bg-gray-600 dark:hover:file:bg-gray-500" id="file-upload" onChange={(e) => setFile(e.target.files[0])}/>  // Event handler assignment
                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox id="duplicate_checkbox" checked={allowDuplicates} onChange={() => setAllowDuplicates(!allowDuplicates)} />  // Event handler assignment
                            <Label  htmlFor="duplicate_checkbox">Add duplicate books</Label>
                        </div>
                    </div>
                </div>
                <Button onClick={handleUpload} disabled={uploading || !file} className="mt-4">{uploading ? "Uploading..." : "Upload"}</Button>  // Event handler assignment
            </div>
        </Card>
    )
}

export default FileImport  // Export for use in other modules
