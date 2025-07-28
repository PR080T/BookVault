import { Tabs, TabItem} from "flowbite-react";  // React library import
import { RiAccountCircleLine, RiDatabase2Line, RiMastodonLine } from "react-icons/ri";  // React library import
import DataTab from '../components/Data/DataTab';  // Reusable UI component import
import AccountTab from '../components/AccountTab';  // Reusable UI component import
import AnimatedLayout from '../AnimatedLayout';
import MastodonTab from '../components/MastodonTab';  // Reusable UI component import

function Settings() {
    return (  // JSX return statement
        <AnimatedLayout>
        <div className="container mx-auto ">
            <article className="format lg:format-lg pb-2 dark:format-invert">
                <h2>Settings</h2>
            </article>
            <Tabs aria-label="Tabs with underline" variant="underline" className="pt-1">
                <TabItem title="Account" icon={RiAccountCircleLine }>
                    <AccountTab />
                </TabItem>
                <TabItem title="Mastodon" icon={RiMastodonLine}>
                    <MastodonTab />
                </TabItem>
                <TabItem title="Data" icon={RiDatabase2Line }>
                    <DataTab />
                </TabItem>
            </Tabs>
        </div>
        </AnimatedLayout>
    )
}

export default Settings  // Export for use in other modules
