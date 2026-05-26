
import { Business, Category, VerificationStatus, VerificationLevel, IntegrityGrade, EditorialStory, BusinessPlan, SubscriptionTier, AdType, LegalDocType, HubTier } from './types';

export const SANDALS_BRAND = {
  name: "FindAba",
  brandOwner: "SANDALSroyalle",
  fullName: "FindAba by SANDALSroyalle • Industrial Operating System",
  logo: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800&auto=format&fit=crop",
  category: "Business Service / Industrial Company",
  location: "Aba, Abia State, Nigeria",
  website: "https://findaba.app",
  twitter: "https://twitter.com/Find_Aba",
  facebook: "https://www.facebook.com/profile.php?id=61588427943743&mibextid=rS40aB7S9Ucbxw6v",
  instagram: "https://instagram.com/find_aba",
  accent: "#FFD700",
  email: "suite@sandalsroyalle.com",
  country: "Nigeria"
};

// MANUAL SETTLEMENT GATEWAY v1.0
export const OFFICIAL_BANK_DETAILS = {
  bankName: "SANDALSROYALLE OFFICIAL BANK",
  accountNumber: import.meta.env.VITE_ACCOUNT_NUMBER || "0000000000",
  accountName: "SANDALSroyalle Special Events Hub",
  transferNote: "Include Partner-ID in Transfer Memo"
};

export const CATEGORIES = Object.values(Category);

export const ABA_AREAS = [
  'Ariaria International',
  'Ngwa Road Hub',
  'Azikiwe Road Central',
  'Powerline Zone',
  'Ogbor Hill Industrial',
  'Faulks Road Hub',
  'Umungasi Hub',
  'Osisioma Industrial',
  'Abayi Zone',
  'Over Rail Hub',
  'Cemetery Road Zone',
  'Port Harcourt Road Hub',
  'Uratta Industrial',
  'Milverton Central',
  'Ama-Hausa Hub',
  'Tonimas Zone',
  'Eziukwu Market Area',
  'Market Road Central'
];

export const MOCK_EDITORIAL_STORIES: EditorialStory[] = [
  {
    id: 'story-1',
    title: "The Master of Precision Stitch",
    hero_image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200",
    body_text: "In the heart of Ariaria, perfection isn't an option—it's the only currency that matters. This is the chronicle of the leather masters who have built an empire on the strength of a single thread.",
    why_selected: "Recognized for maintaining industrial footwear standards for over three decades.",
    specialization: "Export-Grade Leather Footwear",
    trust_signals: "Registry Partner, Integrity Grade A+.",
    best_time_to_engage: "Direct consultation: 09:00 - 12:00 daily.",
    category_tags: ["Leather", "Craft", "Legacy"],
    linked_business_id: "biz-leather-01",
    editorial_level: VerificationLevel.SIGNATURE,
    published: true,
    published_date: "2025-01-25T10:00:00Z"
  }
];

export const ARTISANS: Business[] = [
  {
    id: 'biz-leather-01',
    name: 'Master-Link Leather Hub',
    email: 'masterlink@findaba.com',
    category: Category.SHOEMAKING,
    primary_product_or_service: 'Industrial Safety Boots',
    active_features: { verified_exporter_badge: true, physical_verification_badge: true },
    area: 'Ariaria International',
    description: 'Precision manufacturing partner for leather goods and industrial footwear exports.',
    address: 'Block 4, Ariaria Market, Aba',
    phone_whatsapp: '+2348011111111',
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800',
    rating: 4.9,
    review_count: 128,
    latitude: 5.112,
    longitude: 7.335,
    status: 'approved',
    verification_status: VerificationStatus.VERIFIED,
    verification_level: VerificationLevel.PHYSICALLY_VERIFIED,
    integrity_grade: IntegrityGrade.A_PLUS,
    hub_tier: HubTier.EXPORT_READY,
    is_export_ready: true,
    capacity_indicator: 'High Volume',
    premium_features_enabled: true,
    is_hidden_gem: false,
    transformation_story: {
      before: "Started with a single manual sewing machine in a small stall.",
      after: "Now operates a 12-unit industrial manufacturing hub with export-grade machinery.",
      image_before: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=400",
      image_after: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400"
    },
    products: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'biz-fashion-01',
    name: 'Aba Couture Collective',
    email: 'couture@findaba.com',
    category: Category.TAILORING,
    primary_product_or_service: 'Bespoke Kaftans & Suits',
    active_features: { verified_exporter_badge: true },
    area: 'Ngwa Road Hub',
    description: 'High-end fashion partner specializing in traditional and corporate attire for the modern master.',
    address: 'Ngwa Road, Aba',
    phone_whatsapp: '+2348022222222',
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800',
    rating: 4.7,
    review_count: 56,
    latitude: 5.102,
    longitude: 7.365,
    status: 'approved',
    verification_status: VerificationStatus.VERIFIED,
    verification_level: VerificationLevel.DOCUMENT_VERIFIED,
    integrity_grade: IntegrityGrade.A,
    hub_tier: HubTier.GROWTH_ENGINE,
    is_export_ready: true,
    capacity_indicator: 'Bespoke & Batch',
    premium_features_enabled: true,
    is_hidden_gem: true,
    products: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'biz-repair-01',
    name: 'Signal Fix Terminal',
    email: 'signalfix@findaba.com',
    category: Category.TECH_GADGETS,
    primary_product_or_service: 'Advanced Logic Board Repair',
    active_features: { physical_verification_badge: true },
    area: 'Azikiwe Road Central',
    description: 'The most trusted partner for complex mobile and laptop repairs. If it has a signal, we can fix it.',
    address: '45 Azikiwe Road, Aba',
    phone_whatsapp: '+2348099999999',
    image_url: 'https://images.unsplash.com/photo-1581092921461-eab62e92c73e?q=80&w=800',
    rating: 4.9,
    review_count: 210,
    latitude: 5.107,
    longitude: 7.361,
    status: 'approved',
    verification_status: VerificationStatus.VERIFIED,
    verification_level: VerificationLevel.PHYSICALLY_VERIFIED,
    integrity_grade: IntegrityGrade.A_PLUS,
    hub_tier: HubTier.LOCAL_TRUST,
    is_export_ready: false,
    capacity_indicator: 'High Precision',
    premium_features_enabled: true,
    is_hidden_gem: true,
    products: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'biz-tech-01',
    name: 'Enyimba Digital Registry (Tech Hub)',
    email: 'enyimbatech@findaba.com',
    category: Category.TECH_GADGETS,
    primary_product_or_service: 'Vanguard Grade Migration Laptops',
    active_features: { physical_verification_badge: true, sponsored_badge: true },
    area: 'Azikiwe Road Central',
    description: 'The primary tech partner for fairly used ThinkPads, Latitudes, and MacBooks. Specialists in the EliteBook 840 G4 Migration spec.',
    address: '12 Azikiwe Road, Aba',
    phone_whatsapp: '+2349012345678',
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800',
    rating: 4.8,
    review_count: 89,
    latitude: 5.106,
    longitude: 7.362,
    status: 'approved',
    verification_status: VerificationStatus.VERIFIED,
    verification_level: VerificationLevel.DOCUMENT_VERIFIED,
    integrity_grade: IntegrityGrade.A,
    hub_tier: HubTier.LOCAL_TRUST,
    is_export_ready: false,
    capacity_indicator: 'Retail & Wholesale',
    premium_features_enabled: true,
    products: [
      { id: 'p-tech-1', name: 'HP EliteBook 840 G4 (Vanguard SSD Spec)', price: 270000, imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=400', condition: 'Refurbished', status: 'active', description: '7th Gen i5, 8GB RAM, 256GB NVMe SSD. Migration Ready.' },
      { id: 'p-tech-2', name: 'ThinkPad T480 (Workhorse)', price: 310000, imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=400', condition: 'Fairly Used', status: 'active' },
      { id: 'p-tech-3', name: 'Panasonic CF-SV (Migration Partner)', price: 98500, imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=400', condition: 'Fairly Used', status: 'active', description: '8th Gen i5-8265U, 8GB RAM, 256GB SSD. Note: Internal speaker fault. Perfect for industrial terminal use.' }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'biz-jumbo-01',
    name: 'Ahia Ohuru Jumbo Bales',
    email: 'jumbobales@findaba.com',
    category: Category.USED_BALES,
    primary_product_or_service: 'First-Grade UK Jumbo Bales',
    active_features: { tokunbo_specialist_badge: true, sponsored_badge: true },
    area: 'Ngwa Road Hub',
    description: 'Premier importer of first-grade fairly used clothing (Tokunbo) jumbo bales. UK and US direct shipments.',
    address: 'Line A-12, Ahia Ohuru Market, Aba',
    phone_whatsapp: '+2348033332222',
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800',
    rating: 4.8,
    review_count: 92,
    latitude: 5.101,
    longitude: 7.368,
    status: 'approved',
    verification_status: VerificationStatus.VERIFIED,
    verification_level: VerificationLevel.PHYSICALLY_VERIFIED,
    integrity_grade: IntegrityGrade.A_PLUS,
    hub_tier: HubTier.LOCAL_TRUST,
    is_export_ready: false,
    capacity_indicator: 'Wholesale Bales',
    premium_features_enabled: true,
    products: [
      { id: 'p-jumbo-1', name: 'Premium UK Summer Jumbo Bale', price: 155000, imageUrl: 'https://images.unsplash.com/photo-1523381235312-3a1574da1e28?q=80&w=400', condition: 'Fairly Used', status: 'active' }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'biz-verified-1000',
    name: 'Enyimba Verified Hub (1000 Tier)',
    email: 'verified@findaba.com',
    category: Category.SHOEMAKING,
    primary_product_or_service: 'Verified Industrial Supply',
    active_features: { physical_verification_badge: true },
    area: 'Ariaria International',
    description: 'A verified industrial hub for high-quality production and trade. Payment confirmed by Paystack.',
    address: 'Ariaria, Aba',
    phone_whatsapp: '+2348000000000',
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800',
    rating: 0,
    review_count: 0,
    latitude: 5.112,
    longitude: 7.335,
    status: 'approved',
    verification_status: VerificationStatus.UNVERIFIED,
    verification_level: VerificationLevel.NONE,
    integrity_grade: IntegrityGrade.C,
    hub_tier: HubTier.LOCAL_TRUST,
    subscription_tier: SubscriptionTier.VERIFIED,
    is_export_ready: true,
    capacity_indicator: 'Verified Hub',
    premium_features_enabled: true,
    products: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'biz-local-trust-hub-01',
    name: 'Enyimba Local Trust Hub',
    email: 'trusthub@findaba.com',
    category: Category.TAILORING,
    primary_product_or_service: 'Verified Tailoring Partner',
    active_features: { physical_verification_badge: true },
    area: 'Ngwa Road Hub',
    description: 'A verified Local Trust Hub partner specializing in industrial garment production. Payment confirmed and verified.',
    address: 'Ngwa Road, Aba',
    phone_whatsapp: '+2348000000001',
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800',
    rating: 0,
    review_count: 0,
    latitude: 5.102,
    longitude: 7.365,
    status: 'approved',
    verification_status: VerificationStatus.UNVERIFIED,
    verification_level: VerificationLevel.NONE,
    integrity_grade: IntegrityGrade.C,
    hub_tier: HubTier.LOCAL_TRUST,
    subscription_tier: SubscriptionTier.VERIFIED,
    is_export_ready: true,
    capacity_indicator: 'Verified Hub',
    premium_features_enabled: true,
    products: [],
    created_at: new Date().toISOString()
  }
];

export const BUSINESS_PLANS: BusinessPlan[] = [
  {
    id: SubscriptionTier.FREE,
    name: 'Starter Hub',
    monthlyAmount: 0,
    yearlyAmount: 0,
    slots: 1,
    features: ['Basic Directory Entry', 'Standard Contact Protocol', 'Community Access']
  },
  {
    id: SubscriptionTier.VERIFIED,
    name: 'Local Trust Hub',
    monthlyAmount: 2500,
    yearlyAmount: 2500, // 45 Day Cycle
    slots: 15,
    features: ['Trusted Partner Badge', 'Verified Hub Profile', 'Local Signal Priority']
  },
  {
    id: SubscriptionTier.GROWTH,
    name: 'Growth Engine Hub',
    monthlyAmount: 5000,
    yearlyAmount: 5000, // 45 Day Cycle
    slots: 40,
    features: ['Search Priority Partner', 'Advanced Creative Lab Access', 'City Pulse Insights']
  },
  {
    id: SubscriptionTier.PREMIUM,
    name: 'Export Ready Hub',
    monthlyAmount: 10000,
    yearlyAmount: 10000, // 45 Day Cycle
    slots: 100,
    features: ['Verified Exporter Partner', 'Unlimited Discovery Ranking', 'Global Buyer Signals']
  }
];

export const LEGAL_POLICIES: Record<LegalDocType, { title: string; updated: string; content: string }> = {
  terms: {
    title: "Terms of Service",
    updated: "January 1, 2025",
    content: `FindAba is a digital marketplace and service-connection platform owned and operated by SANDALSroyalle... Special Events & Protocols Services Hub (Nigeria). By accessing this platform, you agree to these Terms. FindAba acts strictly as a technology intermediary connecting users with independent vendors and logistics providers.`
  },
  privacy: {
    title: "Privacy Policy",
    updated: "January 1, 2025",
    content: "We respect your industrial data. Your information is used strictly for trade connection and platform security."
  },
  refund: {
    title: "Refund Policy",
    updated: "January 1, 2025",
    content: "Escrow payments are released only upon confirmation of delivery. Refunds are processed in case of verified trade disputes."
  },
  vendor: {
    title: "Vendor Agreement",
    updated: "January 1, 2025",
    content: "Vendors must maintain industrial integrity and provide accurate specifications for all listed assets."
  },
  ads: {
    title: "Advertising Policy",
    updated: "January 1, 2025",
    content: "Sponsored content must be clearly marked and must not mislead the Enyimba trade community."
  },
  license: {
    title: "Software License",
    updated: "January 1, 2025",
    content: "The FindAba City OS is proprietary software of SANDALSroyalle. Unauthorized reproduction is prohibited."
  }
};

export const AD_TIERS: Record<AdType, { name: string, prices: { price: number, duration: number, label: string }[] }> = {
  featured_listing: {
    name: 'Featured Listing',
    prices: [
      { price: 3000, duration: 7, label: '7 Days' },
      { price: 10000, duration: 30, label: '30 Days' }
    ]
  },
  banner: {
    name: 'Hub Banner',
    prices: [
      { price: 15000, duration: 7, label: '7 Days' },
      { price: 50000, duration: 30, label: '30 Days' }
    ]
  },
  sponsored_story: {
    name: 'Sponsored Story',
    prices: [
      { price: 20000, duration: 30, label: '30 Days' }
    ]
  }
};

export const ORACLE_AVATAR = "https://images.unsplash.com/photo-1540562760343-6902269a9b13?q=80&w=800&auto=format&fit=crop";
export const SANDALS_HQ_IMAGE = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop";
export const DEFAULT_HERO_IMAGES = ["https://images.unsplash.com/photo-1531315630201-bb15bbeb166a?q=80&w=1200"];

export const SANDALS_CORPORATE_BRANCHES = [
  {
    id: 'hotels',
    name: 'SANDALSroyalle Hotels',
    tagline: 'Premium Executive Stays',
    description: 'Providing world-class hospitality for visiting trade partners and industrial masters.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200',
    offerings: ['Executive Suites', 'Industrial Lounges', 'Concierge Service']
  },
  {
    id: 'logistics',
    name: 'Carry-Go Logistics',
    tagline: 'Precision Freight Protocol',
    description: 'The industrial backbone of Enyimba, moving goods with speed and integrity.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200',
    offerings: ['Hub-to-Hub Delivery', 'Secure Warehousing', 'Global Waybills']
  }
];
