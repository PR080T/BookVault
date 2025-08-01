import { useEffect, useState, useMemo, useCallback } from 'react'  // React library import
import ProfileService from '../services/profile.service';  // Service layer import for API communication
import { Button, ButtonGroup, TextInput, Label, Badge, Modal, ModalHeader, ModalBody, Select, Popover, Avatar, Tooltip, Alert, Spinner } from "flowbite-react";  // React library import
import useToast from '../toast/useToast';
import BookItem from '../components/Library/BookItem';  // Reusable UI component import
import PaneTabView from '../components/Library/PaneTabView';  // Reusable UI component import
import { Link, useParams } from 'react-router-dom';  // React library import
import BookStatsCard from '../components/BookStatsCard';  // Reusable UI component import
import { RiSettings4Line } from "react-icons/ri";  // React library import
import { RiQuestionLine } from "react-icons/ri";  // React library import
import authService from '../services/auth.service';  // Service layer import for API communication
import { RiBook2Line } from "react-icons/ri";  // React library import
import { RiBookOpenLine } from "react-icons/ri";  // React library import
import { RiBookmarkLine } from "react-icons/ri";  // React library import
import { RiEyeLine } from "react-icons/ri";  // React library import
import { RiRefreshLine } from "react-icons/ri";  // React library import
import AnimatedLayout from '../AnimatedLayout';
import WelcomeModal from '../components/WelcomeModal';  // Reusable UI component import
import { checkConnection } from '../services/api';  // Service layer import for API communication

function Profile() {
    const [data, setData] = useState();  // React state hook for component state management
    const [readingStatusFilter, setReadingStatusFilter] = useState("All");  // React state hook for component state management

    const [openSettingsModal, setOpenSettingsModal] = useState(false);  // React state hook for component state management
    const [displayName, setDisplayName] = useState();  // React state hook for component state management
    const [profileVisiblity, setProfileVisiblity] = useState();  // React state hook for component state management
    const [profileNotFound, setProfileNotFound] = useState(false);  // React state hook for component state management
    const [networkError, setNetworkError] = useState(false);  // React state hook for component state management
    const [loading, setLoading] = useState(false);  // React state hook for component state management

    const [showWelcomeModal, setShowWelcomeScreen] = useState(false);  // React state hook for component state management

    const toast = useToast(4000);
    let { name } = useParams();
    const currentUser = authService.getCurrentUser();

    const displayNamePopoverContent = (
        <div className="w-64 text-sm text-gray-500 dark:text-gray-400">
            <div className="border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Help</h3>
            </div>
            <div className="px-3 py-2">
                <p>Changing your display name will also change the link to get to your public profile.</p>
            </div>
        </div>
    )

    const filteredBooks = useMemo(() => {
        if (data) {
            if (readingStatusFilter == "All") {
                return data.books;
            } else {
                return data.books.filter(data => data.reading_status.toLowerCase() === readingStatusFilter.toLowerCase());
            }
        }
      }, [data, readingStatusFilter]);
    

    const getProfileData = useCallback(() => {
        setLoading(true);  // State update
        setNetworkError(false);  // State update
        setProfileNotFound(false);  // State update
        
        ProfileService.get().then(
            response => {
                setData(response.data)  // State update
                setDisplayName(response.data.display_name);  // State update
                setProfileVisiblity(response.data.visibility)  // State update
                setNetworkError(false);  // State update
                setLoading(false);  // State update
            },
            error => {
                setLoading(false);  // State update
                let resMessage;
                
  // Handle network errors (no response received)
                if (!error.response) {
                    resMessage = error.isNetworkError ? error.message : "Network error - please check your connection";
                    console.error("Network error:", error);
                    setNetworkError(true);  // State update
                } else {
  // Handle HTTP errors
                    resMessage = (error.response.data && error.response.data.message) || 
                                error.message || 
                                error.toString();
                    
                    if (error.response.status === 404) {
                        console.log("Profile not found, showing welcome modal");
                        localStorage.setItem("show_welcome_screen", "true");
                        setShowWelcomeScreen(true);  // State update
                        return;  // Don't show error toast for 404, show welcome modal instead
                    }
                    setNetworkError(false);  // State update
                }
                
  // Only show error toast if it's not a 404 (which shows welcome modal)
                if (!error.response || error.response.status !== 404) {
                    toast("error", resMessage);
                }
              }
        )
    }, [toast])

    useEffect(() => {  // React effect hook for side effects
        console.log("Profile useEffect triggered, name:", name);  // React effect hook for side effects
        if (name) {
            setLoading(true);  // State update
            setNetworkError(false);  // State update
            
            ProfileService.get_by_display_name(name).then(
                response => {
                    setData(response.data)  // State update
                    setDisplayName(response.data.display_name);  // State update
                    setProfileVisiblity(response.data.visibility)  // State update
                    setNetworkError(false);  // State update
                    setLoading(false);  // State update
                },
                error => {
                    setLoading(false);  // State update
                    let resMessage;
                    
  // Handle network errors (no response received)
                    if (!error.response) {
                        resMessage = error.isNetworkError ? error.message : "Network error - please check your connection";
                        console.error("Network error:", error);
                        setNetworkError(true);  // State update
                        setProfileNotFound(false);  // Don't show "profile not found" for network errors
                    } else {
  // Handle HTTP errors
                        resMessage = (error.response.data && error.response.data.message) || 
                                    error.message || 
                                    error.toString();
                        
                        if (error.response.status === 404) {
                            setProfileNotFound(true);  // State update
                        }
                        setNetworkError(false);  // State update
                    }
                    
                    toast("error", resMessage);
                }
            )
        } else {
            console.log("No name parameter, calling getProfileData");
            getProfileData();
        }
    }, [getProfileData, name, toast])

    const handleRetry = async () => {
        const connectionStatus = await checkConnection();
        if (connectionStatus.isConnected) {
            if (name) {
  // Retry loading profile by display name
                const currentEffect = () => {
                    setLoading(true);  // State update
                    setNetworkError(false);  // State update
                    
                    ProfileService.get_by_display_name(name).then(
                        response => {
                            setData(response.data)  // State update
                            setDisplayName(response.data.display_name);  // State update
                            setProfileVisiblity(response.data.visibility)  // State update
                            setNetworkError(false);  // State update
                            setLoading(false);  // State update
                        },
                        error => {
                            setLoading(false);  // State update
                            let resMessage;
                            
                            if (!error.response) {
                                resMessage = error.isNetworkError ? error.message : "Network error - please check your connection";
                                console.error("Network error:", error);
                                setNetworkError(true);  // State update
                                setProfileNotFound(false);  // State update
                            } else {
                                resMessage = (error.response.data && error.response.data.message) || 
                                            error.message || 
                                            error.toString();
                                
                                if (error.response.status === 404) {
                                    setProfileNotFound(true);  // State update
                                }
                                setNetworkError(false);  // State update
                            }
                            
                            toast("error", resMessage);
                        }
                    )
                };
                currentEffect();
            } else {
                getProfileData();
            }
        } else {
            toast("error", "Still unable to connect to server. Please check your internet connection.");
        }
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        let newProfileData = {}

        if(displayName != data.display_name) {
            newProfileData.display_name = displayName;
        }

        if(profileVisiblity != data.visibility) {
            newProfileData.visibility = profileVisiblity;
        }
        if (Object.keys(newProfileData).length > 0) {
            ProfileService.edit(newProfileData).then(
                response => {
                    toast("success", response.data.message);
                    setOpenSettingsModal(false);  // State update
                    getProfileData();
                },
                error => {
                    let resMessage;
                    
  // Handle network errors (no response received)
                    if (!error.response) {
                        resMessage = error.isNetworkError ? error.message : "Network error - please check your connection";
                        console.error("Network error:", error);
                    } else {
  // Handle HTTP errors
                        resMessage = (error.response.data && error.response.data.message) || 
                                    error.message || 
                                    error.toString();
                    }
                    
                    setOpenSettingsModal(false);  // State update
                    toast("error", resMessage);
                }
            )
        }
    }

    function formatVisibility(value) {
        const visibilityMap = {
            hidden: 'private',
            public: 'public'
        };
        return visibilityMap[value] || value;
    }

    return (  // JSX return statement
        <AnimatedLayout>
        <div className="container mx-auto">
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <Spinner size="lg" />
                    <span className="ml-3">Loading profile...</span>
                </div>
            )}
            
            {networkError && (
                <Alert color="failure" className="mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium">Connection Error!</span> Unable to load profile data. Please check your internet connection.
                        </div>
                        <Button size="sm" color="failure" onClick={handleRetry}>  // Event handler assignment
                            <RiRefreshLine className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                </Alert>
            )}
            
            {data && !loading &&
                <div>
                    <div className="flex flex-row justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar rounded />
                        <div className="format lg:format-lg dark:format-invert">
                            <h1 >{data.display_name}</h1>
                        </div>
                            {currentUser &&
                                <Badge icon={RiEyeLine} >{formatVisibility(data.visibility)}</Badge>
                            }
                        </div>
                        {currentUser &&
                            <Tooltip content="Profile settings">
                                <Button className="hover:cursor-pointer" color="light" pill onClick={() => setOpenSettingsModal(true)}><RiSettings4Line className="h-6 w-6"/></Button>  // Event handler assignment
                            </Tooltip>
                        }                        
                    </div>
                    <div className="flex flex-row gap-16 pt-12 justify-around">
                        <BookStatsCard icon={<RiBook2Line className="w-8 h-8 dark:text-white"/>} number={data.num_books_read || 0} text="Read"/>
                        <BookStatsCard icon={<RiBookOpenLine className="w-8 h-8 dark:text-white"/>} number={data.num_books_reading || 0} text="Reading"/>
                        <BookStatsCard icon={<RiBookmarkLine className="w-8 h-8 dark:text-white"/>} number={data.num_books_tbr || 0} text="To Be Read"/>
                    </div>
                    <div className="inline-flex items-center justify-center w-full">
                        <hr className="w-full h-px my-8 bg-gray-200 border-0" />
                        <span className="absolute font-medium text-gray-900 -translate-x-1/3 bg-white dark:bg-[#121212] dark:text-white ">All books</span>
                    </div>
                    <ButtonGroup className="pb-4">
                        <Button color="alternative" onClick={() => setReadingStatusFilter("All")}>All ({data.books.length})</Button>  // Event handler assignment
                        <Button color="alternative" onClick={() => setReadingStatusFilter("Read")}>Read ({data.num_books_read || 0})</Button>  // Event handler assignment
                        <Button color="alternative" onClick={() => setReadingStatusFilter("Currently reading")}>Currently reading ({data.num_books_reading || 0})</Button>  // Event handler assignment
                        <Button color="alternative" onClick={() => setReadingStatusFilter("To be read")}>To be read ({data.num_books_tbr || 0})</Button>  // Event handler assignment
                    </ButtonGroup>
                    <PaneTabView>
                    {filteredBooks.map((item, i) => {
                        return (  // JSX return statement
                            <div key={i}>
                                <BookItem internalID={i} showNotes showRating disableGiveRating={true} showReadingStatusBadge={true} showOptions={false} showProgress={false} title={item.title} isbn={item.isbn} totalPages={item.total_pages} currentPage={item.current_page} author={item.author} readingStatus={item.reading_status} rating={item.rating} notes={item.num_notes} allowNoteEditing={false} overrideNotes={item.notes}/>
                            </div>
                        )
                    })}
                    </PaneTabView>
                    <Modal dismissible show={openSettingsModal} onClose={() => setOpenSettingsModal(false)}>
                        <ModalHeader className="border-gray-200">Update profile</ModalHeader>
                        <ModalBody>
                            <form className="flex flex-col gap-4" onSubmit={handleUpdateProfile}>  // Event handler assignment
                                <div>
                                    <div className="mb-2 block">
                                        <div className="flex flex-row gap-2 items-center">
                                        <Label htmlFor="displayname">Display name</Label>
                                        <Popover trigger="hover" content={displayNamePopoverContent}>
                                            <span><RiQuestionLine className="dark:text-white"/></span>
                                        </Popover>
                                        </div>
                                    </div>
                                    <TextInput id="displayname" type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />  // Event handler assignment
                                </div>
                                <div>
                                    <div className="mb-2 block">
                                        <Label htmlFor="visiblity">Visibility</Label>
                                    </div>
                                    <Select id="visiblity" required value={profileVisiblity} onChange={(e) => setProfileVisiblity(e.target.value)}>  // Event handler assignment
                                        <option value="hidden">Private</option>
                                        <option value="public">Public</option>
                                    </Select>
                                </div>
                                <Button type="submit">Update</Button>
                            </form>
                        </ModalBody>
                    </Modal>
                </div>
            }

            {profileNotFound && !networkError && !loading &&
                <div className="flex flex-col min-h-screen justify-center items-center text-center gap-4">
                    <div className="format lg:format-lg dark:format-invert">
                        <h1>No profile found</h1>
                        <p>We could not find a profile with that name. Either the profile does not exist or it is set to hidden.</p>
                    </div>
                    <Link to="/">
                        <Button color="dark" size="lg">Go home</Button>
                    </Link>
                </div>
            }
        </div>
        <WelcomeModal show={showWelcomeModal} onProfileCreate={() => {
            setShowWelcomeScreen(false);  // State update
            getProfileData();
        }}/>
        </AnimatedLayout>
    )
}

export default Profile  // Export for use in other modules
