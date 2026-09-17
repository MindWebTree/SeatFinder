export interface ApiOk {
  success: boolean;
  message?: string;
}

export interface AuthResponseData {
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  stateId: number;
  neetRank: number;
  category: string;
}

export interface SendOtpRequest {
  emailOrPhoneNumber?: string;
}

export interface VerifyOtpRequest {
  emailOrPhoneNumber?: string;
  otpCode: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
}
