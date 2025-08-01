import { Card, Button, Label, Select} from 'flowbite-react'  // React library import
import {useState } from 'react'  // React library import
import TasksService from '../../services/tasks.service'  // Service layer import for API communication
import useToast from '../../toast/useToast';

const customThemeSelect = {
    base: "flex",
    field: {
        base: "relative w-full",
        icon: {
        base: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3",
        svg: "h-5 w-5 text-gray-500 dark:text-gray-400",
        },
        select: {
        base: "block w-full appearance-none border bg-arrow-down-icon bg-[length:0.75em_0.75em] bg-[position:right_12px_center] bg-no-repeat pr-10 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
        withIcon: {
            on: "pl-10",
            off: "",
        }
    },
  }
}

function RequestData(props) {
    const [dataFormat, setDataFormat] = useState("csv")  // React state hook for component state management
    const toast = useToast(4000);

    const requestData = () => {
        let taskType;
        if (dataFormat == "csv") {
            taskType = "csv_export"
        }else if (dataFormat == "json") {
            taskType = "json_export"
        }else if (dataFormat == "html") {
            taskType = "html_export"
        }
        TasksService.create(taskType, {}).then(
            response => {
                toast("success", response.data.message);
                props.onRequest();
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

    return (  // JSX return statement
        <Card>
            <div className="flex flex-col gap-4 justify-center">
                <div className="format lg:format-lg dark:format-invert">
                    <h3>Request data</h3>
                    <p>You can request a copy of all your data. Once the request has finished, the data will be displayed in the "Available exports" table for you to download.</p>
                </div>
                <div>
                    <div className="mb-2 block">
                        <Label htmlFor="data-format">Choose data format</Label>
                    </div>
                        <Select theme={customThemeSelect} className='bg-none' id="data-format" required value={dataFormat} onChange={(e) => setDataFormat(e.target.value)}>  // Event handler assignment
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="html">HTML</option>
                    </Select>
                </div>
                <Button onClick={() => requestData()}>Request data</Button>  // Event handler assignment
            </div>
        </Card>
    )
}

export default RequestData  // Export for use in other modules
