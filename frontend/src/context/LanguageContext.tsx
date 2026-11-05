"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SupportedLanguage =
  | "en"   // English
  | "or"   // ଓଡ଼ିଆ (Odia - Odisha)
  | "hi"   // हिन्दी (Hindi)
  | "bn"   // বাংলা (Bengali)
  | "te";  // తెలుగు (Telugu - Southern Border)

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", region: "National / Universal", flag: "🇮🇳" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", region: "State Official (Odisha)", flag: "🏛️" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "National / Universal", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "Northern Border (Balasore / Mayurbhanj)", flag: "🌿" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "Southern Border (Ganjam / Koraput)", flag: "🌾" },
];

export interface TranslationSchema {
  brandName: string;
  govBadge: string;
  kicker: string;
  title1: string;
  title2: string;
  title3: string;
  subtitle: string;
  highlightStates: string;
  ctaButton: string;
  mapStreet: string;
  mapTerrain: string;
  mapSatellite: string;
  legendTitle: string;
  legendSafe: string;
  legendRain: string;
  legendMud: string;
  legendLandslide: string;
  syncTitle: string;
  movingTrucks: string;
  aiBadge: string;
  aiTitle: string;
  aiSubtitle: string;
  aiWelcome: string;
  aiPlaceholder: string;
  aiReadOut: string;
  languageLabel: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationSchema> = {
  en: {
    brandName: "Odisha MargDarshak",
    govBadge: "Odisha Gov Logistics AI",
    kicker: "✦ GOVERNMENT OF ODISHA LOGISTICS & ACCESSIBILITY GRID",
    title1: "AI-Powered Logistics &",
    title2: "Accessibility Intelligence",
    title3: "for Odisha",
    subtitle: "Real-time road monitoring, multi-hazard risk prediction (floods, cyclones, landslides), and emergency supply coordination across all 30 Districts of Odisha with role-based access control.",
    highlightStates: "30 Districts of Odisha",
    ctaButton: "Login or Signup",
    mapStreet: "Street",
    mapTerrain: "Terrain",
    mapSatellite: "Satellite",
    legendTitle: "Road Risk Colors:",
    legendSafe: "Green: Safe / Passable",
    legendRain: "Yellow: Rain Caution / Heavy Flow",
    legendMud: "Orange: Waterlogged / Submergence Alert",
    legendLandslide: "Red: Critical Flood / Landslide Blockage",
    syncTitle: "30/30 Odisha Districts: 100% Spatial Sync",
    movingTrucks: "Supply Trucks Moving Live",
    aiBadge: "AI Copilot",
    aiTitle: "Odisha AI Copilot",
    aiSubtitle: "Logistics & Hazard Decision Support",
    aiWelcome: "Namaskar! I am Odisha MargDarshak AI Assistant 🤖. Ask me about real-time road conditions, flood and cyclone alerts, safe bypass routes, weather warnings, or live fleet status across all 30 districts of Odisha.",
    aiPlaceholder: "Ask AI Copilot (e.g. Baitarani flood status, Bhubaneswar to Balasore route, NH-16 updates)...",
    aiReadOut: "Read Out",
    languageLabel: "Language",
  },
  or: {
    brandName: "ଓଡ଼ିଶା ମାର୍ଗଦର୍ଶକ",
    govBadge: "ଓଡ଼ିଶା ସରକାରୀ ଲଜିଷ୍ଟିକ୍ସ ଏଆଇ",
    kicker: "✦ ଓଡ଼ିଶା ସରକାରୀ ଲଜିଷ୍ଟିକ୍ସ ଓ ଯୋଗାଯୋଗ ଗ୍ରିଡ୍",
    title1: "ଏଆଇ-ଚାଳିତ ସ୍ମାର୍ଟ ଲଜିଷ୍ଟିକ୍ସ ଏବଂ",
    title2: "ଯାତାୟାତ ସୁଗମତା ବୁଦ୍ଧିମତ୍ତା",
    title3: "ସମଗ୍ର ଓଡ଼ିଶା ପାଇଁ",
    subtitle: "ସମଗ୍ର ଓଡ଼ିଶାର ୩୦ଟି ଜିଲ୍ଲାରେ ରିୟଲ-ଟାଇମ୍ ସଡ଼କ ନିରୀକ୍ଷଣ, ବନ୍ୟା-ବାତ୍ୟା-ଭୂସ୍ଖଳନ ବିପଦ ପୂର୍ବାନୁମାନ ଏବଂ ଜରୁରୀକାଳୀନ ଯୋଗାଣ ସମନ୍ୱୟ ପ୍ରଣାଳୀ।",
    highlightStates: "ଓଡ଼ିଶାର ୩୦ଟି ଜିଲ୍ଲା",
    ctaButton: "ଲଗ୍ ଇନ୍ କିମ୍ବା ପଞ୍ଜୀକରଣ କରନ୍ତୁ",
    mapStreet: "ରାସ୍ତା",
    mapTerrain: "ଭୂଭାଗ",
    mapSatellite: "ଉପଗ୍ରହ",
    legendTitle: "ସଡ଼କ ବିପଦ ରଙ୍ଗ ସୂଚନା:",
    legendSafe: "ସବୁଜ: ସୁରକ୍ଷିତ ମାର୍ଗ",
    legendRain: "ହଳଦିଆ: ବର୍ଷା ସତର୍କତା",
    legendMud: "କମଳା: ଜଳମଗ୍ନ / କାଦୁଅ ବିପଦ",
    legendLandslide: "ନାଲି: ଗୁରୁତର ବନ୍ୟା / ଅବରୋଧ",
    syncTitle: "୩୦/୩୦ ଓଡ଼ିଶା ଜିଲ୍ଲା: ସମ୍ପୂର୍ଣ୍ଣ ସ୍ଥାନିକ ସମନ୍ୱୟ",
    movingTrucks: "ଲାଇଭ୍ ଚଳାଚଳ ଟ୍ରକ୍",
    aiBadge: "ଏଆଇ ସହାୟକ",
    aiTitle: "ଓଡ଼ିଶା ଏଆଇ ମାର୍ଗଦର୍ଶକ",
    aiSubtitle: "ଲଜିଷ୍ଟିକ୍ସ ଓ ବିପର୍ଯ୍ୟୟ ପରିଚାଳନା ନିଷ୍ପତ୍ତି ସହାୟତା",
    aiWelcome: "ନମସ୍କାର! ମୁଁ ଓଡ଼ିଶା ମାର୍ଗଦର୍ଶକ ଏଆଇ ସହାୟକ 🤖। ମୋତେ ଓଡ଼ିଶାର ରାଜପଥ ସ୍ଥିତି, ବନ୍ୟା ଓ ବାତ୍ୟା ସତର୍କତା, ସୁରକ୍ଷିତ ବିକଳ୍ପ ମାର୍ଗ କିମ୍ବା ଜରୁରୀ ଯୋଗାଣ ବିଷୟରେ ପଚାରନ୍ତୁ।",
    aiPlaceholder: "ଏଆଇ ସହାୟକଙ୍କୁ ପଚାରନ୍ତୁ (ଯଥା: ବୈତରଣୀ ବନ୍ୟା ସ୍ଥିତି, ଭୁବନେଶ୍ୱରରୁ ବାଲେଶ୍ୱର ସୁରକ୍ଷିତ ମାର୍ଗ)...",
    aiReadOut: "ଶୁଣନ୍ତୁ",
    languageLabel: "ଭାଷା ବାଛନ୍ତୁ",
  },
  hi: {
    brandName: "ओडिशा मार्गदर्शक",
    govBadge: "ओडिशा सरकारी रसद एवं आपदा AI",
    kicker: "✦ ओडिशा सरकारी रसद और सुगमता नेटवर्क ग्रिड",
    title1: "AI-संचालित रसद एवं",
    title2: "सुगमता बुद्धिमत्ता प्रणाली",
    title3: "समग्र ओडिशा हेतु",
    subtitle: "ओडिशा के सभी ३० जिलों में रीयल-टाइम सड़क निगरानी, बाढ़-चक्रवात-भूस्खलन जोखिम पूर्वानुमान और आपातकालीन आपूर्ति समन्वय प्रणाली।",
    highlightStates: "ओडिशा के ३० जिलों",
    ctaButton: "लॉग इन या साइन अप करें",
    mapStreet: "सड़क",
    mapTerrain: "भूभाग / पहाड़",
    mapSatellite: "उपग्रह",
    legendTitle: "सड़क जोखिम रंग:",
    legendSafe: "हरा: सुरक्षित मार्ग",
    legendRain: "पीला: वर्षा सावधानी",
    legendMud: "नारंगी: जलभराव व फिसलन",
    legendLandslide: "लाल: गंभीर बाढ़ / भूस्खलन अवरोध",
    syncTitle: "३०/३० ओडिशा जिले: पूर्ण स्थानिक समन्वय",
    movingTrucks: "ट्रक लाइव चल रहे हैं",
    aiBadge: "AI सहायक",
    aiTitle: "ओडिशा AI सहायक",
    aiSubtitle: "रसद एवं आपदा निर्णय सहायता",
    aiWelcome: "नमस्ते! मैं आपका ओडिशा मार्गदर्शक AI सहायक हूँ 🤖। मुझसे ओडिशा के किसी भी राजमार्ग, बाढ़ या चक्रवात चेतावनी, सुरक्षित बाईपास या लाइव वाहनों की स्थिति पूछें।",
    aiPlaceholder: "AI सहायक से पूछें (उदा. वैतरणी नदी बाढ़ स्थिति, भुवनेश्वर से बालेश्वर सुरक्षित मार्ग)...",
    aiReadOut: "बोलकर सुनें",
    languageLabel: "भाषा चुनें",
  },
  bn: {
    brandName: "ওড়িশা মার্গদর্শক",
    govBadge: "ওড়িশা সরকারি লজিস্টিক এআই",
    kicker: "✦ ওড়িশা সরকারি লজিস্টিক ও যোগাযোগ গ্রিড",
    title1: "এআই-চালিত স্মার্ট লজিস্টিক ও",
    title2: "যোগাযোগ সুগমতা বুদ্ধিমত্তা",
    title3: "সমগ্র ওড়িশার জন্য",
    subtitle: "ওড়িশার ৩০টি জেলায় রিয়েল-টাইম রাস্তা পর্যবেক্ষণ, বন্যা ও ঘূর্ণিঝড় ঝুঁকি পূর্বাভাস এবং জরুরি ত্রাণ সরবরাহ সমন্বয়।",
    highlightStates: "ওড়িশার ৩০টি জেলায়",
    ctaButton: "লগ ইন বা সাইন আপ করুন",
    mapStreet: "রাস্তা",
    mapTerrain: "ভূখণ্ড",
    mapSatellite: "স্যাটেলাইট",
    legendTitle: "রাস্তার ঝুঁকির রঙ:",
    legendSafe: "সবুজ: নিরাপদ পথ",
    legendRain: "হলুদ: বৃষ্টি সতর্কতা",
    legendMud: "কমলা: জলমগ্ন পথ",
    legendLandslide: "লাল: মারাত্মক বন্যা / ভূমিধস অবরোধ",
    syncTitle: "৩০/৩০ ওড়িশা জেলা: ১০০% সিঙ্ক",
    movingTrucks: "ট্রাকগুলি লাইভ চলছে",
    aiBadge: "এআই সহকারী",
    aiTitle: "ওড়িশা এআই সহকারী",
    aiSubtitle: "লজিস্টিক ও দুর্যোগ সিদ্ধান্ত সহায়তা",
    aiWelcome: "নমস্কার! আমি ওড়িশা মার্গদর্শক এআই সহকারী 🤖। আমাকে যেকোনো হাইওয়ে পরিস্থিতি, বন্যা বা নিরাপদ রুট সম্পর্কে জিজ্ঞেস করুন।",
    aiPlaceholder: "এআই সহকারীকে জিজ্ঞাসা করুন (যেমন: বৈতরণী বন্যা পরিস্থিতি, ভুবনেশ্বর থেকে বালেশ্বর রুট)...",
    aiReadOut: "শুনুন",
    languageLabel: "ভাষা নির্বাচন",
  },
  te: {
    brandName: "ఒడిశా మార్గదర్శక్",
    govBadge: "ఒడిశా ప్రభుత్వ లాజిస్టిక్స్ AI",
    kicker: "✦ ఒడిశా ప్రభుత్వ లాజిస్టిక్స్ & రవాణా నెట్‌వర్క్",
    title1: "AI ఆధారిత స్మార్ట్ లాజిస్టిక్స్ &",
    title2: "రవాణా సౌలభ్య వ్యవస్థ",
    title3: "ఒడిశా రాష్ట్రం కోసం",
    subtitle: "ఒడిశాలోని 30 జిల్లాల్లో రియల్-టైమ్ రోడ్డు పర్యవేక్షణ, వరదలు-తుఫానుల ముందస్తు హెచ్చరికలు మరియు అత్యవసర సరఫరా సమన్వయం.",
    highlightStates: "ఒడిశాలోని 30 జిల్లాలు",
    ctaButton: "లాగిన్ / రిజిస్టర్ చేసుకోండి",
    mapStreet: "రహదారి",
    mapTerrain: "భూభాగం",
    mapSatellite: "ఉపగ్రహం",
    legendTitle: "రోడ్డు ప్రమాద రంగులు:",
    legendSafe: "ఆకుపచ్చ: సురక్షిత మార్గం",
    legendRain: "పసుపు: వర్షపు హెచ్చరిక",
    legendMud: "నారింజ: నీటి నిల్వ / జారే మార్గం",
    legendLandslide: "ఎరుపు: తీవ్రమైన వరద / కొండచరియల అడ్డంకి",
    syncTitle: "30/30 ఒడిశా జిల్లాలు: పూర్తి స్థానిక సమన్వయం",
    movingTrucks: "వాహనాలు లైవ్‌గా కదులుతున్నాయి",
    aiBadge: "AI సహాయకుడు",
    aiTitle: "ఒడిశా AI సహాయకుడు",
    aiSubtitle: "లాజిస్టిక్స్ & విపత్తు నిర్ణయ మద్దతు",
    aiWelcome: "నమస్కారం! నేను ఒడిశా మార్గదర్శక్ AI సహాయకుడిని 🤖. ఒడిశా హైవేల పరిస్థితి, వరదలు లేదా సురక్షిత ప్రత్యామ్నాయ మార్గాల గురించి నన్ను అడగండి.",
    aiPlaceholder: "AI సహాయకుడిని అడగండి (ఉదా. వైతరణి వరద పరిస్థితి, భువనేశ్వర్ నుండి బాలేశ్వర్ మార్గం)...",
    aiReadOut: "వినండి",
    languageLabel: "భాషను ఎంచుకోండి",
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationSchema;
  currentMeta: LanguageMeta;
  languages: LanguageMeta[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const saved = (localStorage.getItem("odisha_user_language") || localStorage.getItem("ner_user_language")) as SupportedLanguage;
    if (saved && TRANSLATIONS[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
      localStorage.setItem("odisha_user_language", lang);
    }
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const currentMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentMeta,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
