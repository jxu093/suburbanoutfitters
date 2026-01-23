/**
 * Phase 6: Shopping Integration Tests
 *
 * Tests for affiliate service, shopping links, product cards,
 * deep linking, and shopping integration in AI features.
 */

import { affiliateService } from '../app/services/affiliate/affiliate-service';
import type { ProductSearchParams } from '../app/services/affiliate/affiliate-service';

describe('Phase 6: Shopping Integration', () => {
  describe('AffiliateService', () => {
    describe('buildSearchQuery', () => {
      it('builds query from category and description', () => {
        const params: ProductSearchParams = {
          category: 'shoes',
          description: 'White leather sneakers',
        };

        const query = affiliateService.buildSearchQuery(params);

        expect(query).toContain('shoes');
        expect(query).toContain('White leather sneakers');
      });

      it('includes primary color only', () => {
        const params: ProductSearchParams = {
          category: 'top',
          description: 'Casual shirt',
          colors: ['navy', 'blue', 'dark blue'],
        };

        const query = affiliateService.buildSearchQuery(params);

        expect(query).toContain('navy');
        expect(query).not.toContain('blue '); // Should not have secondary colors
      });

      it('includes primary style only', () => {
        const params: ProductSearchParams = {
          category: 'bottom',
          description: 'Chinos',
          style: ['casual', 'classic', 'preppy'],
        };

        const query = affiliateService.buildSearchQuery(params);

        expect(query).toContain('casual');
      });

      it('includes material', () => {
        const params: ProductSearchParams = {
          category: 'outerwear',
          material: 'wool',
        };

        const query = affiliateService.buildSearchQuery(params);

        expect(query).toContain('wool');
      });

      it('includes additional keywords', () => {
        const params: ProductSearchParams = {
          category: 'accessory',
          keywords: ['vintage', 'handmade', 'artisan'],
        };

        const query = affiliateService.buildSearchQuery(params);

        expect(query).toContain('vintage');
        expect(query).toContain('handmade');
        expect(query).toContain('artisan');
      });

      it('builds comprehensive query with all params', () => {
        const params: ProductSearchParams = {
          category: 'shoes',
          description: 'Oxford dress shoes',
          colors: ['brown', 'tan'],
          style: ['classic', 'formal'],
          material: 'leather',
          keywords: ['mens', 'brogue'],
        };

        const query = affiliateService.buildSearchQuery(params);

        expect(query).toContain('shoes');
        expect(query).toContain('Oxford dress shoes');
        expect(query).toContain('brown');
        expect(query).toContain('classic');
        expect(query).toContain('leather');
        expect(query).toContain('mens');
        expect(query).toContain('brogue');
      });

      it('handles empty params', () => {
        const params: ProductSearchParams = {
          category: '',
        };

        const query = affiliateService.buildSearchQuery(params);

        expect(query).toBeDefined();
      });

      it('handles missing optional params', () => {
        const params: ProductSearchParams = {
          category: 'top',
        };

        const query = affiliateService.buildSearchQuery(params);

        expect(query).toBe('top');
      });
    });

    describe('getAmazonSearchUrl', () => {
      it('generates valid Amazon search URL', () => {
        const url = affiliateService.getAmazonSearchUrl('blue jeans');

        expect(url).toContain('amazon.com/s');
        expect(url).toContain('k=blue%20jeans');
        expect(url).toContain('tag=');
      });

      it('includes affiliate tag', () => {
        const url = affiliateService.getAmazonSearchUrl('sneakers');

        expect(url).toContain('tag=');
      });

      it('includes category node for fashion items', () => {
        const url = affiliateService.getAmazonSearchUrl('sneakers', 'shoes');

        expect(url).toContain('i=');
        expect(url).toContain('fashion');
      });

      it('URL-encodes special characters', () => {
        const url = affiliateService.getAmazonSearchUrl("women's dress & heels");

        // Apostrophes are not encoded by encodeURIComponent, but & is
        expect(url).toContain("women's");
        expect(url).toContain('%26');
      });

      it('URL-encodes spaces', () => {
        const url = affiliateService.getAmazonSearchUrl('blue dress shoes');

        expect(url).toContain('blue%20dress%20shoes');
      });

      it('handles query with only category', () => {
        const url = affiliateService.getAmazonSearchUrl('shirt', 'top');

        expect(url).toContain('k=shirt');
        expect(url).toContain('i=');
      });
    });

    describe('getGoogleShoppingUrl', () => {
      it('generates valid Google Shopping URL', () => {
        const url = affiliateService.getGoogleShoppingUrl('leather jacket');

        expect(url).toContain('google.com/search');
        expect(url).toContain('q=leather%20jacket');
        expect(url).toContain('tbm=shop');
      });

      it('URL-encodes special characters', () => {
        const url = affiliateService.getGoogleShoppingUrl("men's watch");

        // Apostrophes are not encoded by encodeURIComponent
        expect(url).toContain("men's");
        expect(url).toContain('tbm=shop');
      });

      it('URL-encodes spaces', () => {
        const url = affiliateService.getGoogleShoppingUrl('running shoes');

        expect(url).toContain('running%20shoes');
      });
    });

    describe('getShoppingLinks', () => {
      it('returns both Amazon and Google links', () => {
        const links = affiliateService.getShoppingLinks('red dress');

        expect(links).toHaveProperty('amazon');
        expect(links).toHaveProperty('google');
        expect(links.amazon).toContain('amazon.com');
        expect(links.google).toContain('google.com');
      });

      it('passes category to Amazon for better results', () => {
        const links = affiliateService.getShoppingLinks('running shoes', 'shoes');

        expect(links.amazon).toContain('i=');
      });

      it('same query produces same URLs', () => {
        const links1 = affiliateService.getShoppingLinks('blue jeans');
        const links2 = affiliateService.getShoppingLinks('blue jeans');

        expect(links1.amazon).toBe(links2.amazon);
        expect(links1.google).toBe(links2.google);
      });
    });

    describe('getShoppingLinksForMissingItem', () => {
      it('generates links for missing inspiration item', () => {
        const links = affiliateService.getShoppingLinksForMissingItem({
          category: 'shoes',
          description: 'White leather sneakers',
          colors: ['white'],
          style: ['casual', 'minimalist'],
        });

        expect(links.amazon).toContain('amazon.com');
        expect(links.amazon).toContain('White%20leather%20sneakers');
        expect(links.amazon).toContain('white');
        expect(links.google).toContain('google.com');
      });

      it('handles missing optional fields', () => {
        const links = affiliateService.getShoppingLinksForMissingItem({
          category: 'accessory',
          description: 'Silver watch',
        });

        expect(links.amazon).toContain('Silver%20watch');
        expect(links.google).toContain('Silver%20watch');
      });

      it('includes style in query', () => {
        const links = affiliateService.getShoppingLinksForMissingItem({
          category: 'top',
          description: 'Cashmere sweater',
          style: ['luxury', 'classic'],
        });

        expect(links.amazon).toContain('luxury');
      });
    });

    describe('getShoppingLinksForSimilarItem', () => {
      it('generates links for finding similar items', () => {
        const links = affiliateService.getShoppingLinksForSimilarItem({
          name: 'Navy Polo Shirt',
          category: 'top',
          colors: ['navy', 'blue'],
          style: ['preppy', 'casual'],
          material: 'cotton',
        });

        expect(links.amazon).toContain('Navy%20Polo%20Shirt');
        expect(links.amazon).toContain('navy');
        expect(links.amazon).toContain('cotton');
        expect(links.google).toContain('Navy%20Polo%20Shirt');
      });

      it('works with minimal item info', () => {
        const links = affiliateService.getShoppingLinksForSimilarItem({
          name: 'Black Jeans',
        });

        expect(links.amazon).toContain('Black%20Jeans');
        expect(links.google).toContain('Black%20Jeans');
      });

      it('uses item name as primary search term', () => {
        const links = affiliateService.getShoppingLinksForSimilarItem({
          name: 'Vintage Leather Jacket',
          category: 'outerwear',
        });

        expect(links.amazon).toContain('Vintage%20Leather%20Jacket');
      });
    });

    describe('Category mapping', () => {
      it('maps top to fashion clothing', () => {
        const url = affiliateService.getAmazonSearchUrl('shirt', 'top');

        expect(url).toContain('fashion');
      });

      it('maps bottom to fashion clothing', () => {
        const url = affiliateService.getAmazonSearchUrl('pants', 'bottom');

        expect(url).toContain('fashion');
      });

      it('maps shoes to fashion shoes', () => {
        const url = affiliateService.getAmazonSearchUrl('sneakers', 'shoes');

        expect(url).toContain('fashion');
      });

      it('maps outerwear to fashion clothing', () => {
        const url = affiliateService.getAmazonSearchUrl('jacket', 'outerwear');

        expect(url).toContain('fashion');
      });

      it('maps accessory to fashion', () => {
        const url = affiliateService.getAmazonSearchUrl('belt', 'accessory');

        expect(url).toContain('fashion');
      });

      it('defaults to fashion for unknown categories', () => {
        const url = affiliateService.getAmazonSearchUrl('item', 'unknown-category');

        expect(url).toContain('fashion');
      });

      it('defaults to fashion when no category provided', () => {
        const url = affiliateService.getAmazonSearchUrl('clothing item');

        expect(url).toContain('fashion');
      });
    });

    describe('Configuration', () => {
      it('can configure affiliate tag', async () => {
        await expect(
          affiliateService.configure({ amazonTag: 'test-tag-20' })
        ).resolves.not.toThrow();
      });

      it('can retrieve config', async () => {
        const config = await affiliateService.getConfig();

        expect(config).toHaveProperty('amazonTag');
      });

      it('can check if configured', () => {
        const isConfigured = affiliateService.isConfigured();

        expect(typeof isConfigured).toBe('boolean');
      });
    });
  });
});

describe('Phase 6: Shopping Search Scenarios', () => {
  describe('Missing items from inspiration', () => {
    it('creates searchable query for casual sneakers', () => {
      const params: ProductSearchParams = {
        category: 'shoes',
        description: 'White canvas sneakers with gum sole',
        colors: ['white'],
        style: ['casual', 'streetwear'],
      };

      const query = affiliateService.buildSearchQuery(params);

      expect(query).toContain('shoes');
      expect(query).toContain('White canvas sneakers');
      expect(query).toContain('white');
      expect(query).toContain('casual');
    });

    it('creates searchable query for formal accessory', () => {
      const params: ProductSearchParams = {
        category: 'accessory',
        description: 'Slim leather belt',
        colors: ['brown', 'tan'],
        style: ['classic'],
        material: 'leather',
      };

      const query = affiliateService.buildSearchQuery(params);

      expect(query).toContain('accessory');
      expect(query).toContain('Slim leather belt');
      expect(query).toContain('brown');
      expect(query).toContain('leather');
    });

    it('creates searchable query for outerwear', () => {
      const params: ProductSearchParams = {
        category: 'outerwear',
        description: 'Wool overcoat',
        colors: ['camel', 'tan'],
        style: ['classic', 'elegant'],
        material: 'wool',
      };

      const query = affiliateService.buildSearchQuery(params);

      expect(query).toContain('outerwear');
      expect(query).toContain('Wool overcoat');
      expect(query).toContain('camel');
      expect(query).toContain('wool');
    });
  });

  describe('Similar items search', () => {
    it('generates good search for wardrobe item', () => {
      const links = affiliateService.getShoppingLinksForSimilarItem({
        name: 'Blue Oxford Shirt',
        category: 'top',
        colors: ['blue', 'light blue'],
        style: ['preppy', 'smart casual'],
        material: 'cotton',
      });

      expect(links.amazon).toContain('Blue%20Oxford%20Shirt');
      expect(links.amazon).toContain('blue');
      expect(links.amazon).toContain('cotton');
    });

    it('handles items with minimal metadata', () => {
      const links = affiliateService.getShoppingLinksForSimilarItem({
        name: 'Jacket',
        category: 'outerwear',
      });

      expect(links.amazon).toContain('Jacket');
      expect(links.google).toContain('Jacket');
    });

    it('generates comprehensive search for detailed item', () => {
      const links = affiliateService.getShoppingLinksForSimilarItem({
        name: 'Slim Fit Navy Chinos',
        category: 'bottom',
        colors: ['navy', 'dark blue'],
        style: ['classic', 'business casual'],
        material: 'cotton',
      });

      expect(links.amazon).toContain('Slim%20Fit%20Navy%20Chinos');
      expect(links.amazon).toContain('navy');
      expect(links.amazon).toContain('classic');
      expect(links.amazon).toContain('cotton');
    });
  });
});

describe('Phase 6: URL Encoding', () => {
  it('encodes spaces correctly', () => {
    const url = affiliateService.getAmazonSearchUrl('blue dress');
    expect(url).toContain('blue%20dress');
  });

  it('encodes ampersand correctly', () => {
    const url = affiliateService.getAmazonSearchUrl('shirt & tie');
    expect(url).toContain('%26');
  });

  it('encodes plus sign correctly', () => {
    const url = affiliateService.getAmazonSearchUrl('size L+');
    expect(url).toContain('%2B');
  });

  it('preserves apostrophes (not encoded by encodeURIComponent)', () => {
    const url = affiliateService.getAmazonSearchUrl("women's shoes");
    expect(url).toContain("women's");
  });

  it('encodes hash correctly', () => {
    const url = affiliateService.getAmazonSearchUrl('color #000');
    expect(url).toContain('%23');
  });
});

describe('Phase 6: Integration with AI Features', () => {
  describe('Shop Similar in AI Outfit Generation', () => {
    it('generates shop links for suggested outfit items', () => {
      const outfitItems = [
        { name: 'Navy Polo', category: 'top', colors: ['navy'] },
        { name: 'Khaki Chinos', category: 'bottom', colors: ['khaki'] },
        { name: 'Brown Loafers', category: 'shoes', colors: ['brown'] },
      ];

      outfitItems.forEach((item) => {
        const links = affiliateService.getShoppingLinksForSimilarItem({
          name: item.name,
          category: item.category,
          colors: item.colors,
        });

        expect(links.amazon).toContain('amazon.com');
        expect(links.google).toContain('google.com');
        expect(links.amazon).toContain(encodeURIComponent(item.name));
      });
    });
  });

  describe('Shop Missing Items in Inspiration', () => {
    it('generates shop links for all missing items', () => {
      const missingItems = [
        { category: 'shoes', description: 'White sneakers', colors: ['white'] },
        { category: 'accessory', description: 'Leather belt', colors: ['brown'] },
        { category: 'hat', description: 'Baseball cap', colors: ['navy'] },
      ];

      missingItems.forEach((item) => {
        const links = affiliateService.getShoppingLinksForMissingItem({
          category: item.category,
          description: item.description,
          colors: item.colors,
        });

        expect(links.amazon).toContain('amazon.com');
        expect(links.google).toContain('google.com');
        expect(links.amazon).toContain(encodeURIComponent(item.description));
      });
    });
  });
});

describe('Phase 6: Deep Linking', () => {
  // Note: Deep linking functionality requires native APIs that are mocked
  // These tests verify the service methods exist and have correct signatures

  it('openProductUrl method exists', () => {
    expect(typeof affiliateService.openProductUrl).toBe('function');
  });

  it('openProductUrl returns a promise', () => {
    const result = affiliateService.openProductUrl('https://amazon.com/test');
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('Phase 6: Product Search Params', () => {
  it('ProductSearchParams requires category', () => {
    const params: ProductSearchParams = {
      category: 'top',
    };

    expect(params.category).toBe('top');
  });

  it('ProductSearchParams accepts all optional fields', () => {
    const fullParams: ProductSearchParams = {
      category: 'shoes',
      description: 'Running shoes',
      colors: ['black', 'white'],
      style: ['sporty', 'athletic'],
      material: 'mesh',
      keywords: ['lightweight', 'breathable'],
    };

    expect(fullParams.category).toBe('shoes');
    expect(fullParams.description).toBe('Running shoes');
    expect(fullParams.colors).toHaveLength(2);
    expect(fullParams.style).toHaveLength(2);
    expect(fullParams.material).toBe('mesh');
    expect(fullParams.keywords).toHaveLength(2);
  });
});
