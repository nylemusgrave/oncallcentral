import { useState } from "react";
import { 
  BellIcon, 
  HelpCircleIcon, 
  MenuIcon,
  XIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Sidebar from "./Sidebar";

interface TopNavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

const TopNavbar = ({ setSidebarOpen }: TopNavbarProps) => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-neutral-200">
      <Button 
        variant="ghost" 
        className="md:hidden px-4 text-neutral-500" 
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-6 w-6" />
      </Button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="max-w-lg w-full">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-neutral-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-md text-sm placeholder-neutral-500"
                placeholder="Search physicians, requests, or patients"
                type="search"
              />
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <Button
            variant="ghost"
            size="icon"
            className="p-1 rounded-full text-neutral-500 hover:text-neutral-600"
          >
            <span className="sr-only">View notifications</span>
            <div className="relative">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            </div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-3 p-1 rounded-full text-neutral-500 hover:text-neutral-600"
            onClick={() => setShowHelpModal(true)}
          >
            <span className="sr-only">Help</span>
            <HelpCircleIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile sidebar dialog */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Help & Support</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowHelpModal(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Welcome to OnCallManager, your all-in-one solution for managing on-call physicians in your healthcare organization.
            </p>
            <div className="bg-neutral-50 p-3 rounded-md">
              <h3 className="font-medium text-sm mb-2">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-primary hover:underline cursor-pointer">How to create a new on-call request</li>
                <li className="text-primary hover:underline cursor-pointer">Managing physician schedules</li>
                <li className="text-primary hover:underline cursor-pointer">Generating reports</li>
                <li className="text-primary hover:underline cursor-pointer">System requirements</li>
              </ul>
            </div>
            <div className="bg-neutral-50 p-3 rounded-md">
              <h3 className="font-medium text-sm mb-2">Contact Support</h3>
              <p className="text-sm text-neutral-600 mb-2">
                Need additional help? Our support team is available Monday-Friday, 9AM-5PM ET.
              </p>
              <p className="text-sm">
                <strong>Email:</strong> support@oncallmanager.com
              </p>
              <p className="text-sm">
                <strong>Phone:</strong> 1-800-555-CALL
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopNavbar;
