import { Linking, Platform } from 'react-native';
import { getSetting, setSetting } from '../storage';

// Settings keys
const AMAZON_AFFILIATE_TAG = 'amazon_affiliate_tag';

// Product search result
export type ProductResult = {
  id: string;
  title: string;
  price?: string;
  priceValue?: number;
  imageUrl?: string;
  productUrl: string;
  source: 'amazon' | 'google';
  rating?: number;
  reviewCount?: number;
};

// Search parameters built from item attributes
export type ProductSearchParams = {
  category: string;
  description?: string;
  colors?: string[];
  style?: string[];
  material?: string;
  keywords?: string[];
};

// Affiliate configuration
export type AffiliateConfig = {
  amazonTag?: string;
};

class AffiliateService {
  private config: AffiliateConfig = {};
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const amazonTag = await getSetting(AMAZON_AFFILIATE_TAG);
    this.config.amazonTag = amazonTag || undefined;
    this.initialized = true;
  }

  async configure(config: Partial<AffiliateConfig>): Promise<void> {
    if (config.amazonTag !== undefined) {
      await setSetting(AMAZON_AFFILIATE_TAG, config.amazonTag);
      this.config.amazonTag = config.amazonTag;
    }
    this.initialized = true;
  }

  async getConfig(): Promise<AffiliateConfig> {
    await this.initialize();
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!this.config.amazonTag;
  }

  /**
   * Build a search query from product parameters
   */
  buildSearchQuery(params: ProductSearchParams): string {
    const parts: string[] = [];

    // Add category
    if (params.category) {
      parts.push(params.category);
    }

    // Add description
    if (params.description) {
      parts.push(params.description);
    }

    // Add primary color
    if (params.colors?.length) {
      parts.push(params.colors[0]);
    }

    // Add style if available
    if (params.style?.length) {
      parts.push(params.style[0]);
    }

    // Add material if specified
    if (params.material) {
      parts.push(params.material);
    }

    // Add any additional keywords
    if (params.keywords?.length) {
      parts.push(...params.keywords);
    }

    return parts.join(' ');
  }

  /**
   * Generate Amazon search URL with affiliate tag
   */
  getAmazonSearchUrl(query: string, category?: string): string {
    const encodedQuery = encodeURIComponent(query);
    const tag = this.config.amazonTag || 'suburbanoutfit-20';

    // Map our categories to Amazon search indexes
    const amazonNode = this.getCategoryNode(category);

    let url = `https://www.amazon.com/s?k=${encodedQuery}&tag=${tag}`;

    if (amazonNode) {
      url += `&i=${amazonNode}`;
    }

    return url;
  }

  /**
   * Generate Google Shopping search URL
   */
  getGoogleShoppingUrl(query: string): string {
    const encodedQuery = encodeURIComponent(query);
    return `https://www.google.com/search?q=${encodedQuery}&tbm=shop`;
  }

  /**
   * Get Amazon category node for better search results
   */
  private getCategoryNode(category?: string): string | null {
    if (!category) return 'fashion';

    const categoryMap: Record<string, string> = {
      top: 'fashion-mens-clothing,fashion-womens-clothing',
      bottom: 'fashion-mens-clothing,fashion-womens-clothing',
      shoes: 'fashion-mens-shoes,fashion-womens-shoes',
      outerwear: 'fashion-mens-clothing,fashion-womens-clothing',
      hat: 'fashion',
      accessory: 'fashion',
      dress: 'fashion-womens-clothing',
      suit: 'fashion-mens-clothing',
    };

    return categoryMap[category.toLowerCase()] || 'fashion';
  }

  /**
   * Open product URL - tries app first, falls back to browser
   */
  async openProductUrl(url: string): Promise<boolean> {
    try {
      // Try to open Amazon app on mobile
      if (url.includes('amazon.com') && Platform.OS !== 'web') {
        const amazonAppUrl = this.getAmazonAppUrl(url);
        const canOpenApp = await Linking.canOpenURL(amazonAppUrl);

        if (canOpenApp) {
          await Linking.openURL(amazonAppUrl);
          return true;
        }
      }

      // Fall back to browser
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to open product URL:', error);
      return false;
    }
  }

  /**
   * Convert Amazon web URL to app deep link
   */
  private getAmazonAppUrl(webUrl: string): string {
    // Amazon app URL scheme
    if (Platform.OS === 'ios') {
      return `com.amazon.mobile.shopping://www.amazon.com${new URL(webUrl).pathname}${new URL(webUrl).search}`;
    } else if (Platform.OS === 'android') {
      return `intent://www.amazon.com${new URL(webUrl).pathname}${new URL(webUrl).search}#Intent;scheme=https;package=com.amazon.mShop.android.shopping;end`;
    }
    return webUrl;
  }

  /**
   * Generate shopping links for a missing item from inspiration matching
   */
  getShoppingLinksForMissingItem(item: {
    category: string;
    description: string;
    colors?: string[];
    style?: string[];
  }): { amazon: string; google: string } {
    const query = this.buildSearchQuery({
      category: item.category,
      description: item.description,
      colors: item.colors,
      style: item.style,
    });

    return {
      amazon: this.getAmazonSearchUrl(query, item.category),
      google: this.getGoogleShoppingUrl(query),
    };
  }

  /**
   * Generate shopping links for finding similar items to one you own
   */
  getShoppingLinksForSimilarItem(item: {
    name: string;
    category?: string;
    colors?: string[];
    style?: string[];
    material?: string;
  }): { amazon: string; google: string } {
    const query = this.buildSearchQuery({
      category: item.category || '',
      description: item.name,
      colors: item.colors,
      style: item.style,
      material: item.material,
    });

    return {
      amazon: this.getAmazonSearchUrl(query, item.category),
      google: this.getGoogleShoppingUrl(query),
    };
  }

  /**
   * Generate shopping links for a specific search query
   */
  getShoppingLinks(query: string, category?: string): { amazon: string; google: string } {
    return {
      amazon: this.getAmazonSearchUrl(query, category),
      google: this.getGoogleShoppingUrl(query),
    };
  }
}

// Singleton instance
export const affiliateService = new AffiliateService();
