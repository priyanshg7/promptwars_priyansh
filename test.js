import { test } from 'node:test';
import assert from 'node:assert';

// Mock browser globals for Node test environment
globalThis.window = {
  fetch: () => Promise.resolve(new Response('{}'))
};
globalThis.Response = class Response {
  constructor(body) {
    this.body = body;
  }
};
globalThis.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// Now import the database client
import { db } from './src/firebase.js';

test('DBClient localStorage CRUD Operations', async () => {
  // Test setDoc and getDoc
  const mockUser = { name: 'Alice', email: 'alice@test.com' };
  await db.setDoc('users', 'alice_123', mockUser);

  const doc = await db.getDoc('users', 'alice_123');
  assert.strictEqual(doc.exists(), true);
  assert.deepStrictEqual(doc.data(), { ...mockUser, uid: 'alice_123' });

  // Test addDoc and getDocs
  const task1 = { title: 'Study Math', status: 'Not Started' };
  const task2 = { title: 'Study Physics', status: 'In Progress' };
  await db.addDoc('users/alice_123/tasks', task1);
  await db.addDoc('users/alice_123/tasks', task2);

  const docsSnap = await db.getDocs('users/alice_123/tasks');
  const tasks = [];
  docsSnap.forEach(d => tasks.push(d.data()));

  assert.strictEqual(tasks.length, 2);
  assert.strictEqual(tasks[0].title, 'Study Math');
  assert.strictEqual(tasks[1].title, 'Study Physics');

  // Test updateDoc
  const firstTaskId = docsSnap.docs[0].id;
  await db.updateDoc('users/alice_123/tasks', firstTaskId, { status: 'Done' });

  const updatedSnap = await db.getDocs('users/alice_123/tasks');
  const updatedTasks = [];
  updatedSnap.forEach(d => updatedTasks.push(d.data()));
  assert.strictEqual(updatedTasks[0].status, 'Done');

  // Test deleteDoc
  await db.deleteDoc('users/alice_123/tasks', firstTaskId);
  const finalSnap = await db.getDocs('users/alice_123/tasks');
  assert.strictEqual(finalSnap.docs.length, 1);
});
