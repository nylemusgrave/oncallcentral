import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organization schema
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  billingCodes: json("billing_codes").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

// Physician schema
export const physicians = pgTable("physicians", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  specialty: text("specialty").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  credentials: json("credentials").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPhysicianSchema = createInsertSchema(physicians).omit({
  id: true,
  createdAt: true,
});

// Organization-Physician join table
export const organizationPhysicians = pgTable("organization_physicians", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  physicianId: integer("physician_id").notNull(),
});

export const insertOrganizationPhysicianSchema = createInsertSchema(organizationPhysicians).omit({
  id: true,
});

// Schedule schema
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  physicianId: integer("physician_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

// Request schema
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  physicianId: integer("physician_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientMRN: text("patient_mrn").notNull(),
  diagnosis: text("diagnosis").notNull(),
  location: text("location").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending, accepted, declined, in_progress, completed, cancelled
  priority: text("priority").notNull().default("normal"), // normal, urgent, emergency
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  statusHistory: json("status_history").$type<StatusHistoryEntry[]>().default([]).notNull(),
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  statusHistory: true,
});

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // admin, physician
  organizationId: integer("organization_id"),
  physicianId: integer("physician_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Physician = typeof physicians.$inferSelect;
export type InsertPhysician = z.infer<typeof insertPhysicianSchema>;

export type OrganizationPhysician = typeof organizationPhysicians.$inferSelect;
export type InsertOrganizationPhysician = z.infer<typeof insertOrganizationPhysicianSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type StatusHistoryEntry = {
  status: string;
  timestamp: string;
  note?: string;
  userId?: number;
};

// Extended schemas for validation
export const userLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type UserLogin = z.infer<typeof userLoginSchema>;
