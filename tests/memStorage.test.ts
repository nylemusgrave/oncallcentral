import test from 'node:test';
import assert from 'node:assert/strict';
import { MemStorage } from '../server/storage';

test('MemStorage initialization', async () => {
  const storage = new MemStorage();
  
  // Test initial organizations
  const orgs = await storage.getOrganizations();
  assert.ok(orgs.length > 0, 'Should have demo organizations');
  
  // Test initial physicians
  const physicians = await storage.getPhysiciansByOrganization(orgs[0].id);
  assert.ok(physicians.length > 0, 'Should have demo physicians');
  
  // Test initial schedules
  const schedules = await storage.getSchedulesByOrganization(orgs[0].id);
  assert.ok(schedules.length > 0, 'Should have demo schedules');
  
  // Test initial requests
  const requests = await storage.getRequestsByOrganization(orgs[0].id);
  assert.ok(requests.length > 0, 'Should have demo requests');
});

test('MemStorage data persistence', async () => {
  const storage = new MemStorage();
  const initialOrgs = await storage.getOrganizations();
  const initialCount = initialOrgs.length;
  
  // Create new organization
  const newOrg = await storage.createOrganization({
    name: 'Test Hospital',
    address: '123 Test St',
    city: 'Testville',
    state: 'TS',
    zip: '12345',
    phone: '555-0123',
    email: 'test@hospital.com',
    billingCodes: ['CODE1', 'CODE2']
  });
  
  // Verify organization was added
  const orgsAfterAdd = await storage.getOrganizations();
  assert.equal(orgsAfterAdd.length, initialCount + 1, 'Should have one more organization');
  
  // Verify organization can be retrieved
  const retrieved = await storage.getOrganization(newOrg.id);
  assert.deepEqual(retrieved, newOrg, 'Retrieved organization should match created one');
  
  // Update organization
  const updatedOrg = await storage.updateOrganization(newOrg.id, {
    name: 'Updated Hospital'
  });
  assert.equal(updatedOrg?.name, 'Updated Hospital', 'Organization name should be updated');
  
  // Delete organization
  await storage.deleteOrganization(newOrg.id);
  const orgsAfterDelete = await storage.getOrganizations();
  assert.equal(orgsAfterDelete.length, initialCount, 'Should return to initial count after deletion');
});

test('MemStorage relationships', async () => {
  const storage = new MemStorage();
  
  // Create test data
  const org = await storage.createOrganization({
    name: 'Test Hospital',
    address: '123 Test St',
    city: 'Testville',
    state: 'TS',
    zip: '12345',
    phone: '555-0123',
    email: 'test@hospital.com',
    billingCodes: []
  });
  
  const physician = await storage.createPhysician({
    firstName: 'John',
    lastName: 'Smith',
    specialty: 'Cardiology',
    phone: '555-0124',
    email: 'john@hospital.com',
    credentials: ['MD', 'FACC']
  });
  
  // Test physician-organization relationship
  await storage.assignPhysicianToOrganization({
    organizationId: org.id,
    physicianId: physician.id
  });
  
  const orgPhysicians = await storage.getPhysiciansByOrganization(org.id);
  assert.ok(orgPhysicians.some(p => p.id === physician.id), 'Physician should be assigned to organization');
  
  // Test schedule creation for physician
  const schedule = await storage.createSchedule({
    organizationId: org.id,
    physicianId: physician.id,
    startTime: new Date(),
    endTime: new Date(Date.now() + 86400000), // 24 hours later
    title: 'Test Shift',
    description: 'Test shift description',
    isActive: true
  });
  
  const physicianSchedules = await storage.getSchedulesByPhysician(physician.id);
  assert.ok(physicianSchedules.some(s => s.id === schedule.id), 'Schedule should be assigned to physician');
  
  // Test request creation
  const request = await storage.createRequest({
    organizationId: org.id,
    physicianId: physician.id,
    patientName: 'Test Patient',
    patientMRN: 'MRN123',
    diagnosis: 'Test Diagnosis',
    location: 'Room 101',
    notes: 'Test notes',
    status: 'pending',
    priority: 'normal'
  });
  
  const orgRequests = await storage.getRequestsByOrganization(org.id);
  assert.ok(orgRequests.some(r => r.id === request.id), 'Request should be associated with organization');
  
  // Cleanup
  await storage.deleteRequest(request.id);
  await storage.deleteSchedule(schedule.id);
  await storage.deletePhysician(physician.id);
  await storage.deleteOrganization(org.id);
});