"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type SupportedLanguage =
  | "en"   // English
  | "hi"   // हिन्दी (Hindi)
  | "as"   // অসমীয়া (Assamese - Assam)
  | "bn"   // বাংলা (Bengali - Tripura/Barak)
  | "mni"  // মৈতৈলোন্ (Manipuri - Manipur)
  | "lus"  // Mizo ṭawng (Mizo - Mizoram)
  | "kha"  // Ka Ktien Khasi (Khasi - Meghalaya)
  | "grt"  // A·chik (Garo - Meghalaya)
  | "brx"  // बर' (Bodo - Bodoland)
  | "nag"  // Nagamese (Nagaland)
  | "ne"   // नेपाली (Nepali - Sikkim)
  | "trp";  // Kokborok (Tripura)

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", region: "National / Universal", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "National / Northern", flag: "🇮🇳" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", region: "Assam & Brahmaputra", flag: "🦏" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "Tripura & Barak Valley", flag: "🌿" },
  { code: "mni", name: "Manipuri", nativeName: "মৈতৈলোন্ (Meitei)", region: "Manipur & Imphal", flag: "🏔️" },
  { code: "lus", name: "Mizo", nativeName: "Mizo ṭawng", region: "Mizoram & Lushai Hills", flag: "⛰️" },
  { code: "kha", name: "Khasi", nativeName: "Ka Ktien Khasi", region: "Meghalaya & Shillong", flag: "🌧️" },
  { code: "grt", name: "Garo", nativeName: "A·chik (Garo)", region: "Garo Hills & Tura", flag: "🍃" },
  { code: "brx", name: "Bodo", nativeName: "बर' (Bodo)", region: "Bodoland (BTR)", flag: "🌾" },
  { code: "nag", name: "Nagamese", nativeName: "Nagamese Creole", region: "Nagaland & Hills", flag: "🦅" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली (Nepali)", region: "Sikkim & Kalimpong", flag: "🏔️" },
  { code: "trp", name: "Kokborok", nativeName: "Kokborok", region: "Tripura Tribal Hills", flag: "🌄" },
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
    brandName: "NER–MargDarshak",
    govBadge: "Gov Logistics AI",
    kicker: "✦ GOVERNMENT LOGISTICS & ACCESSIBILITY GRID",
    title1: "AI-Powered Logistics &",
    title2: "Accessibility Intelligence",
    title3: "for NER",
    subtitle: "Real-time road monitoring, predictive landslide risk, and emergency supply coordination across the 8 North Eastern States with role-based access control.",
    highlightStates: "8 North Eastern States",
    ctaButton: "Login or Signup",
    mapStreet: "Street",
    mapTerrain: "Terrain",
    mapSatellite: "Satellite",
    legendTitle: "Road Risk Colors:",
    legendSafe: "Green: Safe",
    legendRain: "Yellow: Rain Caution",
    legendMud: "Orange: Mud / Sinking Hazard",
    legendLandslide: "Red: Critical Landslide Blockage",
    syncTitle: "8/8 NER States: 100% Spatial Sync",
    movingTrucks: "Trucks Moving Live",
    aiBadge: "AI Copilot",
    aiTitle: "NER AI Copilot",
    aiSubtitle: "Logistics & Landslide Decision Support",
    aiWelcome: "Namaste! I am NER–MargDarshak AI Assistant 🤖. Ask me about real-time road conditions, active landslides, safe bypass routes, weather alerts, or live fleet status across all 8 North Eastern States.",
    aiPlaceholder: "Ask AI Copilot (e.g. Sonapur landslide status, Guwahati to Silchar route)...",
    aiReadOut: "Read Out",
    languageLabel: "Language",
  },
  hi: {
    brandName: "एनईआर–मार्गदर्शक",
    govBadge: "सरकारी रसद एवं आपदा AI",
    kicker: "✦ सरकारी रसद और सुगमता नेटवर्क ग्रिड",
    title1: "AI-संचालित रसद एवं",
    title2: "सुगमता बुद्धिमत्ता प्रणाली",
    title3: "पूर्वोत्तर राज्यों हेतु",
    subtitle: "८ पूर्वोत्तर राज्यों में रीयल-टाइम सड़क निगरानी, भूस्खलन जोखिम पूर्वानुमान और आपातकालीन आपूर्ति समन्वय प्रणाली।",
    highlightStates: "८ पूर्वोत्तर राज्यों",
    ctaButton: "लॉग इन या साइन अप करें",
    mapStreet: "सड़क",
    mapTerrain: "भूभाग / पहाड़",
    mapSatellite: "उपग्रह",
    legendTitle: "सड़क जोखिम रंग:",
    legendSafe: "हरा: सुरक्षित मार्ग",
    legendRain: "पीला: वर्षा सावधानी",
    legendMud: "नारंगी: कीचड़ व फिसलन",
    legendLandslide: "लाल: गंभीर भूस्खलन अवरोध",
    syncTitle: "८/८ पूर्वोत्तर राज्य: पूर्ण स्थानिक समन्वय",
    movingTrucks: "ट्रक लाइव चल रहे हैं",
    aiBadge: "AI सहायक",
    aiTitle: "एनईआर AI सहायक",
    aiSubtitle: "रसद एवं भूस्खलन निर्णय सहायता",
    aiWelcome: "नमस्ते! मैं आपका एनईआर–मार्गदर्शक AI सहायक हूँ 🤖। मुझसे पूर्वोत्तर के किसी भी राजमार्ग, भूस्खलन चेतावनी, सुरक्षित बाईपास या लाइव वाहनों की जानकारी पूछें।",
    aiPlaceholder: "AI सहायक से पूछें (उदा. सोनापुर सुरंग भूस्खलन स्थिति, गुवाहाटी से सिलचर सुरक्षित मार्ग)...",
    aiReadOut: "बोलकर सुनें",
    languageLabel: "भाषा चुनें",
  },
  as: {
    brandName: "এনইআৰ–মাৰ্গদৰ্শক",
    govBadge: "চৰকাৰী লজিষ্টিক আৰু দুৰ্যোগ এআই",
    kicker: "✦ চৰকাৰী লজিষ্টিক আৰু যাতায়াত সুগমতা গ্ৰিড",
    title1: "এআই-চালিত লজিষ্টিক আৰু",
    title2: "যাতায়াত সুগমতা বুদ্ধিমত্তা",
    title3: "উত্তৰ-পূৰ্বাঞ্চলৰ বাবে",
    subtitle: "৮খন উত্তৰ-পূৰ্বাঞ্চলীয় ৰাজ্যত প্ৰকৃত সময়ৰ পথ নিৰীক্ষণ, ভূমিস্খলনৰ পূৰ্বানুমান আৰু জৰুৰীকালীন সামগ্ৰী যোগান সমন্বয়।",
    highlightStates: "৮খন উত্তৰ-পূৰ্বাঞ্চলীয় ৰাজ্যত",
    ctaButton: "লগ ইন বা ছাইন আপ কৰক",
    mapStreet: "পথ",
    mapTerrain: "ভূখণ্ড / পাহাৰ",
    mapSatellite: "উপগ্ৰহ",
    legendTitle: "পথৰ বিপদৰ ৰং:",
    legendSafe: "সেউজীয়া: সুৰক্ষিত",
    legendRain: "হালধীয়া: বৰষুণ সতৰ্কতা",
    legendMud: "কমলা: বোকা / পিচল পথ",
    legendLandslide: "ৰঙা: ভূমিস্খলন আৱৰোধ",
    syncTitle: "৮/৮ উত্তৰ-পূৰ্ব ৰাজ্য: ১০০% সংযুক্ত",
    movingTrucks: "ট্ৰাকসমূহ লাইভ চলি আছে",
    aiBadge: "এআই সহায়ক",
    aiTitle: "এনইআৰ এআই সহায়ক",
    aiSubtitle: "লজিষ্টিক আৰু ভূমিস্খলন সিদ্ধান্ত সমৰ্থন",
    aiWelcome: "নমস্কাৰ! মই এনইআৰ–মাৰ্গদৰ্শক এআই সহায়ক 🤖। মোক পথৰ অৱস্থা, ভূমিস্খলনৰ সতৰ্কবাৰ্তা বা সুৰক্ষিত বাইপাছ সম্পৰ্কে সোধক।",
    aiPlaceholder: "এআই সহায়কক সোধক (যেনে: সোণাপুৰ সুৰংগৰ ভূমিস্খলন, গুৱাহাটীৰ পৰা শিলচৰৰ সুৰক্ষিত পথ)...",
    aiReadOut: "শুনক",
    languageLabel: "ভাষা",
  },
  bn: {
    brandName: "এনইআর–মার্গদর্শক",
    govBadge: "সরকারি লজিস্টিক ও দুর্যোগ এআই",
    kicker: "✦ সরকারি লজিস্টিক ও যোগাযোগ সুগমতা গ্রিড",
    title1: "এআই-চালিত লজিস্টিক ও",
    title2: "যোগাযোগ সুগমতা বুদ্ধিমত্তা",
    title3: "উত্তর-পূর্বাঞ্চলের জন্য",
    subtitle: "৮টি উত্তর-পূর্ব রাজ্যে রিয়েল-টাইম রাস্তা পর্যবেক্ষণ, ভূমিধস ঝুঁকি পূর্বাভাস এবং জরুরি ত্রাণ সরবরাহ সমন্বয়।",
    highlightStates: "৮টি উত্তর-পূর্ব রাজ্যে",
    ctaButton: "লগ ইন বা সাইন আপ করুন",
    mapStreet: "রাস্তা",
    mapTerrain: "পাহাড় / ভূখণ্ড",
    mapSatellite: "স্যাটেলাইট",
    legendTitle: "রাস্তার ঝুঁকির রঙ:",
    legendSafe: "সবুজ: নিরাপদ পথ",
    legendRain: "হলুদ: বৃষ্টি সতর্কতা",
    legendMud: "কমলা: কাদা / পিচ্ছিল পথ",
    legendLandslide: "লাল: মারাত্মক ভূমিধস অবরোধ",
    syncTitle: "৮/৮ উত্তর-পূর্ব রাজ্য: ১০০% সিঙ্ক",
    movingTrucks: "ট্রাকগুলি লাইভ চলছে",
    aiBadge: "এআই সহকারী",
    aiTitle: "এনইআর এআই সহকারী",
    aiSubtitle: "লজিস্টিক ও ভূমিধস সিদ্ধান্ত সহায়তা",
    aiWelcome: "নমস্কার! আমি এনইআর–মার্গদর্শক এআই সহকারী 🤖। আমাকে যেকোনো হাইওয়ে পরিস্থিতি, ভূমিধস বা নিরাপদ রুট সম্পর্কে জিজ্ঞেস করুন।",
    aiPlaceholder: "এআই সহকারীকে জিজ্ঞাসা করুন (যেমন: সোনামুখী/সোনাপুর টানেল ভূমিধস, নিরাপদ বাইপাস)...",
    aiReadOut: "শুনুন",
    languageLabel: "ভাষা নির্বাচন",
  },
  mni: {
    brandName: "NER–MargDarshak",
    govBadge: "লৈঙাক্কী লজিস্তিক অমসুং এআই",
    kicker: "✦ লৈঙাক্কী লজিস্তিক অমসুং চৎ-থোক চৎ-শিন গ্রিদ",
    title1: "এআই-না চলাইবা লজিস্তিক অমসুং",
    title2: "চৎ-থোক চৎ-শিনগী লৌশিং",
    title3: "অৱাং-নোংপোক লমদমগীদমক",
    subtitle: "অৱাং-নোংপোক স্তেত ৮ দা অশেংবা মতমগী লম্বী য়েংশিনবা, ঈচাউ-লৈবাক নিংথিনবা খঙদোকপা অমসুং খুদোংথীবা মতমগী মতেং।",
    highlightStates: "অৱাং-নোংপোক স্তেত ৮",
    ctaButton: "লগ ইন নত্রগা সাইন অপ তৌবীয়ু",
    mapStreet: "লম্বী",
    mapTerrain: "চিঙগী লমদম",
    mapSatellite: "সেতেলাইত",
    legendTitle: "লম্বীগী খুদোংথীবা মচুগী ৱাহন্থোক:",
    legendSafe: "আশংবা: শাফবা লম্বী",
    legendRain: "হিকপা: নোংগী চেকশিনৱা",
    legendMud: "অঙাংবা-হিকপা: লৈবাক নিংথিংবা",
    legendLandslide: "অঙাংবা: লৈবাক নিংবা অচৌবা",
    syncTitle: "৮/৮ অৱাং-নোংপোক স্তেত: ১০০% শম্নবা",
    movingTrucks: "গারীশিং লাইভ চৎলি",
    aiBadge: "এআই মতেংপাংবা",
    aiTitle: "NER এআই মতেংপাংবা",
    aiSubtitle: "লজিস্তিক অমসুং লম্বীগী ৱারেপ লৌবদা মতেং",
    aiWelcome: "খুরুমজরি! ঐহাক NER–MargDarshak এআই মতেংপাংবনি 🤖। লম্বীগী ফীভম, লৈবাক নিংবা নত্রগা শাফবা লম্বীগী মতাংদা হংবীয়ু।",
    aiPlaceholder: "এআই মতেংপাংবদা হংবীয়ু (য়েন্তোম্বা: সোনপুর তনেলগী লৈবাক নিংবা ফীভম, ইম্ফাল লম্বী)...",
    aiReadOut: "তাকপীয়ু",
    languageLabel: "লোল খনবীয়ু",
  },
  lus: {
    brandName: "NER–MargDarshak",
    govBadge: "Sorkar Phurhchhuah & AI",
    kicker: "✦ SORKAR PHURHCHHUAH LEH KAWNG ZINNA GRID",
    title1: "AI Hmanga Phurhchhuah Leh",
    title2: "Kawng Zin Awlsamna Finna",
    title3: "Hmarchhak State Tan",
    subtitle: "Hmarchhak state 8-ah real-time kawng dinhmun, leimin hlauhawm hriattirna leh chhawmdawlna bungrua semchhuah ruahmanna.",
    highlightStates: "Hmarchhak state 8-ah",
    ctaButton: "Lut Rawh / Inziahlut Rawh",
    mapStreet: "Kawngpui",
    mapTerrain: "Tlangram",
    mapSatellite: "Satellite",
    legendTitle: "Kawng Hlauhawm Rawngte:",
    legendSafe: "Hring: Him Tawk",
    legendRain: "Eng: Ruah Sur Fimkhur",
    legendMud: "Senduk: Leimin / Chirh",
    legendLandslide: "Sen: Leimin Liana Kawng Ping",
    syncTitle: "State 8/8: 100% Inthlunzawm",
    movingTrucks: "Truck-te an kal mek",
    aiBadge: "AI Ṭanpuitu",
    aiTitle: "NER AI Ṭanpuitu",
    aiSubtitle: "Kawng leh Leimin Dinhmun Hrilhtu",
    aiWelcome: "Chibai! NER–MargDarshak AI ṭanpuitu ka ni e 🤖. Hmarchhak kawngpui dinhmun, leimin leh lirthei kalphung zawh theih reng ka ni.",
    aiPlaceholder: "AI Ṭanpuitu zawt rawh (entirnan: Sonapur leimin dinhmun, Guwahati atanga Silchar kawng)...",
    aiReadOut: "Chhiar Rawh",
    languageLabel: "Ṭawng Thlang Rawh",
  },
  kha: {
    brandName: "NER–MargDarshak",
    govBadge: "Ka AI Ban Pynsuk Ia Ka Kit Ka Bah",
    kicker: "✦ KA KOR SORKAR PYNSUK JINGLEIT JINGWAN",
    title1: "Ka AI ba pyniaid ia ka kit ka bah &",
    title2: "Ka Jingtip Shaphang Ki Lad Jingjngoh",
    title3: "na ka bynta ka NER",
    subtitle: "Ka jingpeit bniah ia ki surok, ka jingma na ka jingtwa khyndew bad ka jingiarap kyrkieh ha ki 8 tylli ki Jylla Hmarchhak.",
    highlightStates: "8 tylli ki Jylla Hmarchhak",
    ctaButton: "Login / Pyniasoh",
    mapStreet: "Surok",
    mapTerrain: "Lum",
    mapSatellite: "Satellite",
    legendTitle: "Kiba Pyni Ia Ka Jingma:",
    legendSafe: "Jyrngam: Bha / Shngain",
    legendRain: "Stem: Slap Jingma",
    legendMud: "Saw-Stem: Khyndew Dait",
    legendLandslide: "Saw: Ka Jingtwa Kaba Jur",
    syncTitle: "8/8 Ki Jylla: 100% Pyniasoh",
    movingTrucks: "Ki truck ki dang iaid",
    aiBadge: "AI Nongiarap",
    aiTitle: "NER AI Nongiarap",
    aiSubtitle: "Jingpynbeit Surok & Jingtwa Khyndew",
    aiWelcome: "Khublei! Nga dei u NER–MargDarshak AI 🤖. Kylli ia nga shaphang ki surok, jingtwa khyndew lane ki lynti ba shngain.",
    aiPlaceholder: "Kylli ia u AI (nuksa: Sonapur tunnel twa khyndew, Guwahati sha Silchar)...",
    aiReadOut: "Sngap",
    languageLabel: "Ktien",
  },
  grt: {
    brandName: "NER–MargDarshak",
    govBadge: "Sorkarini Bostu Salgipa AI",
    kicker: "✦ SORKARNI RAMA LEH BOSTU SALANI GRID",
    title1: "AI-chi Chalaienggipa Bostu Salani &",
    title2: "Rama Reani Senggipa U·iani",
    title3: "NER-na gita",
    subtitle: "North East-ni state 8-o ramarangko niani, a·a beani a·selrangko u·iani aro emergency dakchakaniko re·atani.",
    highlightStates: "North East-ni state 8-o",
    ctaButton: "Napbo / Biming Sebo",
    mapStreet: "Rama",
    mapTerrain: "A·bri",
    mapSatellite: "Satellite",
    legendTitle: "Rama Kenani Rongrang:",
    legendSafe: "Tangsek: Namgipa",
    legendRain: "Rimit: Mikkang Kenani",
    legendMud: "Bokrim: A·dubek Kenani",
    legendLandslide: "Gitchak: A·a Beani Dal·gipa",
    syncTitle: "8/8 State-rang: 100% Nangrimgimin",
    movingTrucks: "Truck-rang re·enggipa",
    aiBadge: "AI Dakchakgipa",
    aiTitle: "NER AI Dakchakgipa",
    aiSubtitle: "Rama & A·a Beani U·igipa",
    aiWelcome: "Salam! Anga NER–MargDarshak AI Dakchakgipa ong·a 🤖. Ramarangni gimin aro a·a beaniko sing·bo.",
    aiPlaceholder: "AI-ko sing·bo (Sonapur tunnel a·a beani, Guwahationi Silcharna rama)...",
    aiReadOut: "Knatsotbo",
    languageLabel: "Ku·sik",
  },
  brx: {
    brandName: "NER–MargDarshak",
    govBadge: "सोरखारि लांथिं-लांथां एआई",
    kicker: "✦ सोरखारि लांथिं-लांथां आरो दावबायनाय ग्रिड",
    title1: "AI-जों दैदेनजानाय लांथिं-लांथां आरो",
    title2: "दावबायनाय गोरोबथा गोहो",
    title3: "सा-सान्जा हादोरसानि थाखाय",
    subtitle: "सा-सान्जा हादोरसानि ८ खनथायाव समाव लामा नायदिंथि, हा बानायनाय खिसिन आरो गोनांथार मदद फानथावनाय।",
    highlightStates: "सा-सान्जा हादोरसानि ८ खनथायाव",
    ctaButton: "हाब / मुं थिसन",
    mapStreet: "लामा",
    mapTerrain: "हाजो / अंचल",
    mapSatellite: "सेटेलाइट",
    legendTitle: "लामा खैभम गाबफोर:",
    legendSafe: "गोथां: रैखाथि",
    legendRain: "गोमो: अखा हुशियर",
    legendMud: "कमला: हा सिबनाय",
    legendLandslide: "गोजा: गोख्रों हा बानायनाय",
    syncTitle: "८/८ हादोरसा: १००% खौसेथि",
    movingTrucks: "ट्रकफोरा सोलिदों",
    aiBadge: "एआई हेफाजाबगिरि",
    aiTitle: "NER एआई हेफाजाबगिरि",
    aiSubtitle: "लामा आरो हा बानायनाय सान्थौ",
    aiWelcome: "खुलुमबाय! आं NER–MargDarshak एआई हेफाजाबगिरि 🤖। लामा आरो हा बानायनायनि खौरां सोबनो हागोन।",
    aiPlaceholder: "एआई-नो सों (सोनापुर टनेल हा बानायनाय, गुवाहाटीनिफ्राय सिलचर लामा)...",
    aiReadOut: "खोनासं",
    languageLabel: "राव सायख'",
  },
  nag: {
    brandName: "NER–MargDarshak",
    govBadge: "Government Logistics AI",
    kicker: "✦ GOVERNMENT LOGISTICS ARU RASTA SAFETY GRID",
    title1: "AI-Powered Logistics Aru",
    title2: "Rasta Accessibility Intelligence",
    title3: "North East State karone",
    subtitle: "8 ta North East states te real-time rasta checking, landslide risk alert aru emergency supply truck delivery system.",
    highlightStates: "8 ta North East states",
    ctaButton: "Login or Signup Koribi",
    mapStreet: "Rasta",
    mapTerrain: "Pahar",
    mapSatellite: "Satellite",
    legendTitle: "Rasta Danger Colors:",
    legendSafe: "Green: Safe Rasta",
    legendRain: "Yellow: Barish Caution",
    legendMud: "Orange: Kichor / Slip Danger",
    legendLandslide: "Red: Bhal Landslide Blockage",
    syncTitle: "8/8 States: 100% Live Sync",
    movingTrucks: "Truck khan live cholise",
    aiBadge: "AI Helper",
    aiTitle: "NER AI Helper",
    aiSubtitle: "Rasta aru Landslide Decision Support",
    aiWelcome: "Namaste! Ami NER–MargDarshak AI Helper ase 🤖. Rasta condition, landslide alert aru safe bypass rasta kotha hudibi.",
    aiPlaceholder: "AI ke hudibi (Sonapur landslide update, Guwahati pora Silchar safe road)...",
    aiReadOut: "Huni Lobi",
    languageLabel: "Language Chuno",
  },
  ne: {
    brandName: "एनईआर–मार्गदर्शक",
    govBadge: "सरकारी रसद तथा विपद् एआई",
    kicker: "✦ सरकारी रसद तथा पहुँच योग्यता ग्रिड",
    title1: "AI-सञ्चालित रसद तथा",
    title2: "पहुँच योग्यता गुप्तचर प्रणाली",
    title3: "पूर्वोत्तर क्षेत्रका लागि",
    subtitle: "८ पूर्वोत्तर राज्यहरूमा वास्तविक-समय सडक निगरानी, पहिरो जोखिम पूर्वानुमान तथा आपतकालीन आपूर्ति समन्वय प्रणाली।",
    highlightStates: "८ पूर्वोत्तर राज्यहरूमा",
    ctaButton: "लगइन वा साइन अप गर्नुहोस्",
    mapStreet: "सडक",
    mapTerrain: "भूभाग / हिमाल",
    mapSatellite: "उपग्रह",
    legendTitle: "सडक जोखिम रङ्गहरू:",
    legendSafe: "हरियो: सुरक्षित सडक",
    legendRain: "पहेंलो: वर्षा सावधानी",
    legendMud: "सुन्तला: हिलो / चिप्लो खतरा",
    legendLandslide: "रातो: गम्भीर पहिरो अवरोध",
    syncTitle: "८/८ पूर्वोत्तर राज्य: १००% प्रत्यक्ष समन्वय",
    movingTrucks: "ट्रकहरू प्रत्यक्ष गुडिरहेका छन्",
    aiBadge: "AI सहायक",
    aiTitle: "एनईआर AI सहायक",
    aiSubtitle: "रसद तथा पहिरो निर्णय समर्थन",
    aiWelcome: "नमस्ते! म एनईआर–मार्गदर्शक AI सहायक हुँ 🤖। सडकको अवस्था, पहिरोको चेतावनी वा सुरक्षित वैकल्पिक मार्ग बारे सोध्नुहोस्।",
    aiPlaceholder: "AI सहायकलाई सोध्नुहोस् (जस्तै: सोनापुर सुरुङ पहिरो स्थिति, सुरक्षित मार्ग)...",
    aiReadOut: "सुन्नुहोस्",
    languageLabel: "भाषा चयन",
  },
  trp: {
    brandName: "NER–MargDarshak",
    govBadge: "Hukumu Logistics AI",
    kicker: "✦ HUKUMU LOGISTICS PHALANG GRID",
    title1: "AI-bai Chalaikwrwng Logistics &",
    title2: "Thanglai-Pailai Tongthokma",
    title3: "NER-ni bagwi",
    subtitle: "NER-ni 8 state-o lama nithokma, hasa baijakma samung uansukma tei emergency samung chalaikwrwng.",
    highlightStates: "NER-ni 8 state-o",
    ctaButton: "Login / Signup Khlaidi",
    mapStreet: "Lama",
    mapTerrain: "Hachuk",
    mapSatellite: "Satellite",
    legendTitle: "Lama Kholung Rong:",
    legendSafe: "Kachak-Kaham: Kaham Lama",
    legendRain: "Kwmo: Wathwi Husiari",
    legendMud: "Kwcha: Hatom / Hasa Baijak",
    legendLandslide: "Kchak: Kutubu Hasa Baijakma",
    syncTitle: "8/8 State-rog: 100% Sync",
    movingTrucks: "Truck rog buma tongkho",
    aiBadge: "AI Dakti",
    aiTitle: "NER AI Dakti",
    aiSubtitle: "Lama & Hasa Baijakma Samung",
    aiWelcome: "Khulumkha! Ang NER–MargDarshak AI Dakti 🤖. Lama-ni samung tei hasa baijakma kothoma swngdi.",
    aiPlaceholder: "AI-no swngdi (Sonapur hasa baijakma, Guwahati-Silchar lama)...",
    aiReadOut: "Khnaidi",
    languageLabel: "Kwtal Kok",
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
    const saved = localStorage.getItem("ner_user_language") as SupportedLanguage;
    if (saved && TRANSLATIONS[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
      localStorage.setItem("ner_user_language", lang);
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
