import {
  Organization,
  InsertOrganization,
  Physician,
  InsertPhysician,
  OrganizationPhysician,
  InsertOrganizationPhysician,
  Schedule,
  InsertSchedule,
  Request,
  InsertRequest,
  User,
  InsertUser,
  StatusHistoryEntry
} from "@shared/schema";

export interface IStorage {
  // Organization methods
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: number): Promise<boolean>;

  // Physician methods
  getPhysicians(): Promise<Physician[]>;
  getPhysician(id: number): Promise<Physician | undefined>;
  getPhysiciansByOrganization(organizationId: number): Promise<Physician[]>;
  createPhysician(physician: InsertPhysician): Promise<Physician>;
  updatePhysician(id: number, physician: Partial<InsertPhysician>): Promise<Physician | undefined>;
  deletePhysician(id: number): Promise<boolean>;

  // Organization-Physician methods
  assignPhysicianToOrganization(data: InsertOrganizationPhysician): Promise<OrganizationPhysician>;
  removePhysicianFromOrganization(organizationId: number, physicianId: number): Promise<boolean>;
  getOrganizationsByPhysician(physicianId: number): Promise<Organization[]>;

  // Schedule methods
  getSchedules(): Promise<Schedule[]>;
  getSchedulesByOrganization(organizationId: number): Promise<Schedule[]>;
  getSchedulesByPhysician(physicianId: number): Promise<Schedule[]>;
  getActiveSchedules(organizationId: number, from?: Date, to?: Date): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;

  // Request methods
  getRequests(): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  getRequestsByOrganization(organizationId: number): Promise<Request[]>;
  getRequestsByPhysician(physicianId: number): Promise<Request[]>;
  getRequestsByStatus(status: string): Promise<Request[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: number, request: Partial<InsertRequest>): Promise<Request | undefined>;
  updateRequestStatus(id: number, status: string, note?: string, userId?: number): Promise<Request | undefined>;
  deleteRequest(id: number): Promise<boolean>;

  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByOrganization(organizationId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  verifyUserCredentials(username: string, password: string): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private organizations: Map<number, Organization>;
  private physicians: Map<number, Physician>;
  private organizationPhysicians: Map<number, OrganizationPhysician>;
  private schedules: Map<number, Schedule>;
  private requests: Map<number, Request>;
  private users: Map<number, User>;
  
  private orgCurrentId: number;
  private physicianCurrentId: number;
  private orgPhysicianCurrentId: number;
  private scheduleCurrentId: number;
  private requestCurrentId: number;
  private userCurrentId: number;

  constructor() {
    this.organizations = new Map();
    this.physicians = new Map();
    this.organizationPhysicians = new Map();
    this.schedules = new Map();
    this.requests = new Map();
    this.users = new Map();
    
    this.orgCurrentId = 1;
    this.physicianCurrentId = 1;
    this.orgPhysicianCurrentId = 1;
    this.scheduleCurrentId = 1;
    this.requestCurrentId = 1;
    this.userCurrentId = 1;
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  // Organization methods
  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const id = this.orgCurrentId++;
    const newOrg: Organization = {
      ...organization,
      id,
      createdAt: new Date(),
    };
    this.organizations.set(id, newOrg);
    return newOrg;
  }

  async updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const existingOrg = this.organizations.get(id);
    if (!existingOrg) return undefined;

    const updatedOrg: Organization = {
      ...existingOrg,
      ...organization,
    };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  async deleteOrganization(id: number): Promise<boolean> {
    return this.organizations.delete(id);
  }

  // Physician methods
  async getPhysicians(): Promise<Physician[]> {
    return Array.from(this.physicians.values());
  }

  async getPhysician(id: number): Promise<Physician | undefined> {
    return this.physicians.get(id);
  }

  async getPhysiciansByOrganization(organizationId: number): Promise<Physician[]> {
    const orgPhysicians = Array.from(this.organizationPhysicians.values())
      .filter(op => op.organizationId === organizationId);
    
    return orgPhysicians.map(op => this.physicians.get(op.physicianId))
      .filter((p): p is Physician => p !== undefined);
  }

  async createPhysician(physician: InsertPhysician): Promise<Physician> {
    const id = this.physicianCurrentId++;
    const newPhysician: Physician = {
      ...physician,
      id,
      createdAt: new Date(),
    };
    this.physicians.set(id, newPhysician);
    return newPhysician;
  }

  async updatePhysician(id: number, physician: Partial<InsertPhysician>): Promise<Physician | undefined> {
    const existingPhysician = this.physicians.get(id);
    if (!existingPhysician) return undefined;

    const updatedPhysician: Physician = {
      ...existingPhysician,
      ...physician,
    };
    this.physicians.set(id, updatedPhysician);
    return updatedPhysician;
  }

  async deletePhysician(id: number): Promise<boolean> {
    return this.physicians.delete(id);
  }

  // Organization-Physician methods
  async assignPhysicianToOrganization(data: InsertOrganizationPhysician): Promise<OrganizationPhysician> {
    const id = this.orgPhysicianCurrentId++;
    const newOrgPhysician: OrganizationPhysician = {
      ...data,
      id,
    };
    this.organizationPhysicians.set(id, newOrgPhysician);
    return newOrgPhysician;
  }

  async removePhysicianFromOrganization(organizationId: number, physicianId: number): Promise<boolean> {
    const orgPhysician = Array.from(this.organizationPhysicians.values())
      .find(op => op.organizationId === organizationId && op.physicianId === physicianId);
    
    if (!orgPhysician) return false;
    return this.organizationPhysicians.delete(orgPhysician.id);
  }

  async getOrganizationsByPhysician(physicianId: number): Promise<Organization[]> {
    const orgPhysicians = Array.from(this.organizationPhysicians.values())
      .filter(op => op.physicianId === physicianId);
    
    return orgPhysicians.map(op => this.organizations.get(op.organizationId))
      .filter((o): o is Organization => o !== undefined);
  }

  // Schedule methods
  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedulesByOrganization(organizationId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values())
      .filter(s => s.organizationId === organizationId);
  }

  async getSchedulesByPhysician(physicianId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values())
      .filter(s => s.physicianId === physicianId);
  }

  async getActiveSchedules(organizationId: number, from?: Date, to?: Date): Promise<Schedule[]> {
    return Array.from(this.schedules.values())
      .filter(s => {
        if (s.organizationId !== organizationId || !s.isActive) return false;
        
        if (from && to) {
          return new Date(s.startTime) <= to && new Date(s.endTime) >= from;
        }
        
        return true;
      });
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleCurrentId++;
    const newSchedule: Schedule = {
      ...schedule,
      id,
      createdAt: new Date(),
    };
    this.schedules.set(id, newSchedule);
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const existingSchedule = this.schedules.get(id);
    if (!existingSchedule) return undefined;

    const updatedSchedule: Schedule = {
      ...existingSchedule,
      ...schedule,
    };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }

  // Request methods
  async getRequests(): Promise<Request[]> {
    return Array.from(this.requests.values());
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async getRequestsByOrganization(organizationId: number): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter(r => r.organizationId === organizationId);
  }

  async getRequestsByPhysician(physicianId: number): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter(r => r.physicianId === physicianId);
  }

  async getRequestsByStatus(status: string): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter(r => r.status === status);
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const id = this.requestCurrentId++;
    const now = new Date();
    
    const statusHistory: StatusHistoryEntry[] = [{
      status: request.status || "pending",
      timestamp: now.toISOString(),
    }];
    
    const newRequest: Request = {
      ...request,
      id,
      createdAt: now,
      updatedAt: now,
      statusHistory,
    };
    this.requests.set(id, newRequest);
    return newRequest;
  }

  async updateRequest(id: number, request: Partial<InsertRequest>): Promise<Request | undefined> {
    const existingRequest = this.requests.get(id);
    if (!existingRequest) return undefined;

    // If status is changing, update the status history
    if (request.status && request.status !== existingRequest.status) {
      const statusEntry: StatusHistoryEntry = {
        status: request.status,
        timestamp: new Date().toISOString(),
      };
      existingRequest.statusHistory.push(statusEntry);
    }

    const updatedRequest: Request = {
      ...existingRequest,
      ...request,
      updatedAt: new Date(),
    };
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  async updateRequestStatus(id: number, status: string, note?: string, userId?: number): Promise<Request | undefined> {
    const existingRequest = this.requests.get(id);
    if (!existingRequest) return undefined;

    const statusEntry: StatusHistoryEntry = {
      status,
      timestamp: new Date().toISOString(),
      note,
      userId,
    };

    const updatedRequest: Request = {
      ...existingRequest,
      status,
      updatedAt: new Date(),
      statusHistory: [...existingRequest.statusHistory, statusEntry],
    };
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteRequest(id: number): Promise<boolean> {
    return this.requests.delete(id);
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values())
      .find(u => u.username === username);
  }

  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(u => u.organizationId === organizationId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      ...user,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async verifyUserCredentials(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user || user.password !== password) return undefined;
    return user;
  }

  // Initialize with demo data
  private initializeDemoData() {
    // Create demo organizations
    const org1: Organization = {
      id: this.orgCurrentId++,
      name: "Memorial Healthcare",
      address: "123 Main St",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      phone: "555-123-4567",
      email: "admin@memorialhealthcare.com",
      billingCodes: ["MH-001", "MH-002", "MH-003"],
      createdAt: new Date(),
    };
    
    const org2: Organization = {
      id: this.orgCurrentId++,
      name: "City General Hospital",
      address: "456 Oak Ave",
      city: "Riverside",
      state: "CA",
      zip: "92501",
      phone: "555-987-6543",
      email: "admin@citygeneralhospital.com",
      billingCodes: ["CGH-001", "CGH-002"],
      createdAt: new Date(),
    };
    
    this.organizations.set(org1.id, org1);
    this.organizations.set(org2.id, org2);
    
    // Create demo physicians
    const physician1: Physician = {
      id: this.physicianCurrentId++,
      firstName: "Robert",
      lastName: "Chen",
      specialty: "Cardiology",
      phone: "555-111-2222",
      email: "robert.chen@example.com",
      credentials: ["MD", "FACC"],
      createdAt: new Date(),
    };
    
    const physician2: Physician = {
      id: this.physicianCurrentId++,
      firstName: "Lisa",
      lastName: "Wong",
      specialty: "Neurology",
      phone: "555-222-3333",
      email: "lisa.wong@example.com",
      credentials: ["MD", "PhD"],
      createdAt: new Date(),
    };
    
    const physician3: Physician = {
      id: this.physicianCurrentId++,
      firstName: "Sarah",
      lastName: "Miller",
      specialty: "Internal Medicine",
      phone: "555-333-4444",
      email: "sarah.miller@example.com",
      credentials: ["MD"],
      createdAt: new Date(),
    };
    
    const physician4: Physician = {
      id: this.physicianCurrentId++,
      firstName: "Michael",
      lastName: "Brown",
      specialty: "Oncology",
      phone: "555-444-5555",
      email: "michael.brown@example.com",
      credentials: ["MD", "PhD"],
      createdAt: new Date(),
    };
    
    this.physicians.set(physician1.id, physician1);
    this.physicians.set(physician2.id, physician2);
    this.physicians.set(physician3.id, physician3);
    this.physicians.set(physician4.id, physician4);
    
    // Assign physicians to organizations
    this.assignPhysicianToOrganization({ organizationId: org1.id, physicianId: physician1.id });
    this.assignPhysicianToOrganization({ organizationId: org1.id, physicianId: physician2.id });
    this.assignPhysicianToOrganization({ organizationId: org1.id, physicianId: physician3.id });
    this.assignPhysicianToOrganization({ organizationId: org1.id, physicianId: physician4.id });
    this.assignPhysicianToOrganization({ organizationId: org2.id, physicianId: physician1.id });
    this.assignPhysicianToOrganization({ organizationId: org2.id, physicianId: physician3.id });
    
    // Create demo schedules (today's on-call and future schedules)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Create dates for the next two weeks
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    
    // 8 AM to 8 PM shift
    const morningStart = new Date(today);
    morningStart.setHours(8, 0, 0, 0);
    
    const eveningEnd = new Date(today);
    eveningEnd.setHours(20, 0, 0, 0);
    
    // 6 PM to 8 AM shift
    const eveningStart = new Date(today);
    eveningStart.setHours(18, 0, 0, 0);
    
    const morningEnd = new Date(tomorrow);
    morningEnd.setHours(8, 0, 0, 0);
    
    // Today's day shifts
    this.createSchedule({
      organizationId: org1.id,
      physicianId: physician1.id,
      startTime: morningStart,
      endTime: eveningEnd,
      title: "Day Shift - Cardiology",
      description: "Primary on-call for cardiology department",
      isActive: true,
    });
    
    this.createSchedule({
      organizationId: org1.id,
      physicianId: physician2.id,
      startTime: morningStart,
      endTime: eveningEnd,
      title: "Day Shift - Neurology",
      description: "Primary on-call for neurology department",
      isActive: true,
    });
    
    this.createSchedule({
      organizationId: org1.id,
      physicianId: physician3.id,
      startTime: morningStart,
      endTime: eveningEnd,
      title: "Day Shift - Internal Medicine",
      description: "Primary on-call for internal medicine department",
      isActive: true,
    });
    
    // Today's night shift
    this.createSchedule({
      organizationId: org1.id,
      physicianId: physician4.id,
      startTime: eveningStart,
      endTime: morningEnd,
      title: "Night Shift - Oncology",
      description: "Primary on-call for oncology department",
      isActive: true,
    });
    
    // Tomorrow's day shifts
    const tomorrowMorningStart = new Date(tomorrow);
    tomorrowMorningStart.setHours(8, 0, 0, 0);
    
    const tomorrowEveningEnd = new Date(tomorrow);
    tomorrowEveningEnd.setHours(20, 0, 0, 0);
    
    this.createSchedule({
      organizationId: org1.id,
      physicianId: physician2.id,
      startTime: tomorrowMorningStart,
      endTime: tomorrowEveningEnd,
      title: "Day Shift - Neurology",
      description: "Primary on-call for neurology department",
      isActive: true,
    });
    
    this.createSchedule({
      organizationId: org1.id,
      physicianId: physician4.id,
      startTime: tomorrowMorningStart,
      endTime: tomorrowEveningEnd,
      title: "Day Shift - Oncology",
      description: "Primary on-call for oncology department",
      isActive: true,
    });
    
    // Tomorrow's night shift
    const tomorrowEveningStart = new Date(tomorrow);
    tomorrowEveningStart.setHours(18, 0, 0, 0);
    
    const dayAfterTomorrowMorningEnd = new Date(dayAfterTomorrow);
    dayAfterTomorrowMorningEnd.setHours(8, 0, 0, 0);
    
    this.createSchedule({
      organizationId: org1.id,
      physicianId: physician3.id,
      startTime: tomorrowEveningStart,
      endTime: dayAfterTomorrowMorningEnd,
      title: "Night Shift - Internal Medicine",
      description: "Primary on-call for internal medicine department",
      isActive: true,
    });
    
    // Enhanced schedule creation for better report visualization
    // Create historical schedules for the past 90 days for reporting purposes
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Use toLocaleDateString for date formatting instead of date-fns
    
    // Weekly physician rotation pattern (changes who is on call each week)
    const weeklyRotation = [
      [physician1.id, physician2.id, physician3.id, physician4.id], // Week 1
      [physician4.id, physician1.id, physician2.id, physician3.id], // Week 2
      [physician3.id, physician4.id, physician1.id, physician2.id], // Week 3
      [physician2.id, physician3.id, physician4.id, physician1.id]  // Week 4
    ];
    
    // Create historical schedules for the past 90 days
    for (let i = 90; i >= 1; i--) {
      const historicalDate = new Date(today);
      historicalDate.setDate(historicalDate.getDate() - i);
      
      const dayOfWeek = historicalDate.getDay(); // 0 = Sunday, 6 = Saturday
      const weekOfMonth = Math.floor((historicalDate.getDate() - 1) / 7); // Which week of the month (0-indexed)
      const weekOfRotation = weekOfMonth % 4; // Rotation repeats every 4 weeks
      
      // Determine primary on-call physician based on rotation schedule
      const primaryPhysicianIndex = dayOfWeek % 4; // Map days to 4 physicians
      const primaryPhysicianId = weeklyRotation[weekOfRotation][primaryPhysicianIndex];
      
      // Secondary physician is the next in rotation
      const secondaryPhysicianId = weeklyRotation[weekOfRotation][(primaryPhysicianIndex + 1) % 4];
      
      const dayName = weekdays[dayOfWeek];
      
      // Day rotation (8am to 8pm)
      const dayStart = new Date(historicalDate);
      dayStart.setHours(8, 0, 0, 0);
      
      const dayEnd = new Date(historicalDate);
      dayEnd.setHours(20, 0, 0, 0);
      
      this.createSchedule({
        organizationId: org1.id,
        physicianId: primaryPhysicianId,
        startTime: dayStart,
        endTime: dayEnd,
        title: `Day Rotation - ${dayName}`,
        description: `Regular day rotation schedule for ${historicalDate.toLocaleDateString()}`,
        isActive: i < 30, // Only recent schedules are active
      });
      
      // Night rotation (8pm to 8am the next day)
      const nightStart = new Date(historicalDate);
      nightStart.setHours(20, 0, 0, 0);
      
      const nightEnd = new Date(historicalDate);
      nightEnd.setDate(nightEnd.getDate() + 1);
      nightEnd.setHours(8, 0, 0, 0);
      
      this.createSchedule({
        organizationId: org1.id,
        physicianId: secondaryPhysicianId,
        startTime: nightStart,
        endTime: nightEnd,
        title: `Night Rotation - ${dayName}`,
        description: `Regular night rotation schedule for ${historicalDate.toLocaleDateString()}`,
        isActive: i < 30, // Only recent schedules are active
      });
      
      // Add specialty coverage for certain weekdays (e.g., cardiology coverage on Mondays and Thursdays)
      if (dayOfWeek === 1 || dayOfWeek === 4) { // Monday or Thursday
        const specialtyStart = new Date(historicalDate);
        specialtyStart.setHours(9, 0, 0, 0);
        
        const specialtyEnd = new Date(historicalDate);
        specialtyEnd.setHours(17, 0, 0, 0);
        
        this.createSchedule({
          organizationId: org1.id,
          physicianId: physician1.id, // Cardiologist
          startTime: specialtyStart,
          endTime: specialtyEnd,
          title: "Cardiology Coverage",
          description: `Dedicated cardiology on-call coverage for ${historicalDate.toLocaleDateString()}`,
          isActive: i < 30, // Only recent schedules are active
        });
      }
      
      // Add neurology coverage on Tuesdays and Fridays
      if (dayOfWeek === 2 || dayOfWeek === 5) { // Tuesday or Friday
        const specialtyStart = new Date(historicalDate);
        specialtyStart.setHours(9, 0, 0, 0);
        
        const specialtyEnd = new Date(historicalDate);
        specialtyEnd.setHours(17, 0, 0, 0);
        
        this.createSchedule({
          organizationId: org1.id,
          physicianId: physician2.id, // Neurologist
          startTime: specialtyStart,
          endTime: specialtyEnd,
          title: "Neurology Coverage",
          description: `Dedicated neurology on-call coverage for ${historicalDate.toLocaleDateString()}`,
          isActive: i < 30, // Only recent schedules are active
        });
      }
    }
    
    // Create future rotations (next 14 days)
    for (let i = 0; i < 14; i++) {
      const rotationDay = new Date(today);
      rotationDay.setDate(today.getDate() + i + 1); // Start tomorrow
      
      const rotationDayStart = new Date(rotationDay);
      rotationDayStart.setHours(8, 0, 0, 0);
      
      const rotationDayEnd = new Date(rotationDay);
      rotationDayEnd.setHours(20, 0, 0, 0);
      
      // Use the same rotation logic as historical schedules
      const dayOfWeek = rotationDay.getDay();
      const weekOfMonth = Math.floor((rotationDay.getDate() - 1) / 7);
      const weekOfRotation = weekOfMonth % 4;
      
      const primaryPhysicianIndex = dayOfWeek % 4;
      const primaryPhysicianId = weeklyRotation[weekOfRotation][primaryPhysicianIndex];
      
      const secondaryPhysicianIndex = (primaryPhysicianIndex + 1) % 4;
      const secondaryPhysicianId = weeklyRotation[weekOfRotation][secondaryPhysicianIndex];
      
      const dayName = weekdays[dayOfWeek];
      
      // Day rotation
      this.createSchedule({
        organizationId: org1.id,
        physicianId: primaryPhysicianId,
        startTime: rotationDayStart,
        endTime: rotationDayEnd,
        title: `Day Rotation - ${dayName}`,
        description: `Regular day rotation schedule for ${rotationDay.toLocaleDateString()}`,
        isActive: true,
      });
      
      // Night rotation
      const nightRotationStart = new Date(rotationDay);
      nightRotationStart.setHours(20, 0, 0, 0);
      
      const nextDay = new Date(rotationDay);
      nextDay.setDate(rotationDay.getDate() + 1);
      
      const nightRotationEnd = new Date(nextDay);
      nightRotationEnd.setHours(8, 0, 0, 0);
      
      this.createSchedule({
        organizationId: org1.id,
        physicianId: secondaryPhysicianId,
        startTime: nightRotationStart,
        endTime: nightRotationEnd,
        title: `Night Rotation - ${dayName}`,
        description: `Regular night rotation schedule for ${rotationDay.toLocaleDateString()}`,
        isActive: true,
      });
    }
    
    // Add some backup on-call schedules for emergencies
    for (let i = 0; i < 14; i += 7) { // Weekly backup rotation
      const backupDay = new Date(today);
      backupDay.setDate(today.getDate() + i + 2);
      
      const weekStart = new Date(backupDay);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(backupDay);
      weekEnd.setDate(backupDay.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Alternate backup physician weekly
      const backupPhysicianId = (i === 0) ? physician1.id : physician3.id;
      
      this.createSchedule({
        organizationId: org1.id,
        physicianId: backupPhysicianId,
        startTime: weekStart,
        endTime: weekEnd,
        title: "Weekly Backup On-Call",
        description: `Backup physician for emergency coverage from ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`,
        isActive: true,
      });
    }
    
    // Create demo requests
    const request1 = {
      organizationId: org1.id,
      physicianId: physician1.id,
      patientName: "Brian Taylor",
      patientMRN: "MT-4829",
      diagnosis: "Chest pain, suspected angina",
      location: "Emergency Department, Room 3",
      notes: "Patient has history of heart disease",
      status: "accepted",
      priority: "urgent",
    };
    
    const request2 = {
      organizationId: org1.id,
      physicianId: physician2.id,
      patientName: "Maria Garcia",
      patientMRN: "MT-7621",
      diagnosis: "Severe headache, suspected migraine",
      location: "Emergency Department, Room 5",
      notes: "Patient reports visual aura",
      status: "pending",
      priority: "normal",
    };
    
    const request3 = {
      organizationId: org1.id,
      physicianId: physician3.id,
      patientName: "James Wilson",
      patientMRN: "MT-2134",
      diagnosis: "Shortness of breath, suspected pneumonia",
      location: "Inpatient Ward, Room 210",
      status: "completed",
      priority: "normal",
    };
    
    const request4 = {
      organizationId: org1.id,
      physicianId: physician4.id,
      patientName: "Emma Johnson",
      patientMRN: "MT-5912",
      diagnosis: "Follow-up on chemotherapy side effects",
      location: "Oncology Clinic, Room 8",
      notes: "Patient experiencing severe nausea",
      status: "declined",
      priority: "urgent",
    };
    
    // Create basic requests
    this.createRequest(request1);
    this.createRequest(request2);
    this.createRequest(request3);
    this.createRequest(request4);
    
    // Create historical requests for reporting - with 90 days of data
    // We already have ninetyDaysAgo from schedules section
    
    // Create requests for each status type with weighted distribution
    const statuses = ["pending", "accepted", "in_progress", "completed", "declined", "cancelled"];
    const statusWeights = [0.15, 0.1, 0.05, 0.55, 0.1, 0.05]; // 55% completed for good visualization
    const priorities = ["normal", "urgent", "emergency"];
    const priorityWeights = [0.6, 0.3, 0.1]; // Most requests are normal priority
    const physicianIds = [physician1.id, physician2.id, physician3.id, physician4.id];
    const diagnoses = [
      "Chest pain", "Pneumonia", "Acute exacerbation of COPD", "Diabetic ketoacidosis",
      "Hypertensive emergency", "Acute bronchitis", "Arrhythmia", "Gastrointestinal bleeding",
      "Stroke symptoms", "Acute renal failure", "Seizure", "Severe allergic reaction",
      "Acute abdominal pain", "Deep vein thrombosis", "Pulmonary embolism"
    ];
    
    // Helper function to get weighted random item
    const getWeightedRandom = (items: string[], weights: number[]) => {
      const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
      let random = Math.random() * totalWeight;
      
      for (let i = 0; i < items.length; i++) {
        if (random < weights[i]) {
          return items[i];
        }
        random -= weights[i];
      }
      
      return items[0]; // Fallback
    };
    
    // Create patterns for requests per day (weekday-weekend pattern)
    const requestPattern = [
      9, 8, 10, 9, 11, 6, 5,  // Week 1
      10, 9, 9, 10, 12, 7, 6, // Week 2
      8, 9, 10, 11, 10, 5, 4, // Week 3
      9, 10, 11, 12, 13, 6, 5 // Week 4
    ];
    
    // Create 90 days of historical data with realistic patterns
    for (let i = 90; i >= 1; i--) {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() - i);
      
      // Pattern repeats every 28 days (4 weeks)
      const patternIndex = (90 - i) % 28;
      
      // Add some randomness to the pattern (±2)
      let requestsPerDay = requestPattern[patternIndex];
      requestsPerDay += Math.floor(Math.random() * 5) - 2;
      requestsPerDay = Math.max(3, requestsPerDay); // Minimum 3 requests
      
      // Create requests for this day
      for (let j = 0; j < requestsPerDay; j++) {
        // Work hours distribution (more during day shift)
        let randomHour;
        if (Math.random() < 0.7) {
          // 70% during day shift (8am-8pm)
          randomHour = Math.floor(Math.random() * 12) + 8;
        } else {
          // 30% during night shift (8pm-8am)
          randomHour = Math.floor(Math.random() * 12) + 20;
          if (randomHour >= 24) randomHour -= 24;
        }
        
        const randomMinute = Math.floor(Math.random() * 60);
        dayDate.setHours(randomHour, randomMinute, 0, 0);
        
        // Distribution of physicians (some handle more requests than others)
        const physicianDistribution = [0.4, 0.3, 0.2, 0.1]; // Physician 1 handles 40% of requests
        let randomPhysicianIndex = 0;
        const physicianRandom = Math.random();
        let accumulator = 0;
        
        for (let k = 0; k < physicianDistribution.length; k++) {
          accumulator += physicianDistribution[k];
          if (physicianRandom < accumulator) {
            randomPhysicianIndex = k;
            break;
          }
        }
        
        const randomPhysicianId = physicianIds[randomPhysicianIndex];
        
        // Status distribution based on weighted probabilities
        const randomStatus = getWeightedRandom(statuses, statusWeights);
        
        // Priority distribution based on weighted probabilities
        const randomPriority = getWeightedRandom(priorities, priorityWeights);
        
        // Random diagnosis
        const randomDiagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
        
        // Create historical request
        const histRequest = {
          organizationId: org1.id,
          physicianId: randomPhysicianId,
          patientName: `Patient ${i}-${j}`,
          patientMRN: `MT-${1000 + i*10 + j}`,
          diagnosis: randomDiagnosis,
          location: `Ward ${Math.floor(Math.random() * 10) + 1}, Room ${Math.floor(Math.random() * 30) + 1}`,
          notes: `Historical request from ${i} days ago`,
          status: randomStatus,
          priority: randomPriority
        };
        
        // Create the request directly without async/Promise
        const newRequestData = {
          id: this.requestCurrentId++,
          organizationId: histRequest.organizationId,
          physicianId: histRequest.physicianId,
          patientName: histRequest.patientName,
          patientMRN: histRequest.patientMRN,
          diagnosis: histRequest.diagnosis,
          location: histRequest.location,
          notes: histRequest.notes || null,
          status: histRequest.status,
          priority: histRequest.priority,
          createdAt: new Date(dayDate),
          updatedAt: new Date(dayDate),
          statusHistory: [{
            status: histRequest.status,
            timestamp: dayDate.toISOString()
          }]
        };
        
        const newRequest = newRequestData;
        
        // Create realistic sequential status transitions
        const transitions = [];
        
        // For completed requests, show the full workflow
        if (randomStatus === "completed") {
          // Add accepted status (15-30 min after creation)
          const acceptedDate = new Date(dayDate);
          acceptedDate.setMinutes(acceptedDate.getMinutes() + Math.floor(Math.random() * 15) + 15);
          transitions.push({
            status: "accepted",
            timestamp: acceptedDate.toISOString(),
            userId: 1
          });
          
          // Add in_progress status (30-90 min after accepted)
          const progressDate = new Date(acceptedDate);
          progressDate.setMinutes(progressDate.getMinutes() + Math.floor(Math.random() * 60) + 30);
          transitions.push({
            status: "in_progress",
            timestamp: progressDate.toISOString(),
            userId: 1
          });
          
          // Add completed status (45-180 min after in_progress)
          const completedDate = new Date(progressDate);
          completedDate.setMinutes(completedDate.getMinutes() + Math.floor(Math.random() * 135) + 45);
          transitions.push({
            status: "completed",
            timestamp: completedDate.toISOString(),
            userId: 1
          });
        } 
        // For in_progress requests
        else if (randomStatus === "in_progress") {
          // Add accepted status (15-30 min after creation)
          const acceptedDate = new Date(dayDate);
          acceptedDate.setMinutes(acceptedDate.getMinutes() + Math.floor(Math.random() * 15) + 15);
          transitions.push({
            status: "accepted",
            timestamp: acceptedDate.toISOString(),
            userId: 1
          });
          
          // Add in_progress status (30-90 min after accepted)
          const progressDate = new Date(acceptedDate);
          progressDate.setMinutes(progressDate.getMinutes() + Math.floor(Math.random() * 60) + 30);
          transitions.push({
            status: "in_progress",
            timestamp: progressDate.toISOString(),
            userId: 1
          });
        }
        // For accepted requests
        else if (randomStatus === "accepted") {
          // Add accepted status (15-30 min after creation)
          const acceptedDate = new Date(dayDate);
          acceptedDate.setMinutes(acceptedDate.getMinutes() + Math.floor(Math.random() * 15) + 15);
          transitions.push({
            status: "accepted",
            timestamp: acceptedDate.toISOString(),
            userId: 1
          });
        }
        // For declined/cancelled requests
        else if (["declined", "cancelled"].includes(randomStatus)) {
          const responseDate = new Date(dayDate);
          responseDate.setMinutes(responseDate.getMinutes() + Math.floor(Math.random() * 30) + 15);
          transitions.push({
            status: randomStatus,
            timestamp: responseDate.toISOString(),
            userId: 1
          });
        }
        
        // Add all transitions to the status history
        newRequest.statusHistory = [newRequest.statusHistory[0], ...transitions];
        
        // Update the request's updatedAt time to match the last status change
        if (transitions.length > 0) {
          newRequest.updatedAt = new Date(transitions[transitions.length - 1].timestamp);
        }
        
        this.requests.set(newRequest.id, newRequest);
      }
    }
    
    // Create admin user
    const adminUser = {
      id: this.userCurrentId++,
      username: "admin",
      password: "password",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      role: "admin",
      organizationId: org1.id,
      physicianId: null,
      createdAt: new Date(),
    };
    
    // Create physician user
    const physicianUser = {
      id: this.userCurrentId++,
      username: "sarah.miller",
      password: "password",
      firstName: "Sarah",
      lastName: "Miller",
      email: "sarah.miller@example.com",
      role: "physician",
      organizationId: org1.id,
      physicianId: physician3.id,
      createdAt: new Date(),
    };
    
    // Add users to storage
    this.users.set(adminUser.id, adminUser);
    this.users.set(physicianUser.id, physicianUser);
  }
}

export const storage = new MemStorage();
