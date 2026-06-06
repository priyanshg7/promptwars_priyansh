import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mock browser globals for Node test environment
globalThis.window = {
  fetch: () => Promise.resolve(new Response('{}')),
  location: {
    reload: () => {} // Mock reload to avoid crash on auth.signOut()
  }
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

// Import code units to test
import { parsePath, getSubjectsForExam, generateSubjectData } from './src/utils/helpers.js';
import { db, auth } from './src/firebase.js';

// 1. PATH PARSER TESTS
test('parsePath Helper function', () => {
  const p1 = parsePath('users/user_abc/tasks');
  assert.deepStrictEqual(p1, { userId: 'user_abc', collection: 'tasks', id: null });

  const p2 = parsePath('users/user_xyz/tests/test_789');
  assert.deepStrictEqual(p2, { userId: 'user_xyz', collection: 'tests', id: 'test_789' });

  const p3 = parsePath('users');
  assert.deepStrictEqual(p3, { userId: null, collection: 'users', id: null });

  const p4 = parsePath('');
  assert.deepStrictEqual(p4, { userId: null, collection: '', id: null });

  const p5 = parsePath(null);
  assert.deepStrictEqual(p5, { userId: null, collection: '', id: null });
});

// 2. EXAM SUBJECTS MAPPING TESTS
test('getSubjectsForExam Target Exam Mapping', () => {
  assert.deepStrictEqual(getSubjectsForExam(['JEE Mains']), ['Physics', 'Chemistry', 'Mathematics']);
  assert.deepStrictEqual(getSubjectsForExam(['NEET UG']), ['Physics', 'Chemistry', 'Biology']);
  assert.deepStrictEqual(getSubjectsForExam(['UPSC CSE']), ['General Studies', 'CSAT', 'Optional Subject']);
  assert.deepStrictEqual(getSubjectsForExam(['CAT']), ['Quantitative Ability', 'DILR', 'Verbal Ability']);
  assert.deepStrictEqual(getSubjectsForExam(['Board Exam Class 10']), ['Science', 'Mathematics', 'Social Science']);
  assert.deepStrictEqual(getSubjectsForExam(['CUET']), ['Language Test', 'Domain Subjects', 'General Test']);
  assert.deepStrictEqual(getSubjectsForExam([]), ['Physics', 'Chemistry', 'Mathematics']);
  assert.deepStrictEqual(getSubjectsForExam(['Other Exam']), ['Subject A', 'Subject B', 'Subject C']);
});

// 3. SUBJECT DATA SIMULATOR TESTS
test('generateSubjectData Analytics Generator', () => {
  const mockTests = [
    { status: 'completed', percentage: 80 },
    { status: 'completed', percentage: 90 },
    { status: 'upcoming', percentage: 100 } // Should be ignored
  ];

  const results = generateSubjectData(mockTests, 50, ['JEE Mains']);
  assert.strictEqual(results.length, 3);
  assert.strictEqual(results[0].subject, 'Physics');

  // Avg score of completed tests = 85
  // Score mapping: idx 0 is avg + 5 = 90
  assert.strictEqual(results[0].Score, 90);
  // Stress mapping: idx 0 is burnout (50) - 5 = 45
  assert.strictEqual(results[0].Stress, 45);

  // Score mapping: idx 1 is avg - 12 = 73
  // Stress mapping: idx 1 is burnout (50) + 15 = 65
  assert.strictEqual(results[1].Score, 73);
  assert.strictEqual(results[1].Stress, 65);
});

// 4. DATABASE CRUD TESTS
test('DBClient localStorage CRUD Operations', async () => {
  localStorage.clear();

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

// 5. AUTH CLIENT TESTS
test('AuthClient Authentication flow', async () => {
  // Test immediate subscription update
  let receivedUser = null;
  const unsubscribe = auth.onAuthStateChanged(user => {
    receivedUser = user;
  });

  // Since listener triggers asynchronously with setTimeout(..., 0), wait a brief moment
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.notStrictEqual(receivedUser, null);
  assert.strictEqual(receivedUser.uid, 'default_student_123');

  unsubscribe();

  // Test signOut clears localStorage
  localStorage.setItem('stressradar_gemini_api_key', 'key_123');
  await auth.signOut();
  assert.strictEqual(localStorage.getItem('stressradar_gemini_api_key'), null);
});

// 6. I18N ENGLISH-HINDI PARITY TESTS
test('i18n Translation Keys Parity', () => {
  const i18nFilePath = path.join(process.cwd(), 'src', 'i18n.js');
  const content = fs.readFileSync(i18nFilePath, 'utf8');

  // Simple script regex parse of resources object
  const enMatch = content.match(/en:\s*\{\s*translation:\s*\{([\s\S]*?)\}\s*\}/);
  const hiMatch = content.match(/hi:\s*\{\s*translation:\s*\{([\s\S]*?)\}\s*\}/);

  assert.ok(enMatch, 'English translation resources should be found');
  assert.ok(hiMatch, 'Hindi translation resources should be found');

  const getKeys = (blockText) => {
    const keyRegex = /"([^"]+)"\s*:/g;
    const keys = [];
    let match;
    while ((match = keyRegex.exec(blockText)) !== null) {
      keys.push(match[1]);
    }
    return keys.sort();
  };

  const enKeys = getKeys(enMatch[1]);
  const hiKeys = getKeys(hiMatch[1]);

  assert.deepStrictEqual(enKeys, hiKeys, 'English translation keys must match Hindi translation keys exactly');
});
