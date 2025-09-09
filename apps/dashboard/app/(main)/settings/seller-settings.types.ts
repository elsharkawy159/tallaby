export interface SellerUserInfo {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
}

export interface SellerProfileData {
  id?: string;
  businessName: string | null;
  displayName: string | null;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  returnPolicy: string | null;
  shippingPolicy: string | null;
  user?: SellerUserInfo | null;
}

export interface SellerDocument {
  id: string;
  sellerId: string;
  documentType: string;
  fileUrl: string;
  expiryDate: string | null;
  status: string;
  uploadedAt?: string | null;
}

export interface SellerSettingsInitialData {
  profile: SellerProfileData;
  documents: SellerDocument[];
}
