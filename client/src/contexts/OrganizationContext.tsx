import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Organization } from "@shared/schema";

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: null,
  setCurrentOrganization: () => {},
  isLoading: true,
});

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      console.log("OrganizationContext: fetchOrganizationData called, user:", user);
      
      if (!user) {
        console.log("OrganizationContext: No user, skipping organization fetch");
        setIsLoading(false);
        return;
      }

      if (user.organizationId) {
        console.log(`OrganizationContext: Fetching organization ${user.organizationId}`);
        try {
          const response = await fetch(`/api/organizations/${user.organizationId}`, {
            credentials: "include",
          });

          console.log("OrganizationContext: Organization fetch status:", response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log("OrganizationContext: Organization data received:", data);
            setCurrentOrganization(data);
          } else {
            console.log("OrganizationContext: Failed to fetch organization");
          }
        } catch (error) {
          console.error("Error fetching organization:", error);
        }
      } else {
        // If user has no organization, try to fetch the first one
        console.log("OrganizationContext: No organizationId, fetching all organizations");
        try {
          const response = await fetch(`/api/organizations`, {
            credentials: "include",
          });

          console.log("OrganizationContext: Organizations fetch status:", response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log("OrganizationContext: Organizations received:", data);
            if (data.length > 0) {
              console.log("OrganizationContext: Setting first organization");
              setCurrentOrganization(data[0]);
            } else {
              console.log("OrganizationContext: No organizations found");
            }
          } else {
            console.log("OrganizationContext: Failed to fetch organizations");
          }
        } catch (error) {
          console.error("Error fetching organizations:", error);
        }
      }
      
      console.log("OrganizationContext: Setting isLoading to false");
      setIsLoading(false);
    };

    fetchOrganizationData();
  }, [user]);

  return (
    <OrganizationContext.Provider
      value={{ currentOrganization, setCurrentOrganization, isLoading }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => useContext(OrganizationContext);
