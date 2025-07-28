import { memo } from 'react'  // React library import
import { Progress, Badge } from "flowbite-react";  // React library import
import { Link } from 'react-router-dom';  // React library import
import UpdateReadingStatusButton from '../UpdateReadingStatusButton';
import ActionsBookLibraryButton from '../ActionsBookLibraryButton';
import BookRating from './BookRating';
import Skeleton from 'react-loading-skeleton'  // React library import
import NotesIcon from '../NotesIcon';
import { Img } from 'react-image'  // React library import
import { useThemeMode } from 'flowbite-react';  // React library import

const BookItem = memo(function BookItem(props) {
    const theme = useThemeMode();
    
    return (  // JSX return statement
        <div className="group min-h-full flex flex-col card hover:scale-[1.02] md:flex-row md:max-w-md">
                <div className="relative overflow-hidden rounded-t-xl md:rounded-none md:rounded-s-xl">
                    <Img className="object-cover w-full h-96 md:h-auto md:w-24 group-hover:scale-105 transition-transform duration-300" src={"https:  // covers.openlibrary.org/b/isbn/" + props.isbn + "-L.jpg?default=false"}
                        loader={<Skeleton count={1} width={96} height={"100%"} borderRadius={0} inline={true}/>}
                        unloader={theme.mode == "dark" && <img className="object-fit w-full h-96 md:h-auto md:w-24" src="/fallback-cover-light.svg"/> || theme.mode == "light" && <img className="object-fit w-full h-96 md:h-auto md:w-24" src="/fallback-cover.svg"/>}
                    />
                    {props.showReadingStatusBadge &&
                        <div className="absolute top-3 right-3">
                            <Badge className="badge glass-effect text-xs font-semibold">{props.readingStatus}</Badge>
                        </div>
                    }
                </div>            
                <div className="flex flex-col p-6 leading-normal w-full space-y-4">
                    <Link to={"/books/" + props.isbn} className="hover:underline transition-colors duration-300 group">
                        <h5 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">{props.title}</h5>
                    </Link>
                    <p className="font-semibold text-slate-600 dark:text-slate-300">by {props.author || 'Unknown Author'}</p>



                    {props.showProgress &&
                        <div className="space-y-3">
                            <Progress 
                                className="mb-2" 
                                progress={props.totalPages === 0 ? 0 : Math.round((100 * props.currentPage) / props.totalPages)} 
                                size="md" 
                                labelProgress 
                                textLabel="Reading progress" 
                                labelText 
                                textLabelPosition="outside" 
                                progressLabelPosition="outside" 
                            />
                            <div className='flex flex-row items-center gap-2'>
                                <div className="grow">
                                    <UpdateReadingStatusButton currentPage={props.currentPage} totalPages={props.totalPages} id={props.internalID} title={props.title} rating={props.rating} onSucess={props.onReadingStatusChanged}/>
                                </div>
                                <ActionsBookLibraryButton id={props.internalID} onSuccess={props.onReadingStatusChanged} allowNoteEditing={props.allowNoteEditing} totalPages={props.totalPages}/>
                            </div>
                        </div>
                    }
                    
                    <div className="flex flex-row justify-between items-center pt-2">
                        {props.showRating &&
                            <BookRating id={props.internalID} title={props.title} rating={props.rating} disableGiveRating={props.disableGiveRating} onSuccess={props.onReadingStatusChanged} />
                        }
                        {props.showNotes &&
                            (props.notes > 0 &&
                                <NotesIcon id={props.internalID} notes={props.notes} overrideNotes={props.overrideNotes} allowNoteEditing={props.allowNoteEditing}/>
                            )
                        }
                    </div>
                    
                    {props.showOptions &&
                        <div className="flex flex-row-reverse pt-2">
                            <ActionsBookLibraryButton id={props.internalID} onSuccess={props.onReadingStatusChanged} allowNoteEditing={props.allowNoteEditing} totalPages={props.totalPages}/>
                        </div>
                    }
                </div>
        </div>
    )
});

BookItem.defaultProps = {
    showProgress: true,
    showOptions: true,
    showReadingStatusBadge: false,
    showRating: true,
    disableGiveRating: false,
    showNotes:true,
    overrideNotes: undefined,
    allowNoteEditing: true,
}

export default memo(BookItem)  // Export for use in other modules
