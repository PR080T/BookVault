import LibraryPane from '../components/Library/LibraryPane'  // Reusable UI component import
import WelcomeModal from '../components/WelcomeModal'  // Reusable UI component import
import QuickAddButton from '../components/QuickAddButton'  // Reusable UI component import
import AnimatedLayout from '../AnimatedLayout'

function Library() {
  return (  // JSX return statement
    <AnimatedLayout>
    <div className="container mx-auto ">
      <LibraryPane />
      <WelcomeModal />
      <QuickAddButton />
    </div>
    </AnimatedLayout>
  )
}

export default Library  // Export for use in other modules
