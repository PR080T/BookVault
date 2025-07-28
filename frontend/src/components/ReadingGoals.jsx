import { useState, useEffect } from 'react';  // React library import
import { Card, Button, Modal, ModalBody, ModalHeader, ModalFooter, TextInput, Label, Progress } from "flowbite-react";  // React library import
import { RiFocus3Line, RiTrophyLine, RiEditLine } from "react-icons/ri";  // React library import
import { useStats } from '../contexts/StatsContext';

function ReadingGoals() {
    const [showModal, setShowModal] = useState(false);  // React state hook for component state management
    const [yearlyGoal, setYearlyGoal] = useState(12);  // Default goal of 12 books per year
    const { stats, loading } = useStats();
    const booksRead = stats.read;

    useEffect(() => {  // React effect hook for side effects
  // Load goal from localStorage
        const savedGoal = localStorage.getItem('readingGoal');
        if (savedGoal) {
            setYearlyGoal(parseInt(savedGoal));  // State update
        }
    }, []);

    const handleSaveGoal = () => {
        localStorage.setItem('readingGoal', yearlyGoal.toString());
        setShowModal(false);  // State update
    };

    const progressPercentage = Math.min((booksRead / yearlyGoal) * 100, 100);
    const isGoalAchieved = booksRead >= yearlyGoal;
    const currentYear = new Date().getFullYear();

    /**
     * Calculate reading schedule status
     * @returns {string} Schedule status message
     */
    const getScheduleStatus = () => {
        try {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const daysPassed = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
            
  // More accurate leap year calculation
            const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            const daysInYear = isLeapYear(now.getFullYear()) ? 366 : 365;
            
            const expectedBooks = Math.floor((daysPassed / daysInYear) * yearlyGoal);
            const difference = booksRead - expectedBooks;
            
            if (difference > 0) {
                return `You're ${difference} book${difference > 1 ? 's' : ''} ahead of schedule! 🚀`;
            } else if (difference < 0) {
                return `${Math.abs(difference)} book${Math.abs(difference) > 1 ? 's' : ''} behind schedule 📚`;
            } else {
                return "Right on track! 🎯";
            }
        } catch (error) {
            console.error('Error calculating schedule status:', error);
            return "Keep reading! 📖";
        }
    };

    if (loading) {
        return (  // JSX return statement
            <Card className="mb-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-200 dark:bg-blue-700 rounded"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </div>
            </Card>
        );
    }

    return (  // JSX return statement
        <>
            <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <RiFocus3Line className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {currentYear} Reading Goal
                        </h3>
                    </div>
                    <Button
                        size="xs"
                        color="gray"
                        onClick={() => setShowModal(true)}  // Event handler assignment
                        className="flex items-center gap-1"
                    >
                        <RiEditLine className="w-3 h-3" />
                        Edit
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {booksRead} of {yearlyGoal} books
                        </span>
                    </div>

                    <Progress
                        progress={progressPercentage}
                        size="lg"
                        color={isGoalAchieved ? "green" : "blue"}
                        className="mb-2"
                    />

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {isGoalAchieved ? (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <RiTrophyLine className="w-4 h-4" />
                                    <span className="font-medium">Goal achieved! 🎉</span>
                                </div>
                            ) : (
                                <span>
                                    {yearlyGoal - booksRead} books to go
                                </span>
                            )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {Math.round(progressPercentage)}%
                        </div>
                    </div>

                    {!isGoalAchieved && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getScheduleStatus()}
                        </div>
                    )}
                </div>
            </Card>

            <Modal show={showModal} onClose={() => setShowModal(false)} size="md">
                <ModalHeader>Set Reading Goal</ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="goal" className="mb-2 block">
                                How many books do you want to read in {currentYear}?
                            </Label>
                            <TextInput
                                id="goal"
                                type="number"
                                min="1"
                                max="365"
                                value={yearlyGoal}
                                onChange={(e) => setYearlyGoal(parseInt(e.target.value) || 1)}  // Event handler assignment
                                placeholder="Enter your reading goal"
                            />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>Setting a reading goal helps you stay motivated and track your progress throughout the year.</p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleSaveGoal}>Save Goal</Button>  // Event handler assignment
                    <Button color="gray" onClick={() => setShowModal(false)}>  // Event handler assignment
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}

export default ReadingGoals;  // Export for use in other modules
