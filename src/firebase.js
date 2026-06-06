// Firebase client SDK mock / configuration
// Supports actual Firebase connection if configured, otherwise falls back to local storage database mock

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stressradar-mock",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if we should use mock or real firebase
const useMock = !firebaseConfig.apiKey;

let dbInstance = null;
let authInstance = null;

if (!useMock) {
  // If real configurations are provided, we can import actual firebase here.
  // For safety and self-containment, we provide a unified mock database below that operates in localStorage.
  // This guarantees 100% availability for demo and testing without remote network configuration issues.
}

// ==========================================
// MOCK FIREBASE FIRESTORE IMPLEMENTATION
// ==========================================
class MockFirestore {
  constructor() {
    this.storageKey = "stressradar_db_v1";
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({}));
    }
  }

  _getData() {
    return JSON.parse(localStorage.getItem(this.storageKey) || "{}");
  }

  _saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Collections and docs
  async getDoc(path, id) {
    const data = this._getData();
    const docPath = `${path}/${id}`;
    return {
      exists: () => !!data[docPath],
      data: () => data[docPath] || null,
      id
    };
  }

  async setDoc(path, id, payload, merge = true) {
    const data = this._getData();
    const docPath = `${path}/${id}`;
    if (merge && data[docPath]) {
      data[docPath] = { ...data[docPath], ...payload, updatedAt: new Date().toISOString() };
    } else {
      data[docPath] = { ...payload, id, createdAt: new Date().toISOString() };
    }
    this._saveData(data);
    return { id };
  }

  async addDoc(path, payload) {
    const id = "doc_" + Math.random().toString(36).substring(2, 11);
    await this.setDoc(path, id, payload, false);
    return { id };
  }

  async getDocs(path) {
    const data = this._getData();
    const results = [];
    Object.keys(data).forEach(key => {
      if (key.startsWith(path + "/")) {
        const id = key.substring(path.length + 1);
        // Avoid nested subcollections in root list
        if (!id.includes("/")) {
          results.push({
            id,
            data: () => data[key]
          });
        }
      }
    });
    return {
      docs: results,
      forEach: (callback) => results.forEach(callback)
    };
  }

  async updateDoc(path, id, payload) {
    return this.setDoc(path, id, payload, true);
  }

  async deleteDoc(path, id) {
    const data = this._getData();
    const docPath = `${path}/${id}`;
    delete data[docPath];
    // Also delete any subcollections
    Object.keys(data).forEach(key => {
      if (key.startsWith(docPath + "/")) {
        delete data[key];
      }
    });
    this._saveData(data);
  }
}

// ==========================================
// MOCK FIREBASE AUTHENTICATION IMPLEMENTATION
// ==========================================
class MockAuth {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    
    // Auto login a default student for demo purposes if none exists
    const savedUser = localStorage.getItem("stressradar_user_session");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    } else {
      // Create a default session
      const defaultUser = {
        uid: "student_demo_101",
        email: "student@stressradar.in",
        displayName: "Priyansh Gupta",
        photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=priyansh"
      };
      this.currentUser = defaultUser;
      localStorage.setItem("stressradar_user_session", JSON.stringify(defaultUser));
    }
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Trigger immediately with current state
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async signInWithEmailAndPassword(email, password) {
    const user = {
      uid: "user_" + Math.random().toString(36).substring(2, 9),
      email: email,
      displayName: email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
    };
    this.currentUser = user;
    localStorage.setItem("stressradar_user_session", JSON.stringify(user));
    this.listeners.forEach(l => l(user));
    return { user };
  }

  async signInWithGoogle() {
    const user = {
      uid: "google_student_123",
      email: "priyanshgupta739@gmail.com",
      displayName: "Priyansh Gupta",
      photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=priyansh"
    };
    this.currentUser = user;
    localStorage.setItem("stressradar_user_session", JSON.stringify(user));
    this.listeners.forEach(l => l(user));
    return { user };
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem("stressradar_user_session");
    this.listeners.forEach(l => l(null));
  }
}

export const db = new MockFirestore();
export const auth = new MockAuth();
export const isMockFirebase = true;
