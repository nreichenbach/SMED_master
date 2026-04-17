
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, QuizDomain } from "../types";

export async function generateQuizQuestions(domains: QuizDomain[], count: number): Promise<Question[]> {
  // Always initialize GoogleGenAI with the API key from environment variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isAllDomains = domains.includes('Tous les domaines (Mélange)');
  const domainsText = isAllDomains ? "tous les domaines médicaux" : domains.join(', ');

  const prompt = `Agis en tant qu'expert formateur en secrétariat médical en Suisse. 
  Génère un quiz de ${count} questions portant sur : "${domainsText}".
  
  CONSIGNES IMPORTANTES (SUISSE) :
  - La formation a lieu en Suisse. 
  - Remplace systématiquement le numéro d'urgence "15" par "144".
  - Remplace systématiquement le terme "SAMU" par "Urgences médicales".
  - Utilise la terminologie médicale et administrative suisse si applicable.
  - Pour les questions VRAI/FAUX, utilise impérativement "Vrai" ou "Faux" (en français) pour correctAnswer et options.
  
  NIVEAUX DE DIFFICULTÉ :
  - Assure-toi d'inclure un mélange équilibré de niveaux de difficulté (facile, moyen, difficile) au sein de chaque domaine.
  
  MÉLANGE OBLIGATOIRE DE CES TYPES :
  1. ÉTYMOLOGIE (racines, préfixes, suffixes).
  2. DÉFINITION (terme technique à trouver).
  3. CAS CLINIQUE (situation concrète). Pour les cas cliniques, varie les scénarios :
     - Diagnostic (identifier la pathologie à partir des symptômes).
     - Planification (examens à prévoir, orientation du patient).
     - Communication patient (gestion de l'accueil, urgence au téléphone, rassurance).
  4. VRAI/FAUX (affirmation médicale à valider).
  5. MISE EN ORDRE (étapes de procédure ou anatomie).
  6. ASSOCIATION (lier termes et définitions).

  FORMAT JSON : {id, type, text, options[], correctAnswer, matchingPairs[], explanation}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_IN_THE_BLANKS', 'ASSOCIATION', 'TRUE_FALSE', 'ORDERING'] },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              matchingPairs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    left: { type: Type.STRING },
                    right: { type: Type.STRING }
                  },
                  required: ["id", "left", "right"]
                }
              },
              explanation: { type: Type.STRING }
            },
            required: ["id", "type", "text", "explanation", "correctAnswer"]
          }
        }
      }
    });

    // response.text is a property, not a function.
    const questions: Question[] = JSON.parse(response.text?.trim() || "[]");
    return questions;
  } catch (error: any) {
    if (error?.message?.includes('429')) {
      throw new Error("QUOTA_GLOBAL_EXCEEDED");
    }
    throw error;
  }
}
