import { useEffect, useState, useCallback } from 'react'  // React library import
import { Popover, Button, Checkbox, Label, TextInput, HR } from "flowbite-react";  // React library import
import { RiQuestionLine } from "react-icons/ri";  // React library import
import UserSettingsServices from '../services/userSettings.service';  // Service layer import for API communication
import useToast from '../toast/useToast';

function MastodonTab() {
    const [, setUserSettings] = useState();  // React state hook for component state management
    const [eventSharing, setEventSharing] = useState("");  // React state hook for component state management
    const [mastodonInstance, setMastodonInstance] = useState("");  // React state hook for component state management
    const [mastodonAccess, setMastodonAccess] = useState("");  // React state hook for component state management
    const [disableSaveButton, setDisableSaveButton] = useState(true);  // React state hook for component state management
    const toast = useToast(4000);

    const handleSave = () => {
        UserSettingsServices.edit({"send_book_events": eventSharing, "mastodon_url": mastodonInstance, "mastodon_access_token": mastodonAccess}).then(
            response => {
                toast("success", response.data.message)
                setDisableSaveButton(true)  // State update
                getUserSettings();
            },
            error => {
                if (error.response?.status !== 404) {
                    const resMessage = error.response?.data?.message || error.message || error.toString();
                    console.error(error);
                    toast("error", resMessage);
                }
            }
        )
    };

    const getUserSettings = useCallback(() => {
        UserSettingsServices.get().then(
            response => {
                setUserSettings(response.data);  // State update
                setEventSharing(response.data.send_book_events);  // State update
                setMastodonInstance(response.data.mastodon_url)  // State update
                setMastodonAccess(response.data.mastodon_access_token)  // State update
            },
            error => {
                if (error.response?.status !== 404) {
                    const resMessage = error.response?.data?.message || error.message || error.toString();
                    console.error(error);
                    toast("error", resMessage);
                }
            }
        )
    }, [toast]);

    useEffect(() => {  // React effect hook for side effects
        getUserSettings();
    }, [getUserSettings])

    const displayPopoverContent = (
        <div className="w-64 text-sm text-gray-500 dark:text-gray-400">
            <div className="border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Help</h3>
            </div>
            <div className="px-3 py-2">
                <p>See <a target="_blank" className="underline hover:no-underline" href="https:  // github.com/Mozzo1000/booklogr/wiki/Connect-to-mastodon">guide</a> for how to connect your Mastodon account to BookVault.</p>
            </div>
        </div>
    )

    return (  // JSX return statement
        <div className="flex flex-col gap-8">
            <div className="flex flex-row justify-end">
                <Button disabled={disableSaveButton} onClick={handleSave}>Save</Button>  // Event handler assignment
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="format lg:format-lg dark:format-invert">
                    <h4>Share events</h4>
                </div>
                <div>
                <div className="flex gap-4">
                    <Checkbox id="event_share" checked={eventSharing} onChange={(e) => (setEventSharing(e.target.checked), setDisableSaveButton(false))} />  // Event handler assignment
                    <Label htmlFor="event_share">Enable event sharing</Label>
                </div>
                <div className="">
                    <div className="text-gray-500 dark:text-gray-300">
                        <span className="text-xs font-normal">
                            This will enable BookLogr to listen for events such as when finishing a book and share it to social media.
                        </span>
                    </div>
                </div>
                </div>
            </div>

            <HR />

            <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="flex flex-row gap-2">
                    <div className="format lg:format-lg dark:format-invert">
                        <h4 >Mastodon account</h4>
                    </div>
                    <div>
                        <Popover trigger="hover" content={displayPopoverContent}>
                            <span><RiQuestionLine className="dark:text-white"/></span>
                        </Popover>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div>
                        <Label htmlFor="mastodon_instance">Mastodon instance</Label>
                        <TextInput id="mastodon_instance" type="text" placeholder='https:  // mastodon.social' value={mastodonInstance} onChange={(e) => (setMastodonInstance(e.target.value), setDisableSaveButton(false))}/>
                    </div>

                    <div >
                        <Label htmlFor="mastodon_access">Access token</Label>
                        <TextInput id="mastodon_access" type="text" value={mastodonAccess} onChange={(e) => (setMastodonAccess(e.target.value), setDisableSaveButton(false))}/>  // Event handler assignment
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MastodonTab  // Export for use in other modules
