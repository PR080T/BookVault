import {useState} from 'react'  // React library import
import FileList from './FileList'
import RequestData from './RequestData'
import FileImport from './FileImport';

function DataTab() {
  const [forceRefresh, setForceRefresh] = useState();  // React state hook for component state management
  return (  // JSX return statement
    <div>
        <div className="grid grid-rows-1 xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
            <div>
                <RequestData onRequest={()=> setForceRefresh(true)}/>
                <br/>
                <FileImport />
            </div>
            <div className="col-span-2">
                <FileList refresh={forceRefresh} refreshComplete={() => setForceRefresh(false)}/>
            </div>
        </div>
    

    </div>
  )
}

export default DataTab  // Export for use in other modules
