import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertOrganizationSchema, 
  insertPhysicianSchema, 
  insertOrganizationPhysicianSchema,
  insertScheduleSchema,
  insertRequestSchema,
  insertUserSchema,
  userLoginSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== Authentication Routes =====
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const loginData = userLoginSchema.parse(req.body);
      const user = await storage.verifyUserCredentials(loginData.username, loginData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "An error occurred during login" });
    }
  });
  
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "An error occurred during registration" });
    }
  });
  
  app.post("/api/logout", async (req: Request, res: Response) => {
    return res.status(200).json({ message: "Logout successful" });
  });
  
  app.get("/api/user", async (req: Request, res: Response) => {
    // For demo purposes, we'll return a mock user to simulate authentication
    // In a real app, this would check session and return the actual user
    try {
      const user = await storage.getUser(1); // Admin user in demo data
      if (user) {
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      }
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching user data" });
    }
  });

  // ===== Organization Routes =====
  app.get("/api/organizations", async (_req: Request, res: Response) => {
    try {
      const organizations = await storage.getOrganizations();
      return res.status(200).json(organizations);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching organizations" });
    }
  });

  app.get("/api/organizations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      return res.status(200).json(organization);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching organization" });
    }
  });

  app.post("/api/organizations", async (req: Request, res: Response) => {
    try {
      const organizationData = insertOrganizationSchema.parse(req.body);
      const newOrganization = await storage.createOrganization(organizationData);
      return res.status(201).json(newOrganization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error creating organization" });
    }
  });

  app.put("/api/organizations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const organizationData = insertOrganizationSchema.partial().parse(req.body);
      const updatedOrganization = await storage.updateOrganization(id, organizationData);
      
      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      return res.status(200).json(updatedOrganization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error updating organization" });
    }
  });

  app.delete("/api/organizations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const success = await storage.deleteOrganization(id);
      if (!success) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      return res.status(200).json({ message: "Organization deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting organization" });
    }
  });

  // ===== Physician Routes =====
  app.get("/api/physicians", async (_req: Request, res: Response) => {
    try {
      const physicians = await storage.getPhysicians();
      return res.status(200).json(physicians);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching physicians" });
    }
  });

  app.get("/api/physicians/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid physician ID" });
      }
      
      const physician = await storage.getPhysician(id);
      if (!physician) {
        return res.status(404).json({ message: "Physician not found" });
      }
      
      return res.status(200).json(physician);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching physician" });
    }
  });

  app.get("/api/organizations/:id/physicians", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const physicians = await storage.getPhysiciansByOrganization(organizationId);
      return res.status(200).json(physicians);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching physicians for organization" });
    }
  });

  app.post("/api/physicians", async (req: Request, res: Response) => {
    try {
      const physicianData = insertPhysicianSchema.parse(req.body);
      const newPhysician = await storage.createPhysician(physicianData);
      return res.status(201).json(newPhysician);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error creating physician" });
    }
  });

  app.put("/api/physicians/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid physician ID" });
      }
      
      const physicianData = insertPhysicianSchema.partial().parse(req.body);
      const updatedPhysician = await storage.updatePhysician(id, physicianData);
      
      if (!updatedPhysician) {
        return res.status(404).json({ message: "Physician not found" });
      }
      
      return res.status(200).json(updatedPhysician);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error updating physician" });
    }
  });

  app.delete("/api/physicians/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid physician ID" });
      }
      
      const success = await storage.deletePhysician(id);
      if (!success) {
        return res.status(404).json({ message: "Physician not found" });
      }
      
      return res.status(200).json({ message: "Physician deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting physician" });
    }
  });

  // ===== Organization-Physician Assignment Routes =====
  app.post("/api/organization-physicians", async (req: Request, res: Response) => {
    try {
      const assignmentData = insertOrganizationPhysicianSchema.parse(req.body);
      const assignment = await storage.assignPhysicianToOrganization(assignmentData);
      return res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error assigning physician to organization" });
    }
  });

  app.delete("/api/organizations/:orgId/physicians/:physicianId", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.orgId);
      const physicianId = parseInt(req.params.physicianId);
      
      if (isNaN(organizationId) || isNaN(physicianId)) {
        return res.status(400).json({ message: "Invalid organization or physician ID" });
      }
      
      const success = await storage.removePhysicianFromOrganization(organizationId, physicianId);
      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      return res.status(200).json({ message: "Physician removed from organization successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error removing physician from organization" });
    }
  });

  app.get("/api/physicians/:id/organizations", async (req: Request, res: Response) => {
    try {
      const physicianId = parseInt(req.params.id);
      if (isNaN(physicianId)) {
        return res.status(400).json({ message: "Invalid physician ID" });
      }
      
      const organizations = await storage.getOrganizationsByPhysician(physicianId);
      return res.status(200).json(organizations);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching organizations for physician" });
    }
  });

  // ===== Schedule Routes =====
  app.get("/api/schedules", async (_req: Request, res: Response) => {
    try {
      const schedules = await storage.getSchedules();
      return res.status(200).json(schedules);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching schedules" });
    }
  });

  app.get("/api/organizations/:id/schedules", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const schedules = await storage.getSchedulesByOrganization(organizationId);
      return res.status(200).json(schedules);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching schedules for organization" });
    }
  });

  app.get("/api/physicians/:id/schedules", async (req: Request, res: Response) => {
    try {
      const physicianId = parseInt(req.params.id);
      if (isNaN(physicianId)) {
        return res.status(400).json({ message: "Invalid physician ID" });
      }
      
      const schedules = await storage.getSchedulesByPhysician(physicianId);
      return res.status(200).json(schedules);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching schedules for physician" });
    }
  });

  app.get("/api/organizations/:id/active-schedules", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
      
      const schedules = await storage.getActiveSchedules(organizationId, fromDate, toDate);
      return res.status(200).json(schedules);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching active schedules" });
    }
  });

  app.post("/api/schedules", async (req: Request, res: Response) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const newSchedule = await storage.createSchedule(scheduleData);
      return res.status(201).json(newSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error creating schedule" });
    }
  });

  app.put("/api/schedules/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const scheduleData = insertScheduleSchema.partial().parse(req.body);
      const updatedSchedule = await storage.updateSchedule(id, scheduleData);
      
      if (!updatedSchedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      return res.status(200).json(updatedSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error updating schedule" });
    }
  });

  app.delete("/api/schedules/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const success = await storage.deleteSchedule(id);
      if (!success) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      return res.status(200).json({ message: "Schedule deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting schedule" });
    }
  });

  // ===== Request Routes =====
  app.get("/api/requests", async (_req: Request, res: Response) => {
    try {
      const requests = await storage.getRequests();
      return res.status(200).json(requests);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching requests" });
    }
  });

  app.get("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      const request = await storage.getRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      return res.status(200).json(request);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching request" });
    }
  });

  app.get("/api/organizations/:id/requests", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const requests = await storage.getRequestsByOrganization(organizationId);
      return res.status(200).json(requests);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching requests for organization" });
    }
  });

  app.get("/api/physicians/:id/requests", async (req: Request, res: Response) => {
    try {
      const physicianId = parseInt(req.params.id);
      if (isNaN(physicianId)) {
        return res.status(400).json({ message: "Invalid physician ID" });
      }
      
      const requests = await storage.getRequestsByPhysician(physicianId);
      return res.status(200).json(requests);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching requests for physician" });
    }
  });

  app.get("/api/requests/status/:status", async (req: Request, res: Response) => {
    try {
      const status = req.params.status;
      const requests = await storage.getRequestsByStatus(status);
      return res.status(200).json(requests);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching requests by status" });
    }
  });

  app.post("/api/requests", async (req: Request, res: Response) => {
    try {
      const requestData = insertRequestSchema.parse(req.body);
      const newRequest = await storage.createRequest(requestData);
      return res.status(201).json(newRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error creating request" });
    }
  });

  app.put("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      const requestData = insertRequestSchema.partial().parse(req.body);
      const updatedRequest = await storage.updateRequest(id, requestData);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      return res.status(200).json(updatedRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error updating request" });
    }
  });

  app.put("/api/requests/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      const { status, note, userId } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedRequest = await storage.updateRequestStatus(id, status, note, userId);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      return res.status(200).json(updatedRequest);
    } catch (error) {
      return res.status(500).json({ message: "Error updating request status" });
    }
  });

  app.delete("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      const success = await storage.deleteRequest(id);
      if (!success) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      return res.status(200).json({ message: "Request deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting request" });
    }
  });

  // ===== User Routes =====
  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      // Don't send passwords in response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.get("/api/organizations/:id/users", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const users = await storage.getUsersByOrganization(organizationId);
      // Don't send passwords in response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching users for organization" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error creating user" });
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Error updating user" });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
