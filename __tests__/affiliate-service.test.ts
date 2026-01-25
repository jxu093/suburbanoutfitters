import { affiliateService } from '../services/affiliate/affiliate-service';
import type { ProductSearchParams } from '../services/affiliate/affiliate-service';

describe('Affiliate Service', () => {
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

    it('includes primary color in query', () => {
      const params: ProductSearchParams = {
        category: 'top',
        description: 'Casual shirt',
        colors: ['navy', 'blue'],
      };

      const query = affiliateService.buildSearchQuery(params);

      expect(query).toContain('navy');
      expect(query).not.toContain('blue'); // Only primary color
    });

    it('includes style in query', () => {
      const params: ProductSearchParams = {
        category: 'bottom',
        style: ['minimalist', 'casual'],
      };

      const query = affiliateService.buildSearchQuery(params);

      expect(query).toContain('minimalist');
    });

    it('includes material when specified', () => {
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
        keywords: ['vintage', 'handmade'],
      };

      const query = affiliateService.buildSearchQuery(params);

      expect(query).toContain('vintage');
      expect(query).toContain('handmade');
    });

    it('builds comprehensive query with all params', () => {
      const params: ProductSearchParams = {
        category: 'shoes',
        description: 'Oxford dress shoes',
        colors: ['brown', 'tan'],
        style: ['classic', 'formal'],
        material: 'leather',
        keywords: ['mens'],
      };

      const query = affiliateService.buildSearchQuery(params);

      expect(query).toContain('shoes');
      expect(query).toContain('Oxford dress shoes');
      expect(query).toContain('brown');
      expect(query).toContain('classic');
      expect(query).toContain('leather');
      expect(query).toContain('mens');
    });
  });

  describe('getAmazonSearchUrl', () => {
    it('generates valid Amazon search URL', () => {
      const url = affiliateService.getAmazonSearchUrl('blue jeans');

      expect(url).toContain('amazon.com/s');
      expect(url).toContain('k=blue%20jeans');
      expect(url).toContain('tag=');
    });

    it('includes category node for fashion items', () => {
      const url = affiliateService.getAmazonSearchUrl('sneakers', 'shoes');

      expect(url).toContain('i=');
      expect(url).toContain('fashion');
    });

    it('URL-encodes special characters', () => {
      const url = affiliateService.getAmazonSearchUrl('women\'s dress & heels');

      // Apostrophes are not encoded by encodeURIComponent, but & is
      expect(url).toContain('women\'s');
      expect(url).toContain('%26');
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
      const url = affiliateService.getGoogleShoppingUrl('men\'s watch');

      // Apostrophes are not encoded by encodeURIComponent
      expect(url).toContain('men\'s');
      expect(url).toContain('tbm=shop');
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
  });

  describe('getShoppingLinksForMissingItem', () => {
    it('generates links for missing item from inspiration', () => {
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
  });

  describe('Configuration', () => {
    it('can configure affiliate tag', async () => {
      // Note: This test doesn't persist due to mocked storage
      // but validates the configure method exists and works
      await expect(affiliateService.configure({ amazonTag: 'test-tag-20' })).resolves.not.toThrow();
    });

    it('can retrieve config', async () => {
      const config = await affiliateService.getConfig();

      expect(config).toHaveProperty('amazonTag');
    });
  });

  describe('Category mapping', () => {
    it('maps top to fashion clothing', () => {
      const url = affiliateService.getAmazonSearchUrl('shirt', 'top');

      expect(url).toContain('fashion');
    });

    it('maps shoes to fashion shoes', () => {
      const url = affiliateService.getAmazonSearchUrl('sneakers', 'shoes');

      expect(url).toContain('fashion');
    });

    it('defaults to fashion for unknown categories', () => {
      const url = affiliateService.getAmazonSearchUrl('item', 'unknown-category');

      expect(url).toContain('fashion');
    });
  });
});

describe('Product Search Scenarios', () => {
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
  });

  describe('Similar items search', () => {
    it('generates good search for basic item', () => {
      const links = affiliateService.getShoppingLinksForSimilarItem({
        name: 'Blue Oxford Shirt',
        category: 'top',
        colors: ['blue', 'light blue'],
        style: ['preppy', 'smart casual'],
        material: 'cotton',
      });

      // Should produce a comprehensive Amazon search
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
  });
});
