import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserPlusIcon, 
  MessageSquarePlusIcon, 
  CalendarPlusIcon, 
  FileBarChartIcon 
} from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      title: "Add Physician",
      description: "Register a new physician in the system",
      icon: <UserPlusIcon className="h-6 w-6" />,
      href: "/physicians/new",
      bgColor: "bg-primary-50",
      textColor: "text-primary"
    },
    {
      title: "Create Request",
      description: "Start a new on-call request",
      icon: <MessageSquarePlusIcon className="h-6 w-6" />,
      href: "/requests/new",
      bgColor: "bg-secondary-50",
      textColor: "text-secondary-500"
    },
    {
      title: "Edit Schedule",
      description: "Modify on-call rotation schedule",
      icon: <CalendarPlusIcon className="h-6 w-6" />,
      href: "/schedules",
      bgColor: "bg-primary-50",
      textColor: "text-primary"
    },
    {
      title: "Run Report",
      description: "Generate activity and performance reports",
      icon: <FileBarChartIcon className="h-6 w-6" />,
      href: "/reports",
      bgColor: "bg-secondary-50",
      textColor: "text-secondary-500"
    }
  ];

  return (
    <div className="mt-8 pb-12">
      <h3 className="text-lg font-medium text-neutral-900">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center h-full">
                  <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md ${action.bgColor} ${action.textColor}`}>
                    {action.icon}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-neutral-900">{action.title}</h3>
                    <p className="mt-1 text-xs text-neutral-500">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
