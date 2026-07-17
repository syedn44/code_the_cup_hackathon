import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is not set. Please set it in a .env file.");
}
const genAI = new GoogleGenerativeAI(API_KEY);
const primaryModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });


document.getElementById('generator-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const team = document.getElementById('team').value;
  const opponent = document.getElementById('opponent').value;
  const player = document.getElementById('player').value;
  const vibe = document.getElementById('vibe').value;
  
  const resultSection = document.getElementById('result-section');
  const loading = document.getElementById('loading');
  const output = document.getElementById('output');
  const banner = document.getElementById('virtual-banner');
  const bannerTeam = document.getElementById('banner-team');
  const chantText = document.getElementById('chant-text');
  const playChantBtn = document.getElementById('play-chant-btn');
  const extras = document.getElementById('extras');
  const socialText = document.getElementById('social-text');
  const conceptText = document.getElementById('concept-text');
  
  // Show loading
  resultSection.classList.remove('hidden');
  loading.classList.remove('hidden');
  output.classList.add('hidden');
  
  try {
    const prompt = `You are a creative, die-hard football fan.
    The user is a fan of ${team} playing against ${opponent}. They want a ${vibe} vibe. ${player ? `Make sure to highlight their star player, ${player}.` : ""}
    
    1) Determine the primary native language spoken by fans of ${team} (e.g., English for Arsenal, Spanish for Argentina, Italian for Juventus).
    2) Chant: Write a short stadium chant for ${team} directed at ${opponent} (and mentioning ${player} if provided). Write it ENTIRELY in the native language of ${team}. Make it very short and punchy (2-4 lines max).
    3) Social Post: Write a highly engaging, viral social media post (with emojis and hashtags) hyping up the match. Write it ENTIRELY in the native language of ${team}.
    4) Banner Concept: Describe a visual concept for a massive stadium banner (Tifo) that fans could paint. Describe the imagery in English.
    5) Provide the primary hex color for ${team} (e.g. #FF0000).
    6) Provide the secondary hex color for ${team} (e.g. #FFFFFF).
    7) Provide a text color (either #FFFFFF or #000000) that contrasts well with the primary color.
    
    Output strictly in this JSON format, no markdown tags:
    {
      "chant": "...",
      "socialPost": "...",
      "bannerConcept": "...",
      "primaryColor": "#HEX",
      "secondaryColor": "#HEX",
      "textColor": "#HEX"
    }`;

    let result;
    try {
      result = await primaryModel.generateContent(prompt);
    } catch (primaryError) {
      console.warn("Primary model failed (Rate limit/Network). Trying fallback model...", primaryError);
      result = await fallbackModel.generateContent(prompt);
    }
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting in response
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    
    // Update DOM
    bannerTeam.textContent = team;
    chantText.textContent = data.chant;
    socialText.textContent = data.socialPost;
    conceptText.textContent = data.bannerConcept;
    
    // Update Banner CSS dynamically
    banner.style.background = `linear-gradient(135deg, ${data.primaryColor}, ${data.secondaryColor})`;
    banner.style.color = data.textColor;
    
    // Show result
    loading.classList.add('hidden');
    output.classList.remove('hidden');
    
    // Play chant TTS logic
    playChantBtn.classList.remove('hidden');
    playChantBtn.onclick = () => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.chant);
      
      // Make it sound more lively!
      utterance.rate = 1.15; 
      utterance.pitch = 1.3; 
      
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Enhanced'));
      if (premiumVoice) utterance.voice = premiumVoice;
      
      window.speechSynthesis.speak(utterance);
    };
    
  } catch (error) {
    console.error("Error generating content (Rate Limit/Network):", error);
    
    // Hackathon Fail-safe Fallback!
    const fallbackPrimary = team.toLowerCase().includes('argentina') ? "#74acdf" : "#222222";
    const fallbackSecondary = team.toLowerCase().includes('argentina') ? "#ffffff" : "#666666";
    
    bannerTeam.textContent = team;
    chantText.textContent = `Listen, ${opponent}, hear our cry,\nWe're the ${team} till we die!\nWe'll show you our passion, we'll show you our might,\nWe are taking the cup home tonight!`;
    socialText.textContent = `WE ARE READY! 🔥 Bring on the match! Let's go ${team}! #MatchDay #${team.replace(/\s+/g, '')}`;
    conceptText.textContent = `A massive roaring lion painted in ${fallbackPrimary} tearing a flag with the opponent's colors.`;
    
    banner.style.background = `linear-gradient(135deg, ${fallbackPrimary}, ${fallbackSecondary})`;
    banner.style.color = "#FFFFFF";
    
    loading.classList.add('hidden');
    output.classList.remove('hidden');
    
    // Play chant TTS logic
    playChantBtn.classList.remove('hidden');
    playChantBtn.onclick = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(chantText.textContent);
      
      utterance.rate = 1.15;
      utterance.pitch = 1.3;
      
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Enhanced'));
      if (premiumVoice) utterance.voice = premiumVoice;
      
      window.speechSynthesis.speak(utterance);
    };
  }
});
