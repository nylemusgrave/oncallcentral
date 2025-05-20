import test from 'node:test';
import assert from 'node:assert/strict';
import { MemStorage } from '../server/storage';
import type { InsertOrganization, InsertPhysician, InsertSchedule, InsertRequest, InsertUser } from '../shared/schema';

// Helper function to create storage instance without heavy demo data? Wait the constructor initializes demo data automatically.
// We'll use new MemStorage(); which populates demo data; we can still use but will make tests more complex.

test('organization CRUD', async () => {
  const storage = new MemStorage();
  const orgData: InsertOrganization = {
    name: 'Test Org',
    address: '123 St',
    city: 'City',
    state: 'ST',
    zip: '00000',
    phone: '123',
    email: 'a@example.com',
    billingCodes: []
  };

  const org = await storage.createOrganization(orgData);
  assert.ok(org.id > 0);
  assert.equal(org.name, 'Test Org');

  const fetched = await storage.getOrganization(org.id);
  assert.deepEqual(fetched, org);

  const updated = await storage.updateOrganization(org.id, {name: 'Updated'});
  assert.equal(updated?.name, 'Updated');

  const all = await storage.getOrganizations();
  assert.ok(all.some(o => o.id === org.id));

  const success = await storage.deleteOrganization(org.id);
  assert.equal(success, true);
  assert.equal(await storage.getOrganization(org.id), undefined);
});

test('physician CRUD and organization assignment', async () => {
  const storage = new MemStorage();
  const physicianData: InsertPhysician = {
    firstName: 'John',
    lastName: 'Doe',
    specialty: 'Spec',
    phone: '1',
    email: 'p@example.com',
    credentials: []
  };

  const physician = await storage.createPhysician(physicianData);
  assert.ok(physician.id > 0);

  await storage.assignPhysicianToOrganization({organizationId: 1, physicianId: physician.id});
  const byOrg = await storage.getPhysiciansByOrganization(1);
  assert.ok(byOrg.some(p => p.id === physician.id));

  const updated = await storage.updatePhysician(physician.id, {firstName: 'Jane'});
  assert.equal(updated?.firstName, 'Jane');

  const success = await storage.deletePhysician(physician.id);
  assert.equal(success, true);
});

test('schedule CRUD and active filter', async () => {
  const storage = new MemStorage();
  const scheduleData: InsertSchedule = {
    organizationId: 1,
    physicianId: 1,
    startTime: new Date('2000-01-01T00:00:00Z'),
    endTime: new Date('2000-01-02T00:00:00Z'),
    title: 'Shift',
    description: 'desc',
    isActive: true
  };

  const schedule = await storage.createSchedule(scheduleData);
  assert.ok(schedule.id > 0);

  const schedules = await storage.getSchedulesByOrganization(1);
  assert.ok(schedules.some(s => s.id === schedule.id));

  const active = await storage.getActiveSchedules(1, new Date('1999-12-31'), new Date('2000-01-03'));
  assert.ok(active.some(s => s.id === schedule.id));

  const updated = await storage.updateSchedule(schedule.id, { title: 'Updated' });
  assert.equal(updated?.title, 'Updated');

  const success = await storage.deleteSchedule(schedule.id);
  assert.equal(success, true);
});

test('request CRUD and status updates', async () => {
  const storage = new MemStorage();
  const requestData: InsertRequest = {
    organizationId: 1,
    physicianId: 1,
    patientName: 'Pat',
    patientMRN: 'MRN',
    diagnosis: 'diag',
    location: 'loc',
    notes: 'n',
    status: 'pending',
    priority: 'normal'
  };

  const req = await storage.createRequest(requestData);
  assert.ok(req.id > 0);

  const fetched = await storage.getRequest(req.id);
  assert.deepEqual(fetched, req);

  const updated = await storage.updateRequest(req.id, { notes: 'x' });
  assert.equal(updated?.notes, 'x');

  const updatedStatus = await storage.updateRequestStatus(req.id, 'completed', 'done');
  assert.equal(updatedStatus?.status, 'completed');
  assert.equal(updatedStatus?.statusHistory.at(-1)?.note, 'done');

  const byStatus = await storage.getRequestsByStatus('completed');
  assert.ok(byStatus.some(r => r.id === req.id));

  const success = await storage.deleteRequest(req.id);
  assert.equal(success, true);
});

test('user CRUD and credential verification', async () => {
  const storage = new MemStorage();
  const userData: InsertUser = {
    username: 'user1',
    password: 'pass',
    firstName: 'f',
    lastName: 'l',
    email: 'u@example.com',
    role: 'admin',
    organizationId: 1,
    physicianId: undefined
  };

  const user = await storage.createUser(userData);
  assert.ok(user.id > 0);

  const fetched = await storage.getUser(user.id);
  assert.deepEqual(fetched, user);

  const byUsername = await storage.getUserByUsername('user1');
  assert.equal(byUsername?.id, user.id);

  const verified = await storage.verifyUserCredentials('user1', 'pass');
  assert.equal(verified?.id, user.id);

  const updated = await storage.updateUser(user.id, { lastName: 'new' });
  assert.equal(updated?.lastName, 'new');

  const users = await storage.getUsersByOrganization(1);
  assert.ok(users.some(u => u.id === user.id));

  const success = await storage.deleteUser(user.id);
  assert.equal(success, true);
});
