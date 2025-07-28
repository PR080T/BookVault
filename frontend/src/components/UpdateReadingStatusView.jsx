import { useState, useEffect, useRef }from 'react'  // React library import
import { Tabs, TabItem, Label, TextInput } from 'flowbite-react'  // React library import
import { RiPercentLine } from "react-icons/ri";  // React library import
import { RiBookOpenLine } from "react-icons/ri";  // React library import

function UpdateReadingStatusView({title, currentPage, setCurrentPage, totalPages, onNoProgressError = ()=> {}, onProgressLesserError = ()=> {}, onProgressGreaterError = ()=> {}}) {
    const [percentage, setPercentage] = useState(0);  // React state hook for component state management
    const [progressErrorText, setPasswordErrorText] = useState();  // React state hook for component state management
    const tabsRef = useRef(null);
    const [activeTab, setActiveTab] = useState(0);  // React state hook for component state management

    useEffect(() => {  // React effect hook for side effects
        setPercentage(((currentPage / totalPages) * 100).toFixed(0));  // State update
        if (currentPage > totalPages) {
            setPasswordErrorText("Current page cannot be greater than total pages.");  // State update
            onProgressGreaterError();
        } else if (currentPage < 0) {
            setPasswordErrorText("Current page cannot be less than 0.");  // State update
            onProgressLesserError();
        } else {
            setPasswordErrorText();  // State update
            onNoProgressError();
        }
    }, [currentPage, onNoProgressError, onProgressGreaterError, onProgressLesserError, totalPages])

    useEffect(() => {  // React effect hook for side effects
        if (activeTab == 0) {
            localStorage.setItem("use_percentage_book_read", false)
        }else if (activeTab == 1) {
            localStorage.setItem("use_percentage_book_read", true)
        }
    }, [activeTab])

    return (  // JSX return statement
        <div className="space-y-6">
            <p className="flex items-center gap-2 dark:text-white">How far are you in<p className="font-bold">{title}</p> ?</p>
            <div className="overflow-x-auto">
                <Tabs variant="fullWidth" ref={tabsRef} onActiveTabChange={(tab) => setActiveTab(tab)}>
                    <TabItem title="Pages" icon={RiBookOpenLine}>
                        <Label className="mb-0 block" htmlFor="input_page">Current page</Label>
                        <TextInput id="input_page" type="number" value={currentPage} onChange={(e) => setCurrentPage(e.target.value)} color={progressErrorText ? 'failure' : 'gray'}/>  // Event handler assignment
                        <p className="pt-2 text-gray-500 text-sm dark:text-gray-400">Progress: {percentage}%</p>
                    </TabItem>
                    <TabItem active={localStorage.getItem("use_percentage_book_read") === "true"} title="Percentage" icon={RiPercentLine}>
                        <Label className="mb-0 block" htmlFor="input_perc">Percentage complete</Label>
                        <TextInput id="input_perc" type="number" value={percentage} onChange={(e) => setCurrentPage(Math.round((e.target.value / 100) * totalPages))} color={progressErrorText ? 'failure' : 'gray'}/>  // Event handler assignment
                        <p className="pt-2 text-gray-500 text-sm dark:text-gray-400">Current page: {currentPage} of {totalPages}</p>
                    </TabItem>
                </Tabs>
                <p className="text-red-600 text-sm">
                    {progressErrorText}
                </p>
            </div>
        </div>
    )
}

export default UpdateReadingStatusView  // Export for use in other modules
