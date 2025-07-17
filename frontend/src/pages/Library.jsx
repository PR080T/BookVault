import LibraryPane from '../components/Library/LibraryPane'
import WelcomeModal from '../components/WelcomeModal'
import QuickAddButton from '../components/QuickAddButton'
import AnimatedLayout from '../AnimatedLayout'

function Library() {
  return (
    <AnimatedLayout>
    <div className="container mx-auto ">
      <LibraryPane />
      <WelcomeModal />
      <QuickAddButton />
    </div>
    </AnimatedLayout>
  )
}

export default Library