
import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult, ThreatLevel, ScanOptions } from "../types";
import { computeFileHash, readFileHead, bufferToHex, bufferToAscii } from "./cryptoService";

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
  // Fix: Exclude SVG/XML from image processing as Gemini Vision doesn't support it directly. Treat as text/code.
  const isImage = file.type.startsWith('image/') && !file.type.includes('svg') && !file.type.includes('xml');
  
  // 1. Pre-computation: Hashing and Metadata
  const fileHash = await computeFileHash(file);
  const headBuffer = await readFileHead(file, 1024); // Read first 1KB
  const hexDump = bufferToHex(headBuffer);
  const asciiDump = bufferToAscii(headBuffer);
  
  const metadata = {
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
    magicBytes: hexDump.substring(0, 24) // First 8 bytes roughly
  };

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

    // 2. Construct Prompt
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
                 File Hash (SHA-256): ${fileHash}
                 Metadata: ${JSON.stringify(metadata)}
                 
                 ${depthContext}
                 ${sensitivityContext}
                 Check for steganography indicators (visual noise), embedded malicious text codes (OCR), or if it's a screenshot of vulnerable code/systems.
                 Also check if it depicts any sensitive PII or compromised data.
                 Return a JSON response.`
        }
      ];
    } else {
      // Text/Binary Analysis
      // We pass the Hex and ASCII preview to help detecting binary exploits or hidden strings in non-text files
      
      let contentSample = "";
      
      // Check for text-based formats including source code, configuration, and SVGs
      const isTextBased = file.type.includes('text') || 
                          file.type.includes('javascript') || 
                          file.type.includes('json') || 
                          file.type.includes('xml') ||
                          file.type.includes('svg') ||
                          file.name.match(/\.(py|js|ts|tsx|jsx|cpp|h|c|java|txt|md|html|css|svg|xml|json|yaml|yml|sh|bat|ps1)$/i);

      // If it's a large file or binary, we rely heavily on the hex dump and a text sample
      if (file.size < 100000 && isTextBased) {
          contentSample = await fileToText(file);
      } else {
          contentSample = "[Binary or Large File - Content Omitted, relying on Hex/ASCII dump]";
      }

      promptParts = [
        {
          text: `Analyze the following file for security vulnerabilities, viruses, malicious patterns, logic bombs, or known CVEs.
                 
                 FILE METADATA:
                 Name: ${file.name}
                 Size: ${file.size} bytes
                 Type: ${file.type}
                 SHA-256 Hash: ${fileHash}
                 
                 BINARY INSPECTION (First 1KB):
                 Hex Dump: ${hexDump.substring(0, 500)}...
                 ASCII Preview: ${asciiDump.substring(0, 500)}...
                 
                 CONFIGURATION:
                 ${depthContext}
                 ${sensitivityContext}
                 ${analysisFocus}
                 
                 CONTENT SAMPLE (Text-based only):
                 ${contentSample.substring(0, 15000)} 
                 
                 INSTRUCTIONS:
                 1. Analyze the Hex/ASCII header to confirm file type consistency (Magic Bytes).
                 2. Look for hidden strings, shellcode patterns, or suspicious import tables in the ASCII dump.
                 3. Analyze the text content (if provided) for code vulnerabilities (XSS in SVG, Injection in SQL/Code, Macros, etc).
                 4. Act as a senior security researcher.
                 `
        }
      ];
    }

    // 3. Execute Analysis
    
    // Determine budget based on depth
    let budget = 1024;
    if (options.scanDepth === 'deep') budget = 32768; // Max budget for Gemini 3 Pro
    if (options.scanDepth === 'quick') budget = 0; // No thinking for quick scans
    
    // Use Gemini 3 Pro for analysis
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
    
    // Return enriched result
    return { 
      ...result, 
      fileName: file.name,
      fileHash,
      metadata,
      hexDump,
      asciiDump
    };

  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      fileName: file.name,
      fileHash,
      metadata,
      threatLevel: ThreatLevel.UNKNOWN,
      summary: "Analysis failed due to processing error.",
      vulnerabilities: [],
      confidenceScore: 0,
      technicalDetails: `Error communicating with AI engine or processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
