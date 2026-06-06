import os
import json
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="StressRadar Backend", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY is not set in environment variables.")

# Helper to call Gemini model
def query_gemini(prompt: str, json_mode: bool = False) -> str:
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is not configured.")
    
    # Use gemini-1.5-flash for faster responses
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    generation_config = {}
    if json_mode:
        generation_config = {"response_mime_type": "application/json"}
        
    response = model.generate_content(prompt, generation_config=generation_config)
    return response.text

# Request Schemas
class VentRequest(BaseModel):
    text: str
    history: list = []
    language: str = "en"
    student_profile: dict = {}

class TaskSuggestRequest(BaseModel):
    task_title: str
    exam_type: str = "JEE"
    language: str = "en"

class InsightRequest(BaseModel):
    tests: list = []
    checkins: list = []
    language: str = "en"

class ChatRequest(BaseModel):
    message: str
    chat_history: list = []
    student_profile: dict = {}
    language: str = "en"

# MOCK FALLBACKS (for testing when Gemini API key is invalid/missing)
def get_mock_vent_response(text: str, language: str) -> dict:
    is_hindi = language == "hi"
    return {
        "stress_level": "medium",
        "trigger": "Mock exam preparation pressure" if not is_hindi else "मॉक टेस्ट परीक्षा का दबाव",
        "burnout_score_update": 58,
        "ai_response": "I hear you. Preparing for competitive exams is a marathon, not a sprint. Take a deep breath—we can break this syllabus down step-by-step." if not is_hindi else "मैं आपकी बात समझ सकता हूँ। प्रतियोगी परीक्षाओं की तैयारी एक लंबी दौड़ है। एक गहरी सांस लें—हम इस पाठ्यक्रम को कदम-दर-कदम पूरा करेंगे।"
    }

def get_mock_suggested_tasks(task_title: str, language: str) -> list:
    is_hindi = language == "hi"
    if is_hindi:
        return [
            f"1. {task_title} की बुनियादी अवधारणाओं को पढ़ें — 30 मिनट",
            f"2. {task_title} के 10 पिछले वर्षों के प्रश्न हल करें — 40 मिनट",
            "3. गलतियों की समीक्षा करें और नोट्स में सुधार करें — 15 मिनट"
        ]
    return [
        f"1. Read core concepts of {task_title} — 30 mins",
        f"2. Solve 10 mock problems of {task_title} — 45 mins",
        "3. Review incorrect answers & update notes — 15 mins"
    ]

def get_mock_insights(language: str) -> list:
    is_hindi = language == "hi"
    if is_hindi:
        return [
            {
                "title": "प्रदर्शन और तनाव का संबंध",
                "type": "warning",
                "description": "आपका गणित का स्कोर इस सप्ताह कम हुआ। यह उस उच्च तनाव के साथ मेल खाता है जो आपने परीक्षा से 2 दिन पहले दर्ज किया था। परीक्षा से पहले शांत रहना महत्वपूर्ण है।"
            },
            {
                "title": "सकारात्मक प्रगति!",
                "type": "success",
                "description": "जैसे-जैसे आपका सोने का समय बढ़ा है, आपकी ध्यान केंद्रित करने की गति में 40ms का सुधार हुआ है। इसे जारी रखें!"
            }
        ]
    return [
        {
            "title": "Stress & Performance Correlation",
            "type": "warning",
            "description": "Your math score dipped this week. This aligns with the high stress you logged 2 days before the test. Prioritizing rest before mocks could improve retention."
        },
        {
            "title": "Positive Sleep Trend",
            "type": "success",
            "description": "As your sleep duration increased, your cognitive reaction speed improved by 40ms. Keep maintaining consistent sleep hours!"
        }
    ]

# Endpoints
@app.post("/api/analyze-vent")
async def analyze_vent(req: VentRequest):
    is_hindi = req.language == "hi"
    
    # Prompt construction
    prompt = f"""
    You are StressRadar AI, a mental wellness and performance coach for Indian students.
    Analyze the following vocal vent text from a student preparing for competitive exams.
    
    Student Profile: {json.dumps(req.student_profile)}
    Emotional/Stress History: {json.dumps(req.history)}
    Student Vent Text: "{req.text}"
    Language Preference: {req.language} (hi = Hindi, en = English)
    
    Analyze the text and return a JSON object with:
    1. "stress_level": "low" or "medium" or "high"
    2. "trigger": A short 2-5 word description of the stress trigger (in the requested language)
    3. "burnout_score_update": A calculated burnout risk score (integer, 0-100) based on their current venting and history
    4. "ai_response": A warm, encouraging, conversational response as a senior mentor (in the requested language). If Hindi, write it in Devanagari script. Keep it concise (max 3 sentences).
    
    Format response strictly as JSON:
    {{
      "stress_level": "...",
      "trigger": "...",
      "burnout_score_update": 0-100,
      "ai_response": "..."
    }}
    """
    
    try:
        if not GEMINI_API_KEY:
            return get_mock_vent_response(req.text, req.language)
        
        response_text = query_gemini(prompt, json_mode=True)
        return json.loads(response_text)
    except Exception as e:
        print("Gemini analyze_vent error, falling back:", e)
        return get_mock_vent_response(req.text, req.language)


@app.post("/api/suggest-tasks")
async def suggest_tasks(req: TaskSuggestRequest):
    is_hindi = req.language == "hi"
    
    prompt = f"""
    You are an AI study planner helping a student preparing for {req.exam_type} exams.
    The student added a generic task: "{req.task_title}"
    
    Generate 3 specific, highly actionable micro-tasks to break down this generic task.
    Each micro-task must include an estimated completion time.
    Language: {req.language} (hi = Hindi, en = English)
    
    If Hindi is selected, generate task descriptions in Devanagari script. Keep them concise.
    
    Format response strictly as a JSON array of strings:
    [
      "1. ...",
      "2. ...",
      "3. ..."
    ]
    """
    
    try:
        if not GEMINI_API_KEY:
            return get_mock_suggested_tasks(req.task_title, req.language)
        
        response_text = query_gemini(prompt, json_mode=True)
        return json.loads(response_text)
    except Exception as e:
        print("Gemini suggest_tasks error, falling back:", e)
        return get_mock_suggested_tasks(req.task_title, req.language)


@app.post("/api/generate-insights")
async def generate_insights(req: InsightRequest):
    is_hindi = req.language == "hi"
    
    prompt = f"""
    You are StressRadar AI analyzing student mock test history and mental check-ins.
    Recent Mock Tests: {json.dumps(req.tests)}
    Recent Emotional Check-ins: {json.dumps(req.checkins)}
    Language: {req.language} (hi = Hindi, en = English)
    
    Generate 2 proactive wellness/academic insights. Look for correlations like:
    - Sleep quality drops preceding test score dips.
    - Anxiety levels rising on weeks with clustered test dates.
    - Speed/Reaction fatigue correlation with stress.
    
    Format response strictly as a JSON array of objects:
    [
      {{
        "title": "Insight Title",
        "type": "warning" or "success" or "info",
        "description": "Insight description (max 2 sentences, in the requested language)"
      }}
    ]
    """
    
    try:
        if not GEMINI_API_KEY:
            return get_mock_insights(req.language)
        
        response_text = query_gemini(prompt, json_mode=True)
        return json.loads(response_text)
    except Exception as e:
        print("Gemini generate_insights error, falling back:", e)
        return get_mock_insights(req.language)


@app.post("/api/chat")
async def chat(req: ChatRequest):
    is_hindi = req.language == "hi"
    
    history_prompt = ""
    for msg in req.chat_history:
        role_label = "User" if msg.get("role") == "user" else "Assistant"
        history_prompt += f"{role_label}: {msg.get('text')}\n"

    system_prompt = f"""
    You are a compassionate, expert AI Mental Wellness & Exam Mentor for Indian students.
    Student Profile: {json.dumps(req.student_profile)}
    
    Language preference: {req.language} (hi = Hindi, en = English)
    Important instruction:
    If language is 'hi' (Hindi), you MUST respond in warm, conversational Hindi written in Devanagari script.
    Avoid clinical/robotic terms. Sound like a supportive senior student or sibling.
    
    Guidelines:
    1. Address the student by name.
    2. Reference their target exam ({req.student_profile.get('targetExams', 'competitive exams')}) to personalize details.
    3. Keep answers concise, actionable, and focus on stress reduction, mental clarity, and consistent study habits.
    
    Current Chat History:
    {history_prompt}
    User: {req.message}
    Assistant:
    """
    
    try:
        if not GEMINI_API_KEY:
            mock_text = "I am here to support you. Let's work on managing your study load so you feel confident for your exams." if not is_hindi else "मैं यहाँ आपका समर्थन करने के लिए हूँ। आइए आपके अध्ययन के भार को प्रबंधित करने पर काम करें ताकि आप परीक्षा के लिए आश्वस्त महसूस करें।"
            return {"text": mock_text}
            
        response_text = query_gemini(system_prompt, json_mode=False)
        return {"text": response_text}
    except Exception as e:
        print("Gemini chat error, falling back:", e)
        mock_text = "I'm here. Tell me what's on your mind and we'll break it down together." if not is_hindi else "मैं यहाँ हूँ। मुझे बताएं कि आपके दिमाग में क्या चल रहा है और हम इसे मिलकर सुलझाएंगे।"
        return {"text": mock_text}

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "StressRadar FastAPI"}
