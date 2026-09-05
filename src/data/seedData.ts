import {
  Category,
  City,
  VendorProfile,
  CustomerRequest,
  Quote,
  Booking,
  Conversation,
  Message,
  Review,
  Notification,
  User,
  BlogPost,
  CommissionSettings,
} from '../types';

export const SEED_CITIES: City[] = [
  {
    id: 'lahore',
    name: 'Lahore',
    province: 'Punjab',
    popularAreas: ['Gulberg', 'DHA Phase 5 & 6', 'Model Town', 'Johar Town', 'Cantt', 'Bahria Town'],
    vendorCount: 0,
    featured: true,
  },
  {
    id: 'karachi',
    name: 'Karachi',
    province: 'Sindh',
    popularAreas: ['Clifton', 'DHA Phase 6', 'Gulshan-e-Iqbal', 'PECHS', 'North Nazimabad', 'Bahria Town Karachi'],
    vendorCount: 0,
    featured: true,
  },
  {
    id: 'islamabad',
    name: 'Islamabad',
    province: 'Federal Capital',
    popularAreas: ['F-6 & F-7', 'F-10 & F-11', 'E-11', 'G-13', 'Bahria Town', 'DHA Phase 2'],
    vendorCount: 0,
    featured: true,
  },
  {
    id: 'rawalpindi',
    name: 'Rawalpindi',
    province: 'Punjab',
    popularAreas: ['Saddar', 'Chaklala Scheme 3', 'Satellite Town', 'Bahria Town Phase 4', 'Westridge'],
    vendorCount: 0,
    featured: true,
  },
  {
    id: 'faisalabad',
    name: 'Faisalabad',
    province: 'Punjab',
    popularAreas: ['Madina Town', 'Peoples Colony', 'D Ground', 'Kohinoor City'],
    vendorCount: 0,
    featured: false,
  },
  {
    id: 'multan',
    name: 'Multan',
    province: 'Punjab',
    popularAreas: ['Cantt', 'Gulgasht Colony', 'Bosan Road', 'Model Town'],
    vendorCount: 0,
    featured: false,
  },
  {
    id: 'sydney',
    name: 'Sydney',
    province: 'New South Wales',
    popularAreas: ['Surry Hills', 'Parramatta', 'Bondi', 'Chatswood', 'Liverpool'],
    vendorCount: 0,
    featured: true,
  },
  {
    id: 'melbourne',
    name: 'Melbourne',
    province: 'Victoria',
    popularAreas: ['Richmond', 'St Kilda', 'Footscray', 'Carlton', 'Sunbury'],
    vendorCount: 0,
    featured: true,
  },
  {
    id: 'brisbane',
    name: 'Brisbane',
    province: 'Queensland',
    popularAreas: ['West End', 'New Farm', 'Chermside', 'Kelvin Grove', 'Capalaba'],
    vendorCount: 0,
    featured: true,
  },
  {
    id: 'perth',
    name: 'Perth',
    province: 'Western Australia',
    popularAreas: ['Subiaco', 'Fremantle', 'Canning Vale', 'Joondalup', 'Midland'],
    vendorCount: 0,
    featured: true,
  },
  {
    id: 'adelaide',
    name: 'Adelaide',
    province: 'South Australia',
    popularAreas: ['Glenelg', 'Norwood', 'Prospect', 'Mile End', 'Mawson Lakes'],
    vendorCount: 0,
    featured: false,
  },
  {
    id: 'canberra',
    name: 'Canberra',
    province: 'Australian Capital Territory',
    popularAreas: ['Civic', 'Acton', 'Kingston', 'Belconnen', 'Wanniassa'],
    vendorCount: 0,
    featured: false,
  },
];

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cakes-baking',
    slug: 'cakes-baking',
    name: 'Cakes & Baking',
    description: 'Custom birthday cakes, cupcakes, artisanal sourdough, brownies, and dessert grazing boxes.',
    iconName: 'Cake',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    vendorCount: 0,
    subcategories: ['Custom Fondant Cakes', 'Bento & Korean Cakes', 'Cupcakes & Brownies', 'Artisanal Breads', 'Dessert Tables'],
    featured: true,
  },
  {
    id: 'home-food',
    slug: 'home-food',
    name: 'Home Food & Catering',
    description: 'Authentic ghar ka khana, daily lunch tiffin services, frozen snacks, and mini catering.',
    iconName: 'Utensils',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    vendorCount: 0,
    subcategories: ['Daily Lunch Tiffins', 'Desi Home Feasts', 'Frozen Samosas & Rolls', 'Diet & Meal Prep', 'Party Platters'],
    featured: true,
  },
  {
    id: 'beauty-makeup',
    slug: 'beauty-makeup',
    name: 'Beauty & Makeup',
    description: 'Certified home studio artists for bridal glam, party makeup, hairstyling, and skincare treatments.',
    iconName: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    vendorCount: 0,
    subcategories: ['Bridal Makeup', 'Party Glam', 'Signature Hairstyling', 'Facials & Skin Prep', 'Lash Extensions'],
    featured: true,
  },
  {
    id: 'mehndi',
    slug: 'mehndi',
    name: 'Mehndi Artists',
    description: 'Exquisite organic henna designs, Arabic, bridal full-arm mehndi, mandala, and kids henna.',
    iconName: 'Palette',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    vendorCount: 0,
    subcategories: ['Bridal Mehndi', 'Arabic Henna', 'Minimalist Mandala', 'Organic Dark Henna', 'Group & Bridesmaids'],
    featured: true,
  },
  {
    id: 'tailoring-fashion',
    slug: 'tailoring-fashion',
    name: 'Tailoring & Stitching',
    description: 'Custom eastern boutique stitching, alterations, bridal couture duplication, and fancy cutwork.',
    iconName: 'Scissors',
    image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80',
    vendorCount: 0,
    subcategories: ['Shalwar Kameez Stitching', 'Bridal & Formal Wear', 'Designer Alterations', 'Kids Festive Wear', 'Western Cuts'],
    featured: true,
  },
  {
    id: 'photography',
    slug: 'photography',
    name: 'Photography & Video',
    description: 'Female photographers for family events, baby milestones, product shoots, and intimate dholkis.',
    iconName: 'Camera',
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    vendorCount: 0,
    subcategories: ['Intimate Events & Dholki', 'Product & Brand Shoot', 'Newborn & Maternity', 'Portraits & Headshots'],
    featured: true,
  },
  {
    id: 'tutors-education',
    slug: 'tutors-education',
    name: 'Tutors & Quran Teachers',
    description: 'Verified home tutors for O/A Levels, Matric/FSc, spoken English, Tajweed, and Quran lessons.',
    iconName: 'BookOpen',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    vendorCount: 0,
    subcategories: ['Female Quran Teacher (Tajweed)', 'O/A Level Science & Math', 'Primary School All-Subjects', 'Spoken English & IELTS'],
    featured: false,
  },
  {
    id: 'crafts-decor',
    slug: 'crafts-decor',
    name: 'Handmade Crafts & Gifts',
    description: 'Personalized resin art, customized gift hampers, embroidered hoops, scented soy candles.',
    iconName: 'Gift',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    vendorCount: 0,
    subcategories: ['Resin & Floral Keepsakes', 'Custom Gift Hampers', 'Scented Soy Wax Candles', 'Calligraphy Artworks'],
    featured: false,
  },
];

// Pure empty seed list — only real onboarded businesses will be shown
export const SEED_VENDORS: VendorProfile[] = [];

// Platform accounts — retain administrator access
export const SEED_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Admin HomeBiz',
    email: 'admin@homebiz.pk',
    password: 'admin123',
    phone: '+92 300 0000000',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    city: 'Lahore',
    createdAt: '2022-10-01T00:00:00Z',
  },
];

export const SEED_REQUESTS: CustomerRequest[] = [];

export const SEED_QUOTES: Quote[] = [];

export const SEED_BOOKINGS: Booking[] = [];

export const SEED_REVIEWS: Review[] = [];

export const SEED_CONVERSATIONS: Conversation[] = [];

export const SEED_MESSAGES: Message[] = [];

export const SEED_NOTIFICATIONS: Notification[] = [];

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    slug: 'supporting-women-home-entrepreneurs-in-pakistan',
    title: 'How Supporting Pakistani Home-Based Businesses is Transforming the Local Economy',
    excerpt: 'From home kitchens in Lahore to boutique stitching in Karachi, women micro-entrepreneurs are redefining financial independence.',
    content: `In Pakistan, over 65% of home-based food, fashion, and beauty businesses are founded and operated by passionate women entrepreneurs. HomeBiz Pakistan was built to bridge the gap between discerning customers who cherish authentic, hygienic, and bespoke services and talented local creators.

When you purchase a custom birthday cake from an artisanal home baker or order your bridal mehndi from a certified organic henna artist, you are not just getting superior craftsmanship—you are directly putting income into a Pakistani household and helping a home business grow.`,
    author: 'Aamna Sheikh',
    authorRole: 'Community Lead',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    category: 'Community & Culture',
    publishedAt: 'March 1, 2025',
    readTime: '4 min read',
  },
  {
    id: 'blog-2',
    slug: 'guide-to-organic-mehndi-stains',
    title: 'The Ultimate Guide to Getting a Dark, Safe Mehndi Stain for Your Big Day',
    excerpt: 'Avoid toxic black chemical henna. Here is how pure Rajasthani organic henna creates rich mahogany stains naturally.',
    content: `Chemical black henna often contains hazardous dyes like PPD that can cause permanent scarring and allergies. Organic henna, sourced from freshly harvested Sojat leaves and blended with cajeput or eucalyptus oil, produces a warm mahogany color that matures over 48 hours.

Tips for the best stain:
1. Keep the mehndi paste on for at least 6 to 8 hours.
2. Apply a lemon-sugar sealant once the paste is semi-dry.
3. Scrape off the dried henna—never wash with water immediately.
4. Avoid water contact for the first 12 hours.`,
    author: 'Noor Fatima',
    authorRole: 'Certified Henna Artist',
    coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    category: 'Beauty Guides',
    publishedAt: 'February 24, 2025',
    readTime: '3 min read',
  },
  {
    id: 'blog-3',
    slug: 'starting-your-home-baking-business-pakistan',
    title: 'How to Launch a Profitable Home Bakery in Lahore or Karachi',
    excerpt: 'Step-by-step guidance on menu design, packaging, pricing in PKR, and taking orders through HomeBiz.',
    content: `Starting a home bakery requires passion, consistency, and the right tools. Focus on 2-3 hero items like signature Korean bento cakes or stuffed brownies before expanding. Calculate your food costs accurately and invest in clean, food-grade packaging.`,
    author: 'Ayesha Tariq',
    authorRole: 'Pastry Chef & Founder',
    coverImage: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
    category: 'Seller Tips',
    publishedAt: 'February 15, 2025',
    readTime: '5 min read',
  },
];

export const SEED_COMMISSION_SETTINGS: CommissionSettings = {
  defaultPercentage: 5,
  featuredListingFee: 1500,
  payoutThreshold: 2000,
};
