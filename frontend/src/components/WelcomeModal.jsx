import { useEffect, useState } from 'react'
import useToast from '../toast/useToast';
import ProfileService from '../services/profile.service';
import { Button, TextInput, Label, Modal, ModalBody, Popover, Select } from "flowbite-react";
import { RiQuestionLine } from "react-icons/ri";

function WelcomeModal(props) {

    const [showWelcomeScreen, setShowWelcomeScreen] = useState();
    const [createDisplayName, setCreateDisplayName] = useState();
    const [profileVisibility, setProfileVisibility] = useState("hidden");
    const [contentIndex, setContentIndex] = useState(0);

    const toast = useToast(4000);

    const displayNamePopoverContent = (
        <div className="w-64 text-sm text-gray-500 dark:text-gray-400">
            <div className="border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Help</h3>
            </div>
            <div className="px-3 py-2">
                <p>A display name will be used on your profile page that lists all your books. A profile page can be private or public. Display name and visibility of the profile page can be changed at any time.</p>
                <p>Your display name will also be used for a link to your profile page if you have set it to public.</p>
            </div>
        </div>
    )
    
    useEffect(() => {
        if (localStorage.getItem("show_welcome_screen") != "false") {
            getProfileData()
        }
    }, [])

    useEffect(() => {
        if (props.show) {
            getProfileData()
        }
    }, [props.show])
    

    /* Note: this is checks if a profile exists or not, at the moment this indicates if a welcome screen should be shown.
    * if the user already has gone through the setup then a localstorage item will be set to indicate this instead.
    */
    const getProfileData = () => {
        ProfileService.get().then(
            response => {
                if (response.status == 404) {
                    setShowWelcomeScreen(true);
                } else {
                    setShowWelcomeScreen(false);
                    localStorage.setItem("show_welcome_screen", false);
                }
            },
            error => {
                if (error.response) {
                    if (error.response.status == 404) {
                        setShowWelcomeScreen(true);
                    }
                }
            }
        )
    }

    const handleCreateProfile = (e) => {
        e.preventDefault();
        ProfileService.create({"display_name": createDisplayName, "visibility": profileVisibility}).then(
            response => {
                toast("success", response.data.message);
                setContentIndex(1);
                localStorage.setItem("show_welcome_screen", false);
                props.onProfileCreate();
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
        <>
        {showWelcomeScreen &&
            <Modal show={showWelcomeScreen} size="lg" dismissible={false}>
                <ModalBody className="p-8">
                    {contentIndex == 0 &&
                    <form className="flex flex-col gap-6" onSubmit={handleCreateProfile}>
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📚</span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to BookVault! 🎉</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                We're excited to have you here! Let's set up your profile to start tracking your reading journey.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="displayname" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Display Name
                                    </Label>
                                    <Popover trigger="hover" content={displayNamePopoverContent}>
                                        <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <RiQuestionLine className="w-4 h-4" />
                                        </button>
                                    </Popover>
                                </div>
                                <TextInput 
                                    id="displayname" 
                                    type="text" 
                                    required 
                                    value={createDisplayName} 
                                    onChange={(e) => setCreateDisplayName(e.target.value)}
                                    placeholder="Enter your display name"
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="visibility" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Profile Visibility
                                </Label>
                                <Select 
                                    id="visibility" 
                                    required 
                                    value={profileVisibility} 
                                    onChange={(e) => setProfileVisibility(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="hidden">🔒 Hidden - Only you can see your profile</option>
                                    <option value="public">🌍 Public - Anyone can view your reading list</option>
                                </Select>
                            </div>
                        </div>
                        
                        <Button 
                            type="submit" 
                            disabled={!createDisplayName}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            size="lg"
                        >
                            Create My Profile
                        </Button>
                    </form>
                    }
                    {contentIndex == 1 &&
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-3xl">✅</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">You're All Set!</h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                                    Your profile has been created successfully! Ready to start building your digital library?
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        💡 <strong>Pro tip:</strong> Use the search feature or the floating + button to quickly add books to your library!
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => setShowWelcomeScreen(false)}
                                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                                size="lg"
                            >
                                Start Reading Journey
                            </Button>
                        </div>
                    }
                </ModalBody>
            </Modal>
        }
        </>
    )
}

export default WelcomeModal