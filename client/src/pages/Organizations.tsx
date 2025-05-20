import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PlusIcon, SearchIcon, BuildingIcon, Loader2 } from "lucide-react";
import { Organization } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const Organizations = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const filteredOrganizations = organizations?.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Organizations</h1>
          <Link href="/organizations/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Organization
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <Card>
          <CardHeader className="p-6">
            <CardTitle>Healthcare Organizations</CardTitle>
            <CardDescription>
              Manage all healthcare organizations in the system
            </CardDescription>
            <div className="mt-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-neutral-400" />
              </div>
              <Input
                placeholder="Search organizations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredOrganizations?.length === 0 ? (
              <div className="text-center p-8 text-neutral-500">
                {searchTerm
                  ? "No organizations found matching your search criteria"
                  : "No organizations found. Create your first organization to get started."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Billing Codes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations?.map((organization) => (
                      <TableRow key={organization.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-md bg-primary-50 text-primary flex items-center justify-center mr-3">
                              <BuildingIcon className="h-4 w-4" />
                            </div>
                            {organization.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {organization.city}, {organization.state}
                        </TableCell>
                        <TableCell>{organization.phone}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {organization.billingCodes.slice(0, 2).map((code, index) => (
                              <Badge key={index} variant="outline">
                                {code}
                              </Badge>
                            ))}
                            {organization.billingCodes.length > 2 && (
                              <Badge variant="outline">
                                +{organization.billingCodes.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/organizations/${organization.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Organizations;
