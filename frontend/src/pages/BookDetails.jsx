import { useEffect, useState } from 'react'  // React library import
import { useParams } from "react-router-dom";  // React library import
import OpenLibraryService from '../services/openlibrary.service';  // Service layer import for API communication
import OpenLibraryButton from '../components/OpenLibraryButton';  // Reusable UI component import
import AddToReadingListButtton from '../components/AddToReadingListButton';  // Reusable UI component import
import Skeleton from 'react-loading-skeleton'  // React library import
import 'react-loading-skeleton/dist/skeleton.css'  // React library import
import useToast from '../toast/useToast';
import { Img } from 'react-image'  // React library import
import AnimatedLayout from '../AnimatedLayout';
import { useThemeMode } from 'flowbite-react';  // React library import

function BookDetails() {
    let { id } = useParams();
    const [data, setData] = useState();  // React state hook for component state management
    const [description, setDescription] = useState();  // React state hook for component state management
    const [loading, setLoading] = useState(true);  // React state hook for component state management
    const theme = useThemeMode();
    const toast = useToast(4000);

    useEffect(() => {  // React effect hook for side effects
        OpenLibraryService.get(id).then(
            response => {
                setData(response.data["docs"][0]);  // State update
                setLoading(false);  // State update

                OpenLibraryService.getWorks(response.data["docs"][0].key).then(
                    response => {
                        if (response.data.description) {
                            if (response.data.description.value) {
                                setDescription(response.data.description.value)  // State update
                            } else {
                                setDescription(response.data.description)  // State update
                            }
                        } else {
                            setDescription("No description found")  // State update
                        }
                    }
                )
            },
            error => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();
                toast("error", "OpenLibrary: " + resMessage);
            }
        )
    }, [id, toast])

    return (  // JSX return statement
        <AnimatedLayout>
        <div className="pt-10 lg:pt-20 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <div className="flex justify-center lg:justify-end">
                    <div className="relative group">
                        <Img className="shadow-2xl object-cover rounded-lg max-w-sm w-full group-hover:shadow-3xl transition-shadow duration-300" 
                             src={"https:  // covers.openlibrary.org/b/isbn/" + id + "-L.jpg?default=false"}
                             loader={<Skeleton count={1} width={320} height={500} borderRadius={8} inline={true}/>}
                             unloader={theme.mode == "dark" && <img className="shadow-2xl object-cover rounded-lg max-w-sm w-full" src="/fallback-cover-light.svg"/> || theme.mode == "light" && <img className="shadow-2xl object-cover rounded-lg max-w-sm w-full" src="/fallback-cover.svg"/>}
                        />
                    </div>
                </div>
                <div className="space-y-6">
                    <article className="format dark:format-invert">
                        <h1 className="text-3xl lg:text-4xl font-bold mb-4">{data?.title || <Skeleton />}</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">by {data?.author_name?.[0] || <Skeleton className="w-1/2" />}</p>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold mb-3">Book Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Pages:</span>
                                    <span className="ml-2">
                                        {loading ? <Skeleton width={50} /> : (data?.number_of_pages_median || 'Unknown')}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">ISBN:</span>
                                    <span className="ml-2 font-mono">{id}</span>
                                </div>
                                {data?.first_publish_year && (
                                    <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">First Published:</span>
                                        <span className="ml-2">{data.first_publish_year}</span>
                                    </div>
                                )}
                                {data?.language && (
                                    <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Language:</span>
                                        <span className="ml-2">{data.language[0]?.toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="prose dark:prose-invert max-w-none">
                            <h3>Description</h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {description || <Skeleton count={4.5}/>}
                            </p>
                        </div>
                    </article>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <AddToReadingListButtton isbn={id} data={data} description={description} />
                        <OpenLibraryButton isbn={id} />
                    </div>
                </div>
            </div>
        </div>
        </AnimatedLayout>
    )
}

export default BookDetails  // Export for use in other modules
