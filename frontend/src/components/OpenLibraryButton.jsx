import { Button } from "flowbite-react";  // React library import
import { Link } from "react-router-dom";  // React library import
import { HiOutlineBuildingLibrary } from "react-icons/hi2";  // React library import

function OpenLibraryButton(props) {
  return (  // JSX return statement
    <Button as={Link} target="_blank" to={"https:  // openlibrary.org/search?q=" + props.isbn} color="light">
        <HiOutlineBuildingLibrary className="w-5 h-5 mr-2" />
        Open Library
    </Button>
  )
}

export default OpenLibraryButton  // Export for use in other modules
