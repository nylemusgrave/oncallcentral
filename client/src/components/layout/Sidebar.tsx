import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { 
  HomeIcon, 
  BuildingIcon, 
  UsersIcon, 
  CalendarIcon, 
  MessageSquareIcon, 
  BarChartIcon, 
  SettingsIcon, 
  LogOutIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Organization } from "@shared/schema";
import { Separator } from "@/components/ui/separator";

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { currentOrganization, setCurrentOrganization } = useOrganization();

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const navItems = [
    { href: "/", icon: <HomeIcon className="mr-3 h-5 w-5" />, label: "Dashboard" },
    { href: "/organizations", icon: <BuildingIcon className="mr-3 h-5 w-5" />, label: "Organizations" },
    { href: "/physicians", icon: <UsersIcon className="mr-3 h-5 w-5" />, label: "Physicians" },
    { href: "/schedules", icon: <CalendarIcon className="mr-3 h-5 w-5" />, label: "Schedules" },
    { href: "/requests", icon: <MessageSquareIcon className="mr-3 h-5 w-5" />, label: "Requests" },
    { href: "/reports", icon: <BarChartIcon className="mr-3 h-5 w-5" />, label: "Reports" },
    { href: "/settings", icon: <SettingsIcon className="mr-3 h-5 w-5" />, label: "Settings" },
  ];

  const handleOrganizationChange = (org: Organization) => {
    setCurrentOrganization(org);
  };

  return (
    <div className="flex flex-col w-64 border-r border-neutral-200">
      <div className="h-16 flex items-center px-4 border-b border-neutral-200 bg-white">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold mr-2">
            OC
          </div>
          <span className="text-xl font-semibold text-primary">OnCallManager</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto pt-2 pb-4 bg-white">
        <div className="px-3 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-500">CURRENT ORGANIZATION</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-medium"
              >
                {currentOrganization?.name || "Select Organization"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-neutral-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {organizations?.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrganizationChange(org)}
                  className={currentOrganization?.id === org.id ? "bg-primary/10" : ""}
                >
                  {org.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location === item.href
                  ? "bg-primary/10 text-primary border-l-3 border-primary"
                  : "text-neutral-700 hover:bg-neutral-50"
              )}
            >
              {React.cloneElement(item.icon, {
                className: cn(
                  item.icon.props.className,
                  location === item.href 
                    ? "text-primary" 
                    : "text-neutral-500"
                )
              })}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 mt-auto">
          <Separator className="my-4" />
          <div className="flex items-center px-2">
            {/* Replace with actual user avatar */}
            <div className="h-8 w-8 rounded-full bg-neutral-300 flex items-center justify-center text-neutral-600">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500">{user?.role === 'admin' ? 'Administrator' : 'Physician'}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto p-1 text-neutral-400 hover:text-neutral-600"
              onClick={logout}
            >
              <LogOutIcon className="h-5 w-5" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
