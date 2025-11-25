
// Service for Cryptographic operations and Binary manipulation

export const computeFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
};

// Simulates encrypting data for storage
export const encryptData = async (data: any, key: CryptoKey): Promise<{ cipherText: string, iv: string }> => {
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encodedData
  );
  
  // Convert buffers to base64 for storage
  const cipherArray = Array.from(new Uint8Array(encryptedBuffer));
  const cipherText = btoa(String.fromCharCode.apply(null, cipherArray));
  const ivArray = Array.from(iv);
  const ivText = btoa(String.fromCharCode.apply(null, ivArray));
  
  return { cipherText, iv: ivText };
};

export const readFileHead = async (file: File, bytes: number = 512): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = reject;
    const blob = file.slice(0, bytes);
    reader.readAsArrayBuffer(blob);
  });
};

export const bufferToHex = (buffer: ArrayBuffer): string => {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
};

export const bufferToAscii = (buffer: ArrayBuffer): string => {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map(b => {
      // Printable ASCII range: 32-126. Otherwise show '.'
      return (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
    })
    .join('');
};
