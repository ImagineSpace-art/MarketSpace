import type { StoreSection, StoreSectionType, StoreThemeConfig, StoreNavConfig } from '../../types'

export interface SectionDefinition {
  type: StoreSectionType
  name: string
  icon: string
  description: string
  defaultSettings: Record<string, any>
}

export const DEFAULT_NAVIGATION_CONFIG: StoreNavConfig = {
  layout: 'logo-left',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  accentColor: '#0f172a',
  isSticky: true,
  showSearch: true,
  showContactBtn: true,
  showFollowBtn: true,
  showNotificationsBtn: true,
  showPanelBtn: true,
  showCartBtn: true,
  logoStyle: 'both',
  links: [
    { id: 'nav_1', label: 'Home', url: '#top', type: 'section' },
    { id: 'nav_2', label: 'All Products', url: '#products', type: 'all' },
    { id: 'nav_3', label: 'Departments', url: '#departments', type: 'section' },
    { id: 'nav_4', label: 'About Us', url: '#story', type: 'section' },
    { id: 'nav_5', label: 'Reviews', url: '#testimonials', type: 'section' },
    { id: 'nav_6', label: 'FAQ', url: '#faq', type: 'section' },
  ]
}

export const AVAILABLE_SECTIONS: SectionDefinition[] = [
  {
    type: 'bento_grid',
    name: 'Bento Grid Promo',
    icon: 'dashboard_customize',
    description: 'Multi-tile asymmetric bento showcase for products, fashion highlights, and gifts.',
    defaultSettings: {
      mode: 'hero', // 'hero' | 'triplet'
    }
  },
  {
    type: 'hero_banner',
    name: 'Hero Banner',
    icon: 'view_carousel',
    description: 'Prominent headline, background image, and call-to-action button.',
    defaultSettings: {
      headline: 'Welcome to Our Store',
      tagline: 'Discover handcrafted products, curated deals, and premium quality.',
      buttonText: 'Browse Catalog',
      buttonLink: '#products',
      bgImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      align: 'center', // 'left' | 'center'
      overlayDarkness: 50, // 0 - 90 %
      height: 'medium', // 'small' | 'medium' | 'large'
    }
  },
  {
    type: 'categories_grid',
    name: 'Departments Grid',
    icon: 'grid_view',
    description: 'Visual cards showcasing your store departments and collections.',
    defaultSettings: {
      title: 'Shop by Department',
      subtitle: 'Browse our curated collections',
      layout: 'grid', // 'grid' | 'chips'
    }
  },
  {
    type: 'featured_products',
    name: 'Featured Products',
    icon: 'star',
    description: 'Grid of selected items or bestsellers from your store inventory.',
    defaultSettings: {
      title: 'Featured Collection',
      subtitle: 'Handpicked products from our catalog',
      departmentFilter: 'all', // 'all' | colId
      columns: 4, // 2 | 3 | 4
      limit: 8,
    }
  },
  {
    type: 'promo_banner',
    name: 'Promotional Banner',
    icon: 'campaign',
    description: 'Split section with text, button, and featured highlight image.',
    defaultSettings: {
      badge: 'Limited Offer',
      title: 'Special Collection Drop',
      description: 'Get verified items directly delivered to your doorstep with guaranteed inspection.',
      buttonText: 'Shop the Drop',
      buttonLink: '#products',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
      bgColor: '#0f172a',
      textColor: '#ffffff',
    }
  },
  {
    type: 'rich_text',
    name: 'Brand Story / Rich Text',
    icon: 'format_quote',
    description: 'Tell your store story, brand manifesto, or craftsmanship promise.',
    defaultSettings: {
      heading: 'About Our Craft & Quality',
      body: 'We are committed to delivering authentic, verified goods with premium service. Each product in our store is carefully inspected before handover.',
      align: 'center', // 'left' | 'center'
    }
  },
  {
    type: 'testimonials',
    name: 'Customer Reviews',
    icon: 'rate_review',
    description: 'Social proof showcasing real buyer ratings and feedback.',
    defaultSettings: {
      title: 'Loved by Customers',
      quotes: [
        {
          id: '1',
          name: 'Sarah M.',
          role: 'Verified Buyer',
          rating: 5,
          text: 'The best seller experience I’ve had on MarketSpace. Fast response and authentic item.'
        },
        {
          id: '2',
          name: 'John B.',
          role: 'Repeat Shopper',
          rating: 5,
          text: 'Fair pricing and top-tier customer care. Highly recommended to everyone.'
        }
      ]
    }
  },
  {
    type: 'faq',
    name: 'Store FAQ',
    icon: 'help_outline',
    description: 'Frequently asked questions regarding delivery, returns, and ordering.',
    defaultSettings: {
      title: 'Frequently Asked Questions',
      items: [
        {
          id: '1',
          question: 'How do I place an order?',
          answer: 'Tap "Chat" or message us via WhatsApp. We will promptly confirm stock and arrange delivery.'
        },
        {
          id: '2',
          question: 'Can I inspect items before final payment?',
          answer: 'Yes, we provide in-person meetup options and transparent condition photos.'
        }
      ]
    }
  },
  {
    type: 'announcement',
    name: 'Announcement Bar',
    icon: 'notification_important',
    description: 'Top/inline ribbon for alerts, sales promotions, or notices.',
    defaultSettings: {
      text: 'Special seasonal offers available this week only! Contact us for custom orders.',
      bgColor: '#2563eb',
      textColor: '#ffffff',
    }
  },
  {
    type: 'countdown_deal',
    name: 'Flash Sale Countdown',
    icon: 'timer',
    description: 'Pastel countdown ticker with live clock, discount promo code, and call-to-action.',
    defaultSettings: {
      title: 'Flash Sale ending soon!',
      description: 'Save more than ever on these exclusive pieces',
      buttonText: 'Use Code FLASH50',
      buttonLink: '#products',
      promoCode: 'FLASH50',
      bgColor: '#fef08a',
      textColor: '#0f172a',
      days: 16,
      hours: 8,
      minutes: 36,
      seconds: 49,
    }
  },
  {
    type: 'editorial_grid',
    name: 'Editorial Lifestyle Grid',
    icon: 'view_week',
    description: '4-column high-impact visual lookbook cards with floating shop pill buttons.',
    defaultSettings: {
      items: [
        {
          id: 'ed_1',
          title: 'Material Natural',
          subtitle: 'Solid Oak Frame',
          image: 'https://images.unsplash.com/photo-1580481077195-7385f50d8830?w=800&auto=format&fit=crop&q=80',
          buttonText: 'Shop',
          buttonLink: '#products'
        },
        {
          id: 'ed_2',
          title: 'Authentic Design',
          subtitle: 'Artisan Decor',
          image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80',
          buttonText: 'Shop',
          buttonLink: '#products'
        },
        {
          id: 'ed_3',
          title: 'Kinoto Lighting',
          subtitle: 'Modern Chrome Dome',
          image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80',
          buttonText: 'Shop',
          buttonLink: '#products'
        },
        {
          id: 'ed_4',
          title: 'Nightstand',
          subtitle: 'Walnut Bedside Storage',
          image: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=800&auto=format&fit=crop&q=80',
          buttonText: 'Shop',
          buttonLink: '#products'
        }
      ]
    }
  },
  {
    type: 'featured_collection_split',
    name: 'Split Collection Showcase',
    icon: 'splitscreen',
    description: 'Editorial split showcase with collection story, interactive swatch selectors, and hero lifestyle image.',
    defaultSettings: {
      badge: 'Featured Collection',
      title: 'Heritage Living',
      subtitle: 'The Haven Collection — Solace Series',
      description: 'Designed for tactile comfort and versatile spatial layouts, the Solace Series combines sustainably harvested oak frames with premium linen upholstery.',
      buttonText: 'Shop Collection',
      buttonLink: '#products',
      image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&auto=format&fit=crop&q=80'
    }
  }
]

// ---------------- OFFICIAL THEME PRESETS: HYPER, XTRA ----------------

export interface CarouselCard {
  title: string
  image: string
  imageAlt?: string
  badgeText?: string
  actionType?: 'coupon' | 'qr' | 'badge' | 'text'
  couponCode?: string
}

export interface CarouselSlide {
  id: string
  headline: string
  tagline: string
  buttonText: string
  buttonLink: string
  disclaimer?: string
  accentBar?: string
  couponCode?: string
  cards: CarouselCard[]
}

export const DEFAULT_HYPER_SLIDES: CarouselSlide[] = [
  {
    id: 'slide_1',
    accentBar: 'linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)',
    headline: 'Claim your in-app $15* off!',
    tagline: 'Save on your favorites when you spend over $100.',
    buttonText: 'Redeem the coupon',
    buttonLink: '#products',
    disclaimer: '*Starts 09/20. Max 10k red, 1x. See T&Cs.',
    couponCode: 'APP15WEB',
    cards: [
      {
        title: 'Copy this coupon code:',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Accessories',
        badgeText: 'APP15WEB',
        actionType: 'coupon',
        couponCode: 'APP15WEB'
      },
      {
        title: 'Scan to shop:',
        image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Motors & Auto',
        badgeText: 'Scan with camera',
        actionType: 'qr'
      },
      {
        title: 'Apply code and get',
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Electronics',
        badgeText: '$15* off!',
        actionType: 'badge'
      }
    ]
  },
  {
    id: 'slide_2',
    accentBar: 'linear-gradient(180deg, #3665f3 0%, #1e40af 100%)',
    headline: 'Supercharge your gear for less',
    tagline: 'Refurbished pro laptops, high-res audio and flagship tech with direct store warranty.',
    buttonText: 'Shop Pro Hardware',
    buttonLink: '#products',
    disclaimer: '*1-year seller warranty included on certified items.',
    cards: [
      {
        title: 'Inspected & Certified',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Laptop Pro',
        badgeText: '65-Point Quality Test',
        actionType: 'text'
      },
      {
        title: 'Direct Courier Delivery',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Audio Pro',
        badgeText: '48h Express Dispatch',
        actionType: 'text'
      },
      {
        title: 'Verified Store Savings',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Mobile Hardware',
        badgeText: 'Up to 40% Off',
        actionType: 'badge'
      }
    ]
  },
  {
    id: 'slide_3',
    accentBar: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
    headline: 'Verified Drops & Authenticity',
    tagline: 'Every collector piece, watch and sneaker verified by official multi-point inspection.',
    buttonText: 'Explore Certified',
    buttonLink: '#products',
    disclaimer: '*MarketSpace Authenticity Guarantee covers all eligible items.',
    cards: [
      {
        title: 'Physical Authentication',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Luxury Watch',
        badgeText: 'Verified Authentic',
        actionType: 'text'
      },
      {
        title: 'Tamper-Proof Seal',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Collector Sneaker',
        badgeText: 'NFC Security Tagged',
        actionType: 'text'
      },
      {
        title: 'Zero Risk Guarantee',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Designer Bag',
        badgeText: '100% Money Back',
        actionType: 'badge'
      }
    ]
  },
  {
    id: 'slide_4',
    accentBar: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
    headline: 'Store VIP Rewards & Perks',
    tagline: 'Join our buyer circle for private pricing, seasonal catalog previews, and priority support.',
    buttonText: 'Join VIP Member Club',
    buttonLink: '#story',
    disclaimer: '*Free to join for all registered customers.',
    cards: [
      {
        title: 'Instant Membership',
        image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'VIP Card',
        badgeText: 'Free 1-Click Access',
        actionType: 'text'
      },
      {
        title: 'Earn Store Points',
        image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'Rewards Point',
        badgeText: '2x Points on Orders',
        actionType: 'text'
      },
      {
        title: 'Concierge Seller Chat',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        imageAlt: 'VIP Concierge',
        badgeText: 'Priority Desk',
        actionType: 'badge'
      }
    ]
  }
]

export const HYPER_THEME: StoreThemeConfig = {
  presetName: 'hyper',
  primaryColor: '#3665f3',
  fontFamily: 'Inter',
  bannerStyle: 'contained',
  navigation: {
    layout: 'logo-left',
    backgroundColor: '#ffffff',
    textColor: '#191919',
    accentColor: '#3665f3',
    isSticky: true,
    showSearch: true,
    showCategorySelector: true,
    showContactBtn: true,
    showFollowBtn: true,
    showNotificationsBtn: true,
    showPanelBtn: true,
    showCartBtn: true,
    logoStyle: 'both',
    links: [
      { id: 'nav_h_1', label: 'Saved', url: '#products', type: 'category' },
      { id: 'nav_h_2', label: 'Electronics', url: '#products', type: 'category' },
      { id: 'nav_h_3', label: 'Motors', url: '#products', type: 'category' },
      { id: 'nav_h_4', label: 'Fashion', url: '#products', type: 'category' },
      { id: 'nav_h_5', label: 'Collectibles and art', url: '#products', type: 'category' },
      { id: 'nav_h_6', label: 'Sports', url: '#products', type: 'category' },
      { id: 'nav_h_7', label: 'Health and beauty', url: '#products', type: 'category' },
      { id: 'nav_h_8', label: 'Industrial equipment', url: '#products', type: 'category' },
      { id: 'nav_h_9', label: 'Home and garden', url: '#products', type: 'category' },
      { id: 'nav_h_10', label: 'Deals', url: '#products', type: 'section' },
      { id: 'nav_h_11', label: 'Sell', url: '#care', type: 'section' },
    ]
  },
  cartDrawer: {
    enabled: true,
    headline: 'Shopping Cart',
    freeShippingThreshold: 100,
    freeShippingMessage: 'Free shipping eligible on orders over $100',
    checkoutNote: 'MarketSpace Money Back Guarantee: Get the item you ordered or your money back.',
  },
  panel: {
    enabled: true,
    title: 'MarketSpace Guarantee & Policies',
    subtitle: 'Money Back Guarantee, secure checkout, and verified fast dispatch.',
    badgeText: 'Top Rated Plus Seller',
    highlights: [
      { icon: 'verified_user', title: 'Money Back Guarantee', desc: 'Get the item you ordered or your money back. Covers purchase price and original shipping.' },
      { icon: 'local_shipping', title: 'Fast & Free Tracked Shipping', desc: 'Ships within 1 business day with provided tracking information.' },
      { icon: 'replay', title: 'Hassle-Free 30-Day Returns', desc: 'Seller pays for return shipping on qualifying items.' },
      { icon: 'headset_mic', title: 'Dedicated Customer Service', desc: 'Live response within hours for inquiries and custom order quotes.' },
    ]
  },
  sections: [
    {
      id: 'sec_ann_hyper',
      type: 'announcement',
      enabled: true,
      settings: {
        text: 'Claim your $15* off! Use code APP15WEB on orders over $100 | Free shipping on millions of items',
        bgColor: '#191919',
        textColor: '#ffffff',
      }
    },
    {
      id: 'sec_hero_hyper',
      type: 'hero_banner',
      enabled: true,
      settings: {
        style: 'hyper_coupon',
        headline: 'Claim your in-app $15* off!',
        subheadline: 'Save on your favorites when you spend over $100.',
        tagline: '*Min spend $100. Max $15 off. TnCs apply.',
        buttonText: 'Redeem the coupon',
        buttonLink: '#products',
        couponCode: 'APP15WEB',
        buttonBg: '#191919',
        buttonColor: '#ffffff',
        buttonStyle: 'pill',
        height: 'medium',
        slides: DEFAULT_HYPER_SLIDES,
      }
    },
    {
      id: 'sec_future_hands',
      type: 'categories_grid',
      enabled: true,
      settings: {
        title: 'The future in your hands',
        layout: 'squares',
        items: [
          { id: 'c_laptop', label: 'Laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'c_parts', label: 'Computer parts', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'c_phones', label: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'c_networking', label: 'Enterprise networking', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'c_tablets', label: 'Tablets and eBooks', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'c_storage', label: 'Storage and blank media', image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'c_lenses', label: 'Lenses and filters', image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=300&auto=format&fit=crop&q=80', link: '#products' },
        ]
      }
    },
    {
      id: 'sec_shopping_easy',
      type: 'promo_banner',
      enabled: true,
      settings: {
        style: 'trust_banner',
        headline: 'Shopping made easy',
        subheadline: 'enjoy reliability, secure deliveries and hassle-free returns.',
        buttonText: 'Start now',
        buttonLink: '#products',
        bgColor: '#ffffff',
        borderColor: '#e5e5e5',
      }
    },
    {
      id: 'sec_shop_world',
      type: 'featured_collection_split',
      enabled: true,
      settings: {
        style: 'purple_promo',
        badge: 'International Shipping',
        title: 'Shop the world. Ship for free.',
        subtitle: 'Worldwide Finds',
        description: 'Discover international finds with free shipping included.',
        buttonText: 'Shop now',
        buttonLink: '#products',
        bgColor: '#5c2dd5',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80'
        ]
      }
    },
    {
      id: 'sec_todays_deals',
      type: 'featured_products',
      enabled: true,
      settings: {
        title: "Today's Deals",
        subtitle: 'All with free shipping',
        departmentFilter: 'all',
        columns: 5,
        limit: 10,
      }
    },
    {
      id: 'sec_trending_hyper',
      type: 'categories_grid',
      enabled: true,
      settings: {
        title: 'Trending in Store',
        layout: 'squares',
        items: [
          { id: 'tr_tech', label: 'Tech', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'tr_motors', label: 'Motors', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'tr_luxury', label: 'Luxury', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'tr_collectibles', label: 'Collectibles and art', image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'tr_home', label: 'Home and garden', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'tr_cards', label: 'Trading cards', image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=300&auto=format&fit=crop&q=80', link: '#products' },
          { id: 'tr_beauty', label: 'Health and beauty', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80', link: '#products' },
        ]
      }
    },
    {
      id: 'sec_endless_accessories',
      type: 'promo_banner',
      enabled: true,
      settings: {
        style: 'dark_accessories',
        headline: 'Endless accessories. Epic prices.',
        subheadline: 'Browse millions of upgrades for your ride.',
        buttonText: 'Shop now',
        buttonLink: '#products',
        bgColor: '#191919',
        textColor: '#ffffff',
        images: [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&auto=format&fit=crop&q=80'
        ]
      }
    }
  ]
}

export const XTRA_THEME: StoreThemeConfig = {
  presetName: 'xtra',
  primaryColor: '#1e1b4b',
  fontFamily: 'Outfit',
  bannerStyle: 'full-bleed',
  navigation: {
    layout: 'logo-left',
    backgroundColor: '#1e1b4b',
    textColor: '#ffffff',
    accentColor: '#facc15',
    isSticky: true,
    showSearch: true,
    showCategorySelector: true,
    showContactBtn: true,
    showFollowBtn: true,
    showNotificationsBtn: true,
    showPanelBtn: true,
    showCartBtn: true,
    logoStyle: 'both',
    links: [
      { id: 'nav_x_1', label: 'Books', url: '#products', type: 'category' },
      { id: 'nav_x_2', label: 'Gift Cards', url: '#products', type: 'category' },
      { id: 'nav_x_3', label: 'Electronics', url: '#products', type: 'category' },
      { id: 'nav_x_4', label: 'Cell Phones', url: '#products', type: 'category' },
      { id: 'nav_x_5', label: 'Cameras', url: '#products', type: 'category' },
      { id: 'nav_x_6', label: 'Audio & Headphones', url: '#products', type: 'category' },
      { id: 'nav_x_7', label: 'Fashion & Shoes', url: '#departments', type: 'section' },
      { id: 'nav_x_8', label: 'Gifts', url: '#split_gifts', type: 'section' },
      { id: 'nav_x_9', label: 'Toys & Video Games', url: '#products', type: 'category' },
      { id: 'nav_x_10', label: 'Sale', url: '#products', type: 'category' },
      { id: 'nav_x_11', label: 'Outlet', url: '#products', type: 'category' },
      { id: 'nav_x_12', label: 'Flash Deals', url: '#products', type: 'category' },
    ]
  },
  cartDrawer: {
    enabled: true,
    headline: 'Shopping Bag',
    freeShippingThreshold: 50,
    freeShippingMessage: '✓ You unlocked FREE Express Tracked Delivery on orders over $50!',
    checkoutNote: 'Complimentary gift packaging & live courier tracking link provided upon dispatch.',
  },
  panel: {
    enabled: true,
    title: 'Xtra Superstore Perks & Care',
    subtitle: 'Free 60-day return policy, pick up in 100+ stores & guaranteed fast shipping.',
    badgeText: 'Someone You Know Certified Superstore',
    highlights: [
      { icon: 'published_with_changes', title: 'Free 60-Day Returns', desc: 'Return any unopened item for a 100% refund with prepaid return labels.' },
      { icon: 'storefront', title: 'Pick up in 100+ Stores', desc: 'Order online and collect your package ready in 2 hours at any store location.' },
      { icon: 'local_shipping', title: 'Fast Express Shipping', desc: 'Same-day dispatch on orders placed before 3 PM with real-time tracking.' },
      { icon: 'card_giftcard', title: 'Free Gifts with Every Order', desc: 'Unlock bonus sample kits and gift perks with qualifying department orders.' },
    ]
  },
  sections: [
    {
      id: 'sec_ann_xtra',
      type: 'announcement',
      enabled: true,
      settings: {
        text: '✓ Free 60-day return policy  •  ✓ Pick up in 100+ stores & fast shipping  •  ✓ Express packaging and tracked worldwide',
        bgColor: '#f43f5e',
        textColor: '#ffffff',
      }
    },
    {
      id: 'sec_bento_hero_xtra',
      type: 'bento_grid',
      enabled: true,
      settings: {
        mode: 'hero',
      }
    },
    {
      id: 'sec_cats_xtra',
      type: 'categories_grid',
      enabled: true,
      settings: {
        title: 'Top selling collections',
        subtitle: 'Shop the most popular categories this week',
        layout: 'squares',
        viewAllLink: '#products',
      }
    },
    {
      id: 'sec_prod_xtra_stock',
      type: 'featured_products',
      enabled: true,
      settings: {
        title: 'Back in stock this week',
        subtitle: 'Customer favorites just restocked in limited quantities',
        departmentFilter: 'all',
        columns: 4,
        limit: 4,
      }
    },
    {
      id: 'sec_triplet_xtra',
      type: 'bento_grid',
      enabled: true,
      settings: {
        mode: 'triplet',
      }
    },
    {
      id: 'sec_prod_xtra_sold',
      type: 'featured_products',
      enabled: true,
      settings: {
        title: 'Most sold this week',
        subtitle: 'Top trending products according to verified buyer orders',
        departmentFilter: 'all',
        columns: 4,
        limit: 4,
      }
    },
    {
      id: 'sec_lifestyle_xtra',
      type: 'editorial_grid',
      enabled: true,
      settings: {
        cardStyle: 'card-bottom',
        items: [
          {
            id: 'x_ed_1',
            title: 'Glass terrariums',
            subtitle: 'Handcrafted botanical art & self-contained ecosystems for modern living spaces.',
            image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&auto=format&fit=crop&q=80',
            buttonText: 'Shop now',
            buttonLink: '#products'
          },
          {
            id: 'x_ed_2',
            title: '5G cellular tablets',
            subtitle: 'High-performance ultra-retina displays with precision stylus included for creative pros.',
            image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
            buttonText: 'Shop now',
            buttonLink: '#products'
          },
          {
            id: 'x_ed_3',
            title: 'Headphones',
            subtitle: 'Studio acoustics, active noise cancellation, and ergonomic memory-foam ear cushions.',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            buttonText: 'Shop now',
            buttonLink: '#products'
          }
        ]
      }
    },
    {
      id: 'sec_gifts_xtra',
      type: 'featured_collection_split',
      enabled: true,
      settings: {
        id: 'split_gifts',
        badge: 'Holiday & Celebration',
        title: 'The perfect gifts',
        subtitle: 'Curated sets for every special occasion & home',
        description: 'Discover thoughtfully bundled lifestyle sets, artisan ceramics, luxury grooming kits, and cozy essentials packaged in our signature keepsake gift boxes.',
        buttonText: 'Shop gifts',
        buttonLink: '#products',
        bgColor: '#ecfdf5',
        textColor: '#0f172a',
        buttonBg: '#facc15',
        buttonColor: '#0f172a',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=80'
      }
    },
    {
      id: 'sec_test_xtra',
      type: 'testimonials',
      enabled: true,
      settings: {
        title: 'Our latest customer reviews',
        quotes: [
          {
            id: '1',
            name: 'Emily R.',
            role: 'Verified Buyer',
            rating: 5,
            text: 'The express packaging was pristine and arrived the next afternoon. Love the free gift included!'
          },
          {
            id: '2',
            name: 'Marcus C.',
            role: 'Style Shopper',
            rating: 5,
            text: 'Super earbuds sound phenomenal, even better than my previous pair that cost twice as much.'
          },
          {
            id: '3',
            name: 'Sophia L.',
            role: 'Verified Customer',
            rating: 5,
            text: 'Xtra is hands down the smoothest shopping experience. 10/10 customer care and quality.'
          }
        ]
      }
    },
    {
      id: 'sec_faq_xtra',
      type: 'faq',
      enabled: true,
      settings: {
        title: 'Ordering, Store Pickup & Returns FAQ',
        items: [
          {
            id: '1',
            question: 'How does 2-hour store pickup work?',
            answer: 'Select "Pick up in store" at checkout. Once confirmed, our retail team reserves and packages your items, and you receive an SMS when it is ready to collect.'
          },
          {
            id: '2',
            question: 'What is your 60-day return policy?',
            answer: 'You can return any unused item in its original condition within 60 days for a full refund or exchange. Prepaid return labels are provided.'
          },
          {
            id: '3',
            question: 'Do all orders qualify for free delivery over $50?',
            answer: 'Yes! Any order exceeding $50 automatically receives free express tracked shipping at checkout with zero code required.'
          }
        ]
      }
    }
  ]
}

export const THEME_PRESETS: Record<string, StoreThemeConfig> = {
  hyper: HYPER_THEME,
  xtra: XTRA_THEME,

  // Fallback aliases for backward compatibility
  arctos: HYPER_THEME,
  modern: HYPER_THEME,
  boutique: HYPER_THEME,
  bold: XTRA_THEME,
  minimal: HYPER_THEME,
}

export function createNewSection(type: StoreSectionType): StoreSection {
  const def = AVAILABLE_SECTIONS.find(s => s.type === type)
  const defaultSettings = def ? JSON.parse(JSON.stringify(def.defaultSettings)) : {}
  return {
    id: `sec_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    enabled: true,
    settings: defaultSettings
  }
}
