// Client-side local database and authentication adaptor using localStorage and Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

// Parse collections from path formats like "users/uid/tasks"
const parsePath = (path) => {
  const parts = path.split('/');
  if (parts.length >= 3) {
    return {
      userId: parts[1],
      collection: parts[2],
      id: parts[3] || null
    };
  }
  return { userId: null, collection: path, id: null };
};

const getGeminiApiKey = () => {
  return localStorage.getItem('stressradar_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

// Mock Fallbacks
const getMockSuggestedTasks = (taskTitle) => {
  return [
    `1. Read core concepts of ${taskTitle} — 30 mins`,
    `2. Solve 10 mock problems of ${taskTitle} — 45 mins`,
    `3. Review incorrect answers & update notes — 15 mins`
  ];
};

const getMockVentResponse = (text) => {
  return {
    stress_level: "medium",
    trigger: "Mock exam preparation pressure",
    burnout_score_update: 58,
    ai_response: "I hear you. Preparing for competitive exams is a marathon, not a sprint. Take a deep breath—we can break this syllabus down step-by-step."
  };
};

const getMockInsights = () => {
  return [
    {
      title: "Stress & Performance Correlation",
      type: "warning",
      description: "Your math score dipped this week. This aligns with the high stress you logged 2 days before the test. Prioritizing rest before mocks could improve retention."
    },
    {
      title: "Positive Sleep Trend",
      type: "success",
      description: "As your sleep duration increased, your cognitive reaction speed improved by 40ms. Keep maintaining consistent sleep hours!"
    }
  ];
};

const getMockChatResponse = () => {
  return {
    text: "I am here to support you. Let's work on managing your study load so you feel confident for your exams."
  };
};

const runGemini = async (prompt, isJsonMode = false) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("No API key configured");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    ...(isJsonMode ? { generationConfig: { responseMimeType: "application/json" } } : {})
  });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

const handleSuggestTasks = async (payload) => {
  if (!payload || !payload.task_title) return getMockSuggestedTasks("Study Session");
  const { task_title, exam_type, language } = payload;
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return getMockSuggestedTasks(task_title);
  }
  const prompt = `
    You are an AI study planner helping a student preparing for ${exam_type || 'competitive'} exams.
    The student added a generic task: "${task_title}"
    
    Generate 3 specific, highly actionable micro-tasks to break down this generic task.
    Each micro-task must include an estimated completion time.
    Language: ${language || 'en'} (hi = Hindi, en = English)
    
    If Hindi is selected, generate task descriptions in Devanagari script. Keep them concise.
    
    Format response strictly as a JSON array of strings:
    [
      "1. ...",
      "2. ...",
      "3. ..."
    ]
  `;
  try {
    const text = await runGemini(prompt, true);
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini suggest tasks failed, returning mock:", err);
    return getMockSuggestedTasks(task_title);
  }
};

const handleAnalyzeVent = async (payload) => {
  if (!payload || !payload.text) return getMockVentResponse("");
  const { text: ventText, history, language, student_profile } = payload;
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return getMockVentResponse(ventText);
  }
  const prompt = `
    You are StressRadar AI, a mental wellness and performance coach for Indian students.
    Analyze the following vocal vent text from a student preparing for competitive exams.
    
    Student Profile: ${JSON.stringify(student_profile || {})}
    Emotional/Stress History: ${JSON.stringify(history || [])}
    Student Vent Text: "${ventText}"
    Language Preference: ${language || 'en'} (hi = Hindi, en = English)
    
    Analyze the text and return a JSON object with:
    1. "stress_level": "low" or "medium" or "high"
    2. "trigger": A short 2-5 word description of the stress trigger (in the requested language)
    3. "burnout_score_update": A calculated burnout risk score (integer, 0-100) based on their current venting and history
    4. "ai_response": A warm, encouraging, conversational response as a senior mentor (in the requested language). If Hindi, write it in Devanagari script. Keep it concise (max 3 sentences).
    
    Format response strictly as JSON:
    {
      "stress_level": "...",
      "trigger": "...",
      "burnout_score_update": 0-100,
      "ai_response": "..."
    }
  `;
  try {
    const text = await runGemini(prompt, true);
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini analyze vent failed, returning mock:", err);
    return getMockVentResponse(ventText);
  }
};

const handleGenerateInsights = async (payload) => {
  const { tests, checkins, language } = payload || {};
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return getMockInsights();
  }
  const prompt = `
    You are StressRadar AI analyzing student mock test history and mental check-ins.
    Recent Mock Tests: ${JSON.stringify(tests || [])}
    Recent Emotional Check-ins: ${JSON.stringify(checkins || [])}
    Language: ${language || 'en'} (hi = Hindi, en = English)
    
    Generate 2 proactive wellness/academic insights. Look for correlations like:
    - Sleep quality drops preceding test score dips.
    - Anxiety levels rising on weeks with clustered test dates.
    - Speed/Reaction fatigue correlation with stress.
    
    Format response strictly as a JSON array of objects:
    [
      {
        "title": "Insight Title",
        "type": "warning" or "success" or "info",
        "description": "Insight description (max 2 sentences, in the requested language)"
      }
    ]
  `;
  try {
    const text = await runGemini(prompt, true);
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini generate insights failed, returning mock:", err);
    return getMockInsights();
  }
};

const handleChat = async (payload) => {
  if (!payload || !payload.message) return getMockChatResponse();
  const { message, chat_history, student_profile, language } = payload;
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return getMockChatResponse();
  }
  let historyPrompt = "";
  (chat_history || []).forEach(msg => {
    const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
    historyPrompt += `${roleLabel}: ${msg.text}\n`;
  });
  const systemPrompt = `
    You are a compassionate, expert AI Mental Wellness & Exam Mentor for Indian students.
    Student Profile: ${JSON.stringify(student_profile || {})}
    
    Language preference: ${language || 'en'} (hi = Hindi, en = English)
    Important instruction:
    If language is 'hi' (Hindi), you MUST respond in warm, conversational Hindi written in Devanagari script.
    Avoid clinical/robotic terms. Sound like a supportive senior student or sibling.
    
    Guidelines:
    1. Address the student by name.
    2. Reference their target exam (${student_profile?.targetExams?.join(', ') || 'competitive exams'}) to personalize details.
    3. Keep answers concise, actionable, and focus on stress reduction, mental clarity, and consistent study habits.
    
    Current Chat History:
    ${historyPrompt}
    User: ${message}
    Assistant:
  `;
  try {
    const text = await runGemini(systemPrompt, false);
    return { text };
  } catch (err) {
    console.error("Gemini chat failed, returning mock:", err);
    return getMockChatResponse();
  }
};

// Global Fetch Interceptor
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (url, options) => {
    const urlString = String(url);
    if (urlString.startsWith('/api/')) {
      let payload = null;
      if (options && options.body) {
        try {
          payload = JSON.parse(options.body);
        } catch (e) {
          // Body is not JSON
        }
      }

      let resultData = null;
      if (urlString.includes('/api/suggest-tasks')) {
        resultData = await handleSuggestTasks(payload);
      } else if (urlString.includes('/api/analyze-vent')) {
        resultData = await handleAnalyzeVent(payload);
      } else if (urlString.includes('/api/generate-insights')) {
        resultData = await handleGenerateInsights(payload);
      } else if (urlString.includes('/api/chat')) {
        resultData = await handleChat(payload);
      } else if (urlString.includes('/api/auth/change-password')) {
        resultData = { message: "Password updated successfully!" };
      } else if (urlString.includes('/api/auth/update-profile')) {
        resultData = payload;
      } else if (urlString.includes('/api/auth/me')) {
        const userData = localStorage.getItem('stressradar_user');
        resultData = userData ? JSON.parse(userData) : null;
      }

      if (resultData !== null) {
        return new Response(JSON.stringify(resultData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return originalFetch(url, options);
  };
}

// Auth Client
class AuthClient {
  constructor() {
    this.currentUser = {
      uid: 'default_student_123',
      email: 'student@stressradar.app',
      displayName: 'Default Student',
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=default_student`
    };
    this.listeners = [];
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Notify immediately with default user
    setTimeout(() => callback(this.currentUser), 0);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async signOut() {
    // Reset/clear profile and data to allow running onboarding again
    localStorage.removeItem('stressradar_user');
    localStorage.removeItem('stressradar_tasks');
    localStorage.removeItem('stressradar_tests');
    localStorage.removeItem('stressradar_checkins');
    localStorage.removeItem('stressradar_gemini_api_key');
    window.location.reload();
  }
}

// Database Client
class DBClient {
  _getCollection(collectionName) {
    try {
      const data = localStorage.getItem(`stressradar_${collectionName}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading collection ${collectionName}`, e);
      return [];
    }
  }

  _saveCollection(collectionName, data) {
    try {
      localStorage.setItem(`stressradar_${collectionName}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving collection ${collectionName}`, e);
    }
  }

  async getDoc(path, id) {
    if (path === 'users') {
      const userData = localStorage.getItem('stressradar_user');
      const user = userData ? JSON.parse(userData) : null;
      return {
        exists: () => !!user,
        data: () => user,
        id: id
      };
    }
    const { collection } = parsePath(path);
    const list = this._getCollection(collection);
    const item = list.find(x => x.id === id);
    return {
      exists: () => !!item,
      data: () => item,
      id
    };
  }

  async setDoc(path, id, payload) {
    if (path === 'users') {
      const existing = localStorage.getItem('stressradar_user');
      const base = existing ? JSON.parse(existing) : {};
      const updated = { ...base, ...payload, uid: id };
      localStorage.setItem('stressradar_user', JSON.stringify(updated));
      return { id };
    }
    const { collection } = parsePath(path);
    const list = this._getCollection(collection);
    const filtered = list.filter(x => x.id !== id);
    const item = { ...payload, id };
    filtered.push(item);
    this._saveCollection(collection, filtered);
    return { id };
  }

  async addDoc(path, payload) {
    const { collection, userId } = parsePath(path);
    const list = this._getCollection(collection);
    const id = Math.random().toString(36).substring(2, 9);
    const item = { ...payload, id, userId };
    list.push(item);
    this._saveCollection(collection, list);
    return { id };
  }

  async getDocs(path) {
    const { collection, userId } = parsePath(path);
    const list = this._getCollection(collection);
    const filtered = list.filter(x => x.userId === userId);
    const docs = filtered.map(item => ({
      id: item.id,
      data: () => item
    }));
    return {
      docs,
      forEach: (callback) => docs.forEach(callback)
    };
  }

  async updateDoc(path, id, payload) {
    if (path === 'users') {
      const existing = localStorage.getItem('stressradar_user');
      const base = existing ? JSON.parse(existing) : {};
      const updated = { ...base, ...payload, uid: id };
      localStorage.setItem('stressradar_user', JSON.stringify(updated));
      return { id };
    }
    const { collection } = parsePath(path);
    const list = this._getCollection(collection);
    let updated = false;
    const newList = list.map(item => {
      if (item.id === id) {
        updated = true;
        return { ...item, ...payload };
      }
      return item;
    });
    if (updated) {
      this._saveCollection(collection, newList);
    }
    return { id };
  }

  async deleteDoc(path, id) {
    const { collection } = parsePath(path);
    const list = this._getCollection(collection);
    const filtered = list.filter(x => x.id !== id);
    this._saveCollection(collection, filtered);
  }
}

export const db = new DBClient();
export const auth = new AuthClient();
export const isMockFirebase = true;
export const getAuthToken = () => 'local_mock_token_123';
