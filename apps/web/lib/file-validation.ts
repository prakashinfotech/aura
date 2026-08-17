// File signature (magic bytes) validation

export interface FileSignature {
  mime: string;
  magic: (bytes: Uint8Array) => boolean;
  ext: string;
}

const FILE_SIGNATURES: FileSignature[] = [
  {
    mime: "image/png",
    magic: (bytes) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
    ext: "png",
  },
  {
    mime: "image/jpeg",
    magic: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    ext: "jpg",
  },
  {
    mime: "image/webp",
    magic: (bytes) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
    ext: "webp",
  },
];

/**
 * ✅ SECURITY: Validate file by checking magic bytes (file signature)
 * Prevents attacks where file extension is spoofed
 */
export function validateFileSignature(bytes: Uint8Array, declaredMime: string): string | null {
  // Read minimum bytes needed for detection
  if (bytes.length < 12) {
    return null;
  }

  // Find matching signature
  for (const sig of FILE_SIGNATURES) {
    if (sig.magic(bytes)) {
      // Check if declared MIME matches detected signature
      if (sig.mime === declaredMime) {
        return sig.ext;
      }
      // If MIME mismatch, still fail (no spoofing)
      return null;
    }
  }

  return null;
}
