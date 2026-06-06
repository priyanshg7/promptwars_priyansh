import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_name": "StressRadar",
      "tagline": "AI-Powered Wellness & Performance Tracker",
      "onboarding_title": "Setup Your Profile",
      "onboarding_subtitle": "Let's configure StressRadar to match your academic goals.",
      "name": "Name",
      "age": "Age",
      "grade": "Academic Year / Grade",
      "next": "Continue",
      "select_exams": "Select Your Target Exam(s)",
      "language_preference": "Choose Language Preference",
      "day0_baseline": "Day 0 Baseline Wellness",
      "sleep_quality": "Sleep Quality",
      "confidence": "Confidence Level",
      "study_hours": "Study Hours per Day",
      "finish_setup": "Complete Setup",
      "burnout_risk": "Burnout Risk Score",
      "exam_countdown": "Exam Countdown",
      "quick_vent": "Quick Vent Mic",
      "ai_insights": "Proactive AI Insights",
      "daily_checkin": "Daily Check-In",
      "checkin_complete": "Check-in Done Today",
      "checkin_pending": "Daily Check-in Pending",
      "motivation": "Study Motivation",
      "energy": "Physical Energy",
      "reaction_time": "Reaction Time Tap Test",
      "tap_prompt": "Tap as fast as you can when the circle glows!",
      "exam_vault": "Exam Vault",
      "study_planner": "AI Study Planner",
      "breathing_card": "Box Breathing (4-4-4-4)",
      "focus_mode": "Focus Mode",
      "score": "Score",
      "rank": "Rank",
      "percentile": "Percentile",
      "add_test": "Log New Test",
      "sign_off": "Seal Pact & Sign Off",
      "logout": "Logout",
      "hindi": "Hindi",
      "english": "English"
    }
  },
  hi: {
    translation: {
      "app_name": "स्ट्रेसरडार",
      "tagline": "एआई-संचालित मानसिक स्वास्थ्य और प्रदर्शन ट्रैकर",
      "onboarding_title": "अपना प्रोफाइल सेट करें",
      "onboarding_subtitle": "आइए आपके शैक्षणिक लक्ष्यों के अनुसार स्ट्रेसरडार को कॉन्फ़िगर करें।",
      "name": "नाम",
      "age": "आयु",
      "grade": "शैक्षणिक वर्ष / कक्षा",
      "next": "आगे बढ़ें",
      "select_exams": "अपनी लक्षित परीक्षा(एं) चुनें",
      "language_preference": "भाषा प्राथमिकता चुनें",
      "day0_baseline": "डे 0 बेसलाइन वेलनेस",
      "sleep_quality": "नींद की गुणवत्ता",
      "confidence": "आत्मविश्वास का स्तर",
      "study_hours": "प्रतिदिन पढ़ाई के घंटे",
      "finish_setup": "सेटअप पूरा करें",
      "burnout_risk": "बर्नआउट जोखिम स्कोर",
      "exam_countdown": "परीक्षा उलटी गिनती",
      "quick_vent": "क्विक वेंट माइक",
      "ai_insights": "सक्रिय एआई अंतर्दृष्टि",
      "daily_checkin": "दैनिक चेक-इन",
      "checkin_complete": "आज का चेक-इन पूरा",
      "checkin_pending": "दैनिक चेक-इन लंबित",
      "motivation": "पढ़ाई की प्रेरणा",
      "energy": "शारीरिक ऊर्जा",
      "reaction_time": "प्रतिक्रिया समय टैप टेस्ट",
      "tap_prompt": "जैसे ही गोला चमके, जितनी जल्दी हो सके टैप करें!",
      "exam_vault": "एग्जाम वॉल्ट",
      "study_planner": "एआई स्टडी प्लानर",
      "breathing_card": "बॉक्स ब्रीदिंग (4-4-4-4)",
      "focus_mode": "फोकस मोड",
      "score": "अंक",
      "rank": "रैंक",
      "percentile": "प्रतिशतता",
      "add_test": "नया टेस्ट दर्ज करें",
      "sign_off": "पैक्ट सील करें और साइन ऑफ करें",
      "logout": "लॉगआउट",
      "hindi": "हिंदी",
      "english": "अंग्रेज़ी"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
