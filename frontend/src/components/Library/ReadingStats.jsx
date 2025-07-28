import { RiBook2Line, RiBookOpenLine, RiBookmarkLine, RiTrophyLine } from "react-icons/ri";  // React library import
import { useStats } from '../../contexts/StatsContext';

function ReadingStats() {
    const { stats, loading } = useStats();

    if (loading) {
        return (  // JSX return statement
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { color: 'bg-green-50 dark:bg-green-900/20', iconColor: 'bg-green-200 dark:bg-green-700' },
                    { color: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'bg-blue-200 dark:bg-blue-700' },
                    { color: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'bg-purple-200 dark:bg-purple-700' },
                    { color: 'bg-gray-50 dark:bg-gray-800', iconColor: 'bg-gray-200 dark:bg-gray-700' }
                ].map((item, i) => (
                    <div key={i} className={`${item.color} rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse`}>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-20"></div>
                                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                            </div>
                            <div className={`w-8 h-8 ${item.iconColor} rounded`}></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const statItems = [
        {
            label: 'Books Read',
            value: stats.read,
            icon: RiTrophyLine,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-900/20'
        },
        {
            label: 'Currently Reading',
            value: stats.currentlyReading,
            icon: RiBookOpenLine,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            label: 'Want to Read',
            value: stats.toRead,
            icon: RiBookmarkLine,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20'
        },
        {
            label: 'Total Books',
            value: stats.total,
            icon: RiBook2Line,
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-50 dark:bg-gray-800'
        }
    ];

    return (  // JSX return statement
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statItems.map((item, index) => (
                <div key={index} className={`${item.bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                {item.label}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {item.value}
                            </p>
                        </div>
                        <item.icon className={`w-8 h-8 ${item.color}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ReadingStats;  // Export for use in other modules
