/**
 * NIPOST Digital Postcode Service
 * Handles resolution and verification of 11-digit Nigerian Digital Postcodes.
 * Note: API access requires KYB and registration with NIPOST.
 */

export interface PostcodeResolution {
  postcode: string;
  state: string;
  lga: string;
  district: string;
  area: string;
  street?: string;
  building?: string;
  latitude?: number;
  longitude?: number;
  formatted_address: string;
}

/**
 * Validates the format of a Digital Postcode (11 digits)
 */
export const validatePostcodeFormat = (postcode: string): boolean => {
  return /^\d{11}$/.test(postcode.replace(/\s/g, ''));
};

/**
 * Resolves a Digital Postcode to a physical address and coordinates.
 * Current implementation uses a mock resolver until official API keys are provided.
 */
export const resolvePostcode = async (postcode: string): Promise<PostcodeResolution> => {
  const cleanPostcode = postcode.replace(/\s/g, '');
  
  if (!validatePostcodeFormat(cleanPostcode)) {
    throw new Error("Invalid Postcode format. Must be 11 digits.");
  }

  // Simulate API Latency
  await new Promise(resolve => setTimeout(resolve, 800));

  // MOCK RESOLUTION LOGIC
  // In production, this would call: https://api.nipost.gov.ng/v1/postcode/resolve
  
  // Example Aba Postcodes starting with 450 (Abia)
  const isAba = cleanPostcode.startsWith('450');
  
  return {
    postcode: cleanPostcode,
    state: "Abia",
    lga: isAba ? "Aba South" : "Unknown",
    district: isAba ? "Aba Urban" : "Unknown",
    area: isAba ? "Ariaria / Faulks Road" : "Unknown",
    street: "Industrial Layout",
    formatted_address: isAba 
      ? `Industrial Layout, Ariaria, Aba, Abia State, Nigeria (${cleanPostcode})`
      : `Resolved Address for ${cleanPostcode}, Nigeria`,
    latitude: 5.11 + (Math.random() * 0.01),
    longitude: 7.34 + (Math.random() * 0.01)
  };
};

/**
 * Verifies if a business is actually located at the claimed postcode.
 * Usually involves comparing GPS coordinates or physical audit.
 */
export const verifyPostcodeMatch = (claimedPostcode: string, actualCoords: { lat: number, lng: number }): boolean => {
  // Logic to check if coordinates fall within the postcode's polygon
  // For now, simple true as placeholder
  return true;
};
