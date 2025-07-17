import { Avatar, Button, Label, TextInput, HR } from "flowbite-react";
import { RiMailLine, RiLockPasswordLine } from "react-icons/ri";

function AccountTab() {
    return (
        <div className="flex flex-col">
            <div className="flex flex-row justify-end">
                <Button disabled>Save</Button>
            </div>

            <div className="flex flex-row items-center justify-between">
                <Avatar size={"lg"} rounded/>
                <div className="flex flex-row gap-4">
                    <Button disabled>Upload picture</Button>
                    <Button disabled color="gray">Remove</Button>
                </div>
                
            </div>
            
            <HR />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="format lg:format-lg dark:format-invert">
                    <h4>Email</h4>
                </div>
                <div className="md:col-span-2">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <RiMailLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <TextInput 
                            id="email1" 
                            type="email" 
                            placeholder="name@example.com" 
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            <HR />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="format lg:format-lg dark:format-invert">
                    <h4>Change password</h4>
                </div>
                <div className="md:col-span-2 flex flex-col gap-4">
                    <div>
                        <Label htmlFor="password1">Old password</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <RiLockPasswordLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <TextInput id="password1" type="password" className="pl-10" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="password2">New password</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <RiLockPasswordLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <TextInput id="password2" type="password" className="pl-10" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="password3">Confirm new password</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <RiLockPasswordLine className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <TextInput id="password3" type="password" className="pl-10" />
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button>Change password</Button>
                    </div>
                </div>
            </div>
               
        </div>
    )
}

export default AccountTab