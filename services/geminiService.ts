import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult, ThreatLevel, ScanOptions } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Helper to read file as Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Helper to read file as Text
const fileToText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const analyzeFile = async (file: File, options: ScanOptions): Promise<ScanResult> => {
  const ai = getAiClient();
  const isImage = file.type.startsWith('image/');
  
  // We select models based on the task complexity and user options
  
  try {
    let promptParts: any[] = [];
    
    // Build context based on Advanced Options
    const depthContext = options.scanDepth === 'deep' 
      ? "PERFORM A DEEP, COMPREHENSIVE ANALYSIS. Scrutinize every pattern, obfuscation technique, and anomaly. Assume nothing is safe."
      : options.scanDepth === 'balanced'
        ? "Perform a standard security check focusing on known patterns and heuristic anomalies."
        : "Perform a high-speed, superficial check for obvious threats only.";

    const sensitivityContext = options.sensitivityThreshold > 80
      ? "HIGH SENSITIVITY MODE: Flag even minor deviations or potential risks as SUSPICIOUS or MALICIOUS."
      : options.sensitivityThreshold < 30
        ? "LOW SENSITIVITY MODE: Only flag clear, high-confidence threats. Ignore warnings."
        : "STANDARD SENSITIVITY MODE.";

    const analysisFocus = `
      ${options.enableHeuristics ? "- Enable Heuristic Analysis: Look for suspicious behavior patterns and zero-day indicators." : ""}
      ${options.enableSignatures ? "- Enable Signature Matching: Compare against known malicious code structures." : ""}
    `;

    // Schema for structured output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        threatLevel: { type: Type.STRING, enum: ["SAFE", "SUSPICIOUS", "MALICIOUS", "UNKNOWN"] },
        summary: { type: Type.STRING },
        vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidenceScore: { type: Type.NUMBER },
        technicalDetails: { type: Type.STRING },
        cveMatches: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["threatLevel", "summary", "vulnerabilities", "confidenceScore", "technicalDetails"]
    };

    // 1. Construct Prompt
    if (isImage) {
      const base64Data = await fileToBase64(file);
      promptParts = [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        },
        {
          text: `Analyze this image for security threats. 
                 ${depthContext}
                 ${sensitivityContext}
                 Check for steganography indicators (visual noise), embedded malicious text codes (OCR), or if it's a screenshot of vulnerable code/systems.
                 Also check if it depicts any sensitive PII or compromised data.
                 Return a JSON response.`
        }
      ];
    } else {
      // Assume text/code for non-images for this demo
      const textContent = await fileToText(file);
      promptParts = [
        {
          text: `Analyze the following file content for security vulnerabilities, viruses, malicious patterns, logic bombs, or known CVEs.
                 File Name: ${file.name}
                 
                 CONFIGURATION:
                 ${depthContext}
                 ${sensitivityContext}
                 ${analysisFocus}
                 
                 CONTENT START:
                 ${textContent.substring(0, 20000)} 
                 CONTENT END
                 
                 Act as a senior security researcher.`
        }
      ];
    }

    // 2. Execute Analysis
    
    // Determine budget based on depth
    let budget = 1024;
    if (options.scanDepth === 'deep') budget = 32768; // Max budget for Gemini 3 Pro
    if (options.scanDepth === 'quick') budget = 0; // No thinking for quick scans
    
    if (!isImage) {
      // DEEP ANALYSIS WITH THINKING
      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: promptParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          thinkingConfig: { thinkingBudget: budget }, 
        }
      });

      const result = JSON.parse(analysisResponse.text || "{}");
      return { ...result, fileName: file.name };

    } else {
      // IMAGE ANALYSIS
      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: promptParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
       const result = JSON.parse(analysisResponse.text || "{}");
       return { ...result, fileName: file.name };
    }

  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      fileName: file.name,
      threatLevel: ThreatLevel.UNKNOWN,
      summary: "Analysis failed due to processing error.",
      vulnerabilities: [],
      confidenceScore: 0,
      technicalDetails: "Error communicating with AI engine.",
      cveMatches: []
    };
  }
};

export const checkKnownVulnerabilities = async (query: string): Promise<string[]> => {
  // Use Search Grounding to find latest CVEs
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search for known vulnerabilities, CVEs, or security alerts related to: "${query}". List the top 3 most relevant CVE IDs and titles.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    // Extract grounding metadata chunks if available, or just parse text
    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];
    
    return links; 
  } catch (e) {
    console.warn("Grounding search failed", e);
    return [];
  }
};