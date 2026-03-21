
export type ViewState = 
  | 'discover' | 'home' | 'oracle' | 'lab' | 'cargo' | 'profile' | 'detail' 
  | 'explore' | 'messages' | 'merchant-portal' 
  | 'register' | 'admin' | 'srts-dashboard' | 'editorial' | 'editorial-detail'
  | 'buyer-portal' | 'ad-manager' | 'feed' | 'registry-setup' | 'sandals-hotels' 
  | 'contact' | 'audio-heritage' | 'srts-office' | 'booking-ledger' 
  | 'hotel-detail' | 'hotel-node-control' | 'pricing' | 'ad-checkout' | 'about'
  | 'about-who' | 'about-vision' | 'about-mission' | 'about-aba'
  | 'orders' | 'dispute-center' | 'login' | 'carry-me' | 'driver-registry'
  | 'purple-fleet' | 'driver-console' | 'fleet-admin' | 'legal' | 'hardware-audit' | 'business-verification'
  | 'carry-go-dash' | 'onboarding';

export type Language = 'en' | 'ig' | 'pcm' | 'ha' | 'yo' | 'fr' | 'zh';
export type UserRole = 'visitor' | 'registered' | 'business_owner' | 'verified_business' | 'buyer' | 'editor' | 'admin' | 'driver' | 'fleet_commander';
export type Role = UserRole;

export enum VehicleCategory {
  STANDARD = 'Standard (City)',
  EXECUTIVE = 'Executive (SR_Luxury)',
  CARGO_SMALL = 'Small Cargo (Carry-Go Lite)',
  SHIELD = 'Purple Shield (Armed Escort)'
}

export enum ComplianceLevel {
  LEVEL_1 = 'Level 1: Verified',
  LEVEL_2 = 'Level 2: Elite',
  LEVEL_3 = 'Level 3: Shield'
}

export interface DriverNode {
  id: string;
  user_email: string;
  full_name: string;
  nin_verified: boolean;
  bvn_verified: boolean;
  license_verified: boolean;
  device_imei: string;
  compliance_level: ComplianceLevel;
  rating: number;
  status: 'offline' | 'online' | 'active_ride' | 'suspended' | 'emergency';
  current_vehicle_id: string;
  total_earnings: number;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

export interface Vehicle {
  id: string;
  owner_email: string;
  driver_name: string;
  driver_phone: string;
  driver_nin: string;
  plate_number: string;
  vin: string;
  vehicle_model: string;
  vehicle_year: string;
  category: VehicleCategory;
  image_url: string;
  docs_url: string; 
  status: 'pending' | 'approved' | 'active' | 'suspended' | 'online' | 'active_ride' | 'offline';
  current_lat?: number;
  current_lng?: number;
  rating: number;
  created_at: string;
}

export interface RideBooking {
  id: string;
  passenger_email: string;
  passenger_name: string;
  passenger_rating: number;
  driver_id: string;
  vehicle_id: string;
  pickup_addr: string;
  dropoff_addr: string;
  amount: number;
  driver_share: number;
  platform_share: number;
  status: 'requested' | 'accepted' | 'started' | 'completed' | 'cancelled' | 'emergency';
  tracking_session_id: string;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  ride_id: string;
  initiator: 'passenger' | 'driver';
  lat: number;
  lng: number;
  timestamp: string;
  status: 'active' | 'resolved';
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid', 
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  DISPUTED = 'disputed',
  RELEASED = 'released',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export interface Order {
  id: string;
  buyer_email: string;
  merchant_id: string;
  product_id: string;
  amount: number;
  commission_deducted: number;
  merchant_payout: number;
  status: OrderStatus;
  escrow_release_at: string;
  created_at: string;
  tracking_id?: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  reason: string;
  status: 'open' | 'resolved' | 'refunded';
  evidence_url?: string;
  created_at: string;
}

export enum SubscriptionTier {
  FREE = 'Free',
  VERIFIED = 'Verified',
  GROWTH = 'Growth',
  PREMIUM = 'Premium'
}

export enum BillingCycle {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly'
}

export type BusinessType = 'Artisan' | 'Manufacturer' | 'Wholesaler' | 'Retailer';

export interface BusinessPlan {
  id: SubscriptionTier;
  name: string;
  monthlyAmount: number;
  yearlyAmount: number;
  slots: number;
  features: string[];
}

export interface EditorialStory {
  id: string;
  title: string;
  hero_image: string;
  body_text: string;
  why_selected: string;
  specialization: string;
  trust_signals: string;
  best_time_to_engage: string;
  category_tags: string[];
  linked_business_id: string;
  editorial_level: VerificationLevel;
  published: boolean;
  published_date: string;
}

export interface QualityAudit {
  id: string;
  hotel_id: string;
  score: number;
  remarks: string;
  action_taken: string;
  created_at: string;
}

export enum Category {
  SHOEMAKING = 'Shoemaking & Leather',
  TAILORING = 'Fashion & Garments',
  ENGINEERING = 'Engineering & Metalwork',
  TEXTILES = 'Textiles & Chemicals',
  WOODWORK = 'Woodwork & Furniture',
  HOSPITALITY = 'Hotels & Hospitality',
  EVENTS = 'Events & Protocols',
  CULTURE = 'Culture & Traditions',
  RELIGION = 'Religious Organizations',
  FINANCE = 'Thrift & Finance',
  LOGISTICS = 'Logistics & Cargo',
  PUZZLES = 'Industrial Puzzles & Crafts',
  AGRICULTURE = 'Agro-Processing & Staples',
  PRINTING = 'Printing & Packaging Hub',
  AUTOMOTIVE = 'Auto Parts & Mechanical',
  TRADING = 'General Import & Export',
  USED_BALES = 'Fairly Used (Jumbo Bales)',
  TOKUNBO_IMPORT = 'Tokunbo & Auto Import',
  TECH_GADGETS = 'Tech Hub & IT Gadgets',
  EDUCATION = 'Schools & Training Centers',
  HEALTHCARE = 'Hospitals & Pharmacies',
  LEGAL_PROFESSIONAL = 'Legal & Professional Services',
  MEDIA_ENTERTAINMENT = 'Media, Studios & Entertainment',
  REAL_ESTATE = 'Real Estate & Construction',
  BEAUTY_PERSONAL_CARE = 'Beauty, Salons & Spas',
  FOOD_RESTAURANTS = 'Restaurants & Food Hubs',
  PUBLIC_SERVICES = 'Public Services & Utilities'
}

export enum VerificationStatus {
  UNVERIFIED = 'Unverified',
  PENDING = 'Pending',
  VERIFIED = 'Verified'
}

export enum VerificationLevel {
  LISTED = 'Listed',
  VERIFIED = 'Verified',
  EDITORIAL = 'Editorial',
  SIGNATURE = 'Signature'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  specifications?: string;
  status: 'active' | 'draft' | 'sold_out';
  stock_count?: number;
  sku?: string;
  tags?: string[];
  condition?: 'New' | 'Fairly Used' | 'Refurbished';
}

export interface Business {
  id: string;
  name: string;
  email: string;
  category: Category;
  primary_product_or_service: string;
  area: string;
  address: string;
  phone_whatsapp: string;
  image_url: string;
  rating: number;
  review_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'suspended';
  verification_status: VerificationStatus;
  verification_level: VerificationLevel;
  is_export_ready: boolean;
  capacity_indicator: string;
  premium_features_enabled: boolean;
  commission_rate?: number; 
  active_features: {
    physical_verification_badge?: boolean;
    priority_score_bonus?: number;
    sponsored_badge?: boolean;
    verified_exporter_badge?: boolean;
    trade_analytics_access?: 'basic' | 'advanced';
    tokunbo_specialist_badge?: boolean;
    featured_rank?: number;
  };
  products: Product[];
  latitude?: number;
  longitude?: number;
  video_caption?: string;
  created_at: string;
  description?: string;
  business_type?: string;
  is_verified?: boolean;
  is_hidden_gem?: boolean;
  transformation_story?: {
    before: string;
    after: string;
    image_before?: string;
    image_after?: string;
  };
  subscription_tier?: SubscriptionTier;
  catalog_images?: string[];
  videos?: { url: string; caption: string }[];
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  skills?: string[];
  experience_years?: number;
  portfolio_images?: string[];
}

export type ShipmentStatus = 'requested' | 'pickup-scheduled' | 'at-hub' | 'in-transit' | 'delivered' | 'confirmed';

export interface LogisticsOrder {
  id: string;
  user_email: string;
  trackingId: string;
  status: ShipmentStatus;
  pickupAddress: string;
  deliveryAddress: string;
  totalFee: number;
  riderPayout: number;
  timestamp: string;
}

export interface Hotel {
  id: string;
  name: string;
  image_url: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  quality_score: number;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  hotel_id: string;
  room_id: string;
  hotel_name?: string;
  hotel_address?: string;
  room_number?: string;
  total_amount: number;
  check_in: string;
  check_out: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  guest_name?: string;
  guest_address?: string;
  guest_phone?: string;
  guest_company?: string;
  stay_duration?: number;
  special_requests?: string;
  guests_count?: number;
}

export interface LedgerEntry {
  id: string;
  booking_id?: string;
  order_id?: string;
  gross_amount: number;
  sandalsroyalle_share: number;
  hotel_share: number;
  merchant_share?: number;
  vat: number;
  settlement_status: 'pending' | 'paid';
  created_at: string;
}

export interface HospitalityConfig {
  id: string;
  vat_rate: number;
  sr_share_percentage: number;
  hotel_share_percentage: number;
  sr_exec_markup: number;
  updated_at: string;
}

export interface ThriftAccount {
  user_email: string;
  cycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  total_saved: number;
  status: 'active' | 'settled';
  start_date: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  swift_code?: string;
}

export interface Advertorial {
  id: string;
  title: string;
  content: string;
  featured_image: string;
  author_name: string;
  category?: string;
  views: number;
  grounding?: any[];
  created_at: string;
}

export interface PlatformConfig {
  id: number;
  app_logo: string;
  oracle_avatar: string;
  hero_images: string[];
  hero_videos: { url: string; caption: string }[];
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  sender_id: string;
  receiverId?: string;
  text: string;
  role?: string;
  attachments?: { url: string; name: string; mime: string }[];
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

export interface PresenceUser {
  key: string;
  user_id: string;
  displayName: string;
  role?: string;
  typing: boolean;
  online_at: string;
  avatarUrl?: string;
}

export interface FeedEvent {
  id: string;
  type: 'new-artisan' | 'new-product' | 'verified-sale' | 'shoutout' | 'logistics-milestone';
  title: string;
  description: string;
  timestamp: Date;
}

export type LegalDocType = 'terms' | 'privacy' | 'refund' | 'vendor' | 'ads' | 'license';

export interface VendorLicense {
  id: string;
  business_id: string;
  type: string;
  url: string;
  status: 'pending' | 'active' | 'expired';
  created_at: string;
}

export type AdType = 'featured_listing' | 'banner' | 'sponsored_story';

export interface AdCampaign {
  id: string;
  business_id: string;
  type: AdType;
  title: string;
  description?: string;
  image_url: string;
  start_date: string;
  end_date: string;
  price_paid: number;
  status: 'active' | 'expired' | 'pending';
  category?: string;
}

export interface AdPlan extends BusinessPlan {
  price?: number;
  duration_days?: number;
}

export interface PaymentLog {
  id?: string;
  user_id: string;
  plan_id: string;
  amount: number;
  provider: string;
  status: string;
  created_at?: string;
}

export enum RoomType {
  STANDARD = 'Standard',
  SR_EXEC = 'SR_Executive',
  SUITE = 'Suite'
}

export interface Room {
  id: string;
  hotel_id: string;
  room_number: string;
  room_type: RoomType;
  base_price: number;
  status: 'available' | 'booked' | 'maintenance';
}

export interface BuyerSignal {
  id: string;
  buyer_email: string;
  buyer_name: string;
  category: Category;
  urgency: 'routine' | 'urgent' | 'immediate';
  volume: string;
  requirement: string;
  delivery_region: string;
  budget_range?: string;
  status: 'open' | 'closed';
  response_count: number;
  payment_method?: string;
  created_at: string;
}

export interface SignalInterest {
  id: string;
  signal_id: string;
  merchant_id: string;
  merchant_name: string;
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'alert';
  read: boolean;
  timestamp: string;
}
