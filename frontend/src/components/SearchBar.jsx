import { useState, useEffect, useMemo, useCallback } from "react";  // React library import
import axios from "axios";  // HTTP client for API calls
import { debounce } from 'lodash';

import { Link, useNavigate } from "react-router-dom";  // React library import
import Skeleton from 'react-loading-skeleton'  // React library import
import 'react-loading-skeleton/dist/skeleton.css'  // React library import
import { RiSearch2Line } from "react-icons/ri";  // React library import
import ESCIcon from "./ESCIcon";
import { Img } from 'react-image'  // React library import
import { RiErrorWarningLine } from "react-icons/ri";  // React library import
import { HR } from "flowbite-react";  // React library import
import { useThemeMode } from 'flowbite-react';  // React library import

function SearchBar(props) {
    const [searchTerm, setSearchTerm] = useState('');  // React state hook for component state management
    const [suggestions, setSuggestions] = useState([{id: 0, name: ""}]);  // React state hook for component state management
    const [noSuggestionsFound, setNoSuggestionsFound] = useState(false);  // React state hook for component state management
    const [loading, setLoading] = useState(false);  // React state hook for component state management
    const [showList, setShowList] = useState(false);  // React state hook for component state management
    const loadingPlaceholder = [0,1,2,3,4,5]
    const [onError, setOnError] = useState(false);  // React state hook for component state management
    const [errorMessage, setErrorMessage] = useState();  // React state hook for component state management
    let navigate = useNavigate();  // React Router hook for programmatic navigation
    const theme = useThemeMode();

    const fetchSuggestions = useCallback((searchTerm) => {
      if (searchTerm && searchTerm.trim().length >= 2) {
        setLoading(true);  // State update
        setOnError(false);  // State update
        setErrorMessage();  // State update
        
        axios.get(`https:  // openlibrary.org/search.json?q=${encodeURIComponent(searchTerm.trim())}&limit=10&offset=0&fields=title,isbn,author_name,key,cover_i,first_publish_year&lang=en`)
        .then(response => {
            let newArray = []
            for (let i = 0; i < response.data.docs.length; i++) {
                const book = response.data.docs[i];
                if (book.isbn && book.isbn.length > 0) {
                    newArray.push({
                        id: i, 
                        name: book.title || 'Unknown Title',
                        isbn: book.isbn[0], 
                        author: book.author_name ? book.author_name[0] : 'Unknown Author',
                        cover: book.cover_i,
                        year: book.first_publish_year
                    })
                }
            }
            setSuggestions(newArray);  // State update
            setLoading(false);  // State update
            setShowList(true);  // State update
            setNoSuggestionsFound(newArray.length === 0);  // State update
        })
        .catch(error => {
            setLoading(false);  // State update
            setOnError(true);  // State update
            setErrorMessage(error.response?.status || error.code || 'Network Error');  // State update
            console.error('Error fetching suggestions:', error);
        });
      } else if (searchTerm.trim().length < 2) {
        setSuggestions([]);  // State update
        setLoading(false);  // State update
        setShowList(false);  // State update
        setNoSuggestionsFound(false);  // State update
      }
    }, []);

    useEffect(() => {  // React effect hook for side effects
        if (searchTerm.trim() === '') {
            setSuggestions([]);  // State update
            setLoading(false);  // State update
            setShowList(false);  // State update
        } 
    }, [searchTerm]);

    const changeHandler = useCallback((e) => {
        if (e.target.value) {
            setLoading(true);  // State update
            setShowList(true);  // State update
            setOnError(false);  // State update
            setErrorMessage();  // State update
            fetchSuggestions(e.target.value)
        }
    }, [fetchSuggestions]);

    const debouncedChangeHandler = useMemo(
        () => debounce(changeHandler, 300),
        [changeHandler]
    );

  // Cleanup debounced function on unmount
    useEffect(() => {  // React effect hook for side effects
        return () => {  // JSX return statement
            debouncedChangeHandler.cancel();
        };
    }, [debouncedChangeHandler]);

    return (  // JSX return statement
        <div>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <RiSearch2Line className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                    id="search"
                    type="text"
                    placeholder="Search for a book by title, author, or ISBN"
                    onChange={(e) => (debouncedChangeHandler(e), setSearchTerm(e.target.value))}  // Event handler assignment
                    value={searchTerm}
                    aria-label="Search for books"
                    aria-describedby="search-results"
                    autoComplete="off"
                    className="block w-full pl-10 pr-16 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-200"
                />
                {!props.hideESCIcon && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 z-10">
                        <ESCIcon />
                    </div>
                )}
            </div>
            <div 
                id="search-results"
                className={`${showList? "block": "hidden"} ${props.absolute? "absolute max-w-md": "relative"} z-50 bg-white dark:bg-gray-800 mt-2 overflow-y-auto md:max-h-96 max-h-80 min-w-full rounded-lg shadow-xl border border-gray-200 dark:border-gray-700`}
                role="listbox"
                aria-label="Search results"
            >
                {loading ? (
                     loadingPlaceholder.map(function(item, index) {
                        return (  // JSX return statement
                            <div key={index} className="p-4">
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                                    <div className="lg:col-span-1 flex justify-center lg:justify-start">
                                        <Skeleton count={1} height={128} width={80} borderRadius={6} />
                                    </div>
                                    <div className="lg:col-span-3 space-y-2">
                                        <Skeleton count={1} height={20} width={"90%"} />
                                        <Skeleton count={1} height={16} width={"70%"} />
                                        <Skeleton count={1} height={14} width={"60%"} />
                                        <Skeleton count={1} height={14} width={"50%"} />
                                    </div>
                                </div>
                                {index < loadingPlaceholder.length - 1 && <HR />}
                            </div>
                        )
                    })
                    
                ): (
                    suggestions?.map(function(data) {
                        return (  // JSX return statement
                            <Link 
                                key={data.id} 
                                to={"/books/" + data.isbn} 
                                onClick={() => (props.onNavigate(), navigate("/books/" + data.isbn))}  // Event handler assignment
                                className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg"
                                role="option"
                                aria-label={`${data.name} by ${data.author}, published ${data.year || 'unknown year'}`}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                                    <div className="lg:col-span-1 flex justify-center lg:justify-start">
                                        <Img className="object-contain h-32 w-20 rounded-md shadow-sm" src={"https:  // covers.openlibrary.org/b/isbn/" + data.isbn + "-M.jpg?default=false"}
                                            loader={<Skeleton count={1} width={80} height={128} borderRadius={6} inline={true}/>}
                                            unloader={theme.mode == "dark" && <img className="object-contain h-32 w-20 rounded-md" src="/fallback-cover-light.svg"/> || theme.mode == "light" && <img className="object-contain h-32 w-20 rounded-md" src="/fallback-cover.svg"/>}
                                        />
                                    </div>
                                    <div className="lg:col-span-3">
                                        <div className="flex flex-col gap-2 dark:text-white">
                                            <h3 className="font-bold text-base leading-tight line-clamp-2 text-gray-900 dark:text-white">{data.name}</h3>
                                            <p className="font-medium text-sm text-gray-600 dark:text-gray-300">by {data.author}</p>
                                            <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <p><span className="font-medium">ISBN:</span> {data.isbn}</p>
                                                {data.year && <p><span className="font-medium">Published:</span> {data.year}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
                {noSuggestionsFound &&
                <div className="flex flex-col justify-center items-center text-center gap-4 pb-8">
                    <RiSearch2Line size={96} className="dark:text-white"/>
                    <div className="format lg:format-lg dark:format-invert">
                        <h2>No results found</h2>
                        <p>Try searching for a different title or isbn.</p>
                    </div>
                </div>
                }
                {onError &&
                <div className="flex flex-col justify-center items-center text-center gap-4 pb-8">
                    <RiErrorWarningLine size={96} className="dark:text-white"/>
                    <div className="format lg:format-lg dark:format-invert">
                        <h2>Something went wrong</h2>
                        <p>Try again later.</p>
                        <p className="text-xs">{errorMessage}. <a href={"https:  // github.com/Mozzo1000/booklogr/wiki/Error-messages#" + String(errorMessage).toLowerCase()}>Learn more</a></p>
                        
                    </div>
                </div>
                }
            </div>
            {props.showAttribution &&
                <p className="format dark:format-invert pt-2 ml-2 text-xs text-gray-500 font">Search powered by <a href="https:  // openlibrary.org" target="_blank">OpenLibrary</a></p>
            }
        </div>
    )
}

SearchBar.defaultProps = {
    absolute: true,
    hideESCIcon: true,
    showAttribution: true
  }
export default SearchBar  // Export for use in other modules
