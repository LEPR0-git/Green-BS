const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const WASTE_ANALYSIS_PROMPT = `Tu es un expert en gestion des déchets urbains. Analyse cette image et réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après.

Critères d'analyse :
- isWaste : true si l'image montre des déchets (bac plein, dépôt sauvage, déchets au sol), false sinon
- confidence : ton niveau de certitude entre 0.0 et 1.0
- type : parmi "bac_plein", "depot_sauvage", "dechets_au_sol", "autre"
- description : une phrase courte décrivant ce que tu vois

Format de réponse attendu (JSON strict) :
{
  "isWaste": true,
  "confidence": 0.87,
  "type": "depot_sauvage",
  "description": "Un tas de déchets plastiques au bord d'une route"
}`;

const fileToGenerativePart = (path, mimeType = 'image/jpeg') => {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString('base64'),
      mimeType
    }
  };
};

const analyzeImage = async (imagePath, maxRetries = 3) => {
  const imagePart = fileToGenerativePart(imagePath);
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Tentative ${attempt}/${maxRetries} - Appel Gemini...`);

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [WASTE_ANALYSIS_PROMPT, imagePart]
      });

      const cleaned = response.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (typeof parsed.isWaste !== 'boolean') {
        throw new Error('Invalid response format: isWaste missing');
      }

      return {
        isWaste: parsed.isWaste,
        confidence: parsed.confidence || 0,
        type: parsed.type || 'autre',
        description: parsed.description || ''
      };
    } catch (error) {
      lastError = error;
      console.error(`❌ Tentative ${attempt} échouée :`, error.message);

      if (error.status !== 503 && !error.message.includes('high demand')) {
        throw error;
      }

      if (attempt < maxRetries) {
        const waitTime = attempt * 2000;
        console.log(`⏳ Attente de ${waitTime / 1000}s avant nouvelle tentative...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Gemini analysis failed after ${maxRetries} attempts: ${lastError.message}`);
};

module.exports = { analyzeImage };