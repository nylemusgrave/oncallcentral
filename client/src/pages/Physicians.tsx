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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, SearchIcon, UserIcon, Loader2 } from "lucide-react";
import { Physician, Organization } from "@shared/schema";
import { useOrganization } from "@/contexts/OrganizationContext";

const Physicians = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: physicians, isLoading: loadingPhysicians } = useQuery<Physician[]>({
    queryKey: ["/api/physicians"],
  });

  const { data: organizationPhysicians, isLoading: loadingOrgPhysicians } = useQuery<Physician[]>({
    queryKey: ["/api/organizations", orgId, "physicians"],
    enabled: !!orgId,
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const getOrganizationsForPhysician = (physicianId: number) => {
    if (!organizations || !organizationPhysicians) {
      return [];
    }
    
    const physicianOrgs = organizations.filter((org) => {
      return organizationPhysicians.some(
        (p) => p.id === physicianId && currentOrganization?.id === org.id
      );
    });
    return physicianOrgs || [];
  };

  const displayPhysicians = orgId ? organizationPhysicians : physicians;
  
  const filteredPhysicians = displayPhysicians?.filter(
    (physician) =>
      physician.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
  );

  const isLoading = loadingPhysicians || (orgId && loadingOrgPhysicians);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Physicians</h1>
          <Link href="/physicians/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Physician
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <Card>
          <CardHeader className="p-6">
            <CardTitle>Physician Directory</CardTitle>
            <CardDescription>
              {orgId
                ? `Physicians affiliated with ${currentOrganization?.name}`
                : "All physicians in the system"}
            </CardDescription>
            <div className="mt-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-neutral-400" />
              </div>
              <Input
                placeholder="Search physicians..."
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
            ) : filteredPhysicians?.length === 0 ? (
              <div className="text-center p-8 text-neutral-500">
                {searchTerm
                  ? "No physicians found matching your search criteria"
                  : "No physicians found. Add your first physician to get started."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Credentials</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPhysicians?.map((physician) => (
                      <TableRow key={physician.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center mr-3">
                              <UserIcon className="h-4 w-4" />
                            </div>
                            Dr. {physician.firstName} {physician.lastName}
                          </div>
                        </TableCell>
                        <TableCell>{physician.specialty}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{physician.email}</div>
                            <div className="text-sm text-neutral-500">
                              {physician.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {physician.credentials?.map((credential, index) => (
                              <Badge key={index} variant="outline">
                                {credential}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getOrganizationsForPhysician(physician.id)?.map((org) => (
                            <Badge key={org.id} variant="secondary" className="mr-1">
                              {org.name}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/physicians/${physician.id}`}>
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

export default Physicians;
