import { useState, useEffect, useCallback } from 'react'
import { Table, TableHead, TableHeadCell, TableBody, TableCell, TableRow, Button, Spinner} from "flowbite-react";
import FilesService from '../../services/files.service';
import useToast from '../../toast/useToast';
import { useInterval } from '../../useInterval';

function FileList(props) {
    const [files, setFiles] = useState([]);
    const [refreshInterval, setRefreshInterval] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast(4000);

    useEffect(() => {
        if (props.refresh) {
            setLoading(true);
            setRefreshInterval(2000);
        }
    }, [props.refresh])


    const getFiles = useCallback(() => {
        const oldFiles = files;
        FilesService.getAll().then(
            response => {
                setFiles(response.data);
                if (refreshInterval) {
                    if (JSON.stringify(oldFiles) != JSON.stringify(response.data)) {
                        toast("success", "Exported file is now available for download")
                        props.refreshComplete();
                        setRefreshInterval(null);
                        setLoading(false);
                    }
                }
            },
            error => {
                // Always ensure files is an array to prevent map errors
                setFiles([]);
                
                if (error.response && error.response.status != 404) {
                    const resMessage =
                        (error.response &&
                            error.response.data &&
                            error.response.data.message) ||
                        error.message ||
                        error.toString();
                    console.error(error);
                    toast("error", resMessage);
                } else if (!error.response) {
                    // Network error
                    const resMessage = error.message || "Network error occurred";
                    console.error(error);
                    toast("error", resMessage);
                }
                // For 404 errors, we just set files to empty array (no toast needed)
            }
        )
    }, [files, refreshInterval, toast, props])

    useEffect(() => {
        getFiles();
    }, [getFiles])

    useInterval(() => {
        getFiles();
    }, refreshInterval)
    
    const downloadFile = (filename) => {
        FilesService.get(filename).then(
            response => {
                // create file link in browser's memory
                const href = URL.createObjectURL(response.data);

                // create "a" HTML element with href to file & click
                const link = document.createElement('a');
                link.href = href;
                link.setAttribute('download', filename); //or any other extension
                document.body.appendChild(link);
                link.click();

                // clean up "a" element & remove ObjectURL
                document.body.removeChild(link);
                URL.revokeObjectURL(href);
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

    return (
        <div>
            <div className="flex flex-row gap-4">
            <h2 className="format lg:format-lg dark:format-invert">Available exports ({Array.isArray(files) ? files.length : 0})</h2>
                {loading &&
                    <Spinner />
                }
            </div>
            <Table striped>
                <TableHead>
                    <TableRow>
                        <TableHeadCell>Filename</TableHeadCell>
                        <TableHeadCell>Created</TableHeadCell>
                        <TableHeadCell>Action</TableHeadCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.isArray(files) && files.map((item) => {
                        return (
                            <TableRow key={item.id}>
                                <TableCell>{item.filename}</TableCell>
                                <TableCell>{new Date(item.created_at).toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false})}</TableCell>
                                
                                <TableCell><Button onClick={() => downloadFile(item.filename)}>Download</Button></TableCell>
                            </TableRow>
                        )
                    })
                    
                }
                </TableBody>
            </Table>
        </div>
    )
}

export default FileList