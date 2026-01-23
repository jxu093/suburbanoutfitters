/**
 * Phase 4: User Profile & Personalization Tests
 *
 * Tests for user profile management, style preferences, skin tone color
 * recommendations, and feedback-based learning.
 */

import type { UserProfile, OutfitFeedback } from '../app/types';
import { buildOutfitPrompt } from '../app/services/ai/prompts';
import type { OutfitContext } from '../app/services/ai/ai-provider';

describe('Phase 4: User Profile & Personalization', () => {
  describe('UserProfile - Physical Attributes', () => {
    describe('Body Type', () => {
      const bodyTypes: Array<{ type: UserProfile['bodyType']; description: string }> = [
        { type: 'rectangle', description: 'Similar width shoulders, waist, and hips' },
        { type: 'triangle', description: 'Wider hips than shoulders' },
        { type: 'inverted-triangle', description: 'Broader shoulders than hips' },
        { type: 'hourglass', description: 'Balanced shoulders and hips, defined waist' },
        { type: 'oval', description: 'Fuller midsection' },
      ];

      bodyTypes.forEach(({ type, description }) => {
        it(`supports ${type} body type: ${description}`, () => {
          const profile: UserProfile = { bodyType: type };
          expect(profile.bodyType).toBe(type);
        });
      });

      it('allows null for unspecified body type', () => {
        const profile: UserProfile = { bodyType: null };
        expect(profile.bodyType).toBeNull();
      });

      it('includes body type in AI prompt', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { bodyType: 'hourglass' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Body type: hourglass');
      });
    });

    describe('Skin Tone', () => {
      const skinTones: Array<{ tone: UserProfile['skinTone']; recommendations: string }> = [
        { tone: 'pale', recommendations: 'jewel tones, navy, burgundy, soft pastels' },
        { tone: 'tan', recommendations: 'earth tones, coral, turquoise, warm whites' },
        { tone: 'dark', recommendations: 'bold bright colors, white, cream, pastels' },
      ];

      skinTones.forEach(({ tone, recommendations }) => {
        it(`supports ${tone} skin tone with color recommendations`, () => {
          const profile: UserProfile = { skinTone: tone };
          expect(profile.skinTone).toBe(tone);

          // Verify recommendations are included in prompts
          const context: OutfitContext = {
            items: [],
            userProfile: { skinTone: tone },
          };
          const prompt = buildOutfitPrompt(context);

          expect(prompt).toContain(`Skin tone: ${tone}`);
          // Each skin tone should have some color recommendations
          expect(prompt.toLowerCase()).toContain('color');
        });
      });

      it('allows null for unspecified skin tone', () => {
        const profile: UserProfile = { skinTone: null };
        expect(profile.skinTone).toBeNull();
      });
    });

    describe('Height', () => {
      const heights: Array<{ height: UserProfile['height']; description: string }> = [
        { height: 'petite', description: 'Under 5\'4" / 163cm' },
        { height: 'average', description: '5\'4" - 5\'7" / 163-170cm' },
        { height: 'tall', description: 'Over 5\'7" / 170cm' },
      ];

      heights.forEach(({ height }) => {
        it(`supports ${height} height option`, () => {
          const profile: UserProfile = { height };
          expect(profile.height).toBe(height);
        });
      });

      it('allows null for unspecified height', () => {
        const profile: UserProfile = { height: null };
        expect(profile.height).toBeNull();
      });

      it('includes height in AI prompt', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { height: 'tall' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Height: tall');
      });
    });
  });

  describe('UserProfile - Style Preferences', () => {
    describe('Preferred Styles', () => {
      const styleOptions = [
        'minimalist',
        'classic',
        'preppy',
        'casual',
        'formal',
        'bohemian',
        'sporty',
        'edgy',
        'romantic',
        'streetwear',
        'vintage',
        'modern',
      ];

      it('supports multiple preferred styles', () => {
        const profile: UserProfile = {
          preferredStyles: ['minimalist', 'classic', 'casual'],
        };

        expect(profile.preferredStyles).toHaveLength(3);
        expect(profile.preferredStyles).toContain('minimalist');
      });

      it('includes preferred styles in AI prompt', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { preferredStyles: ['minimalist', 'classic'] },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Preferred styles: minimalist, classic');
      });

      styleOptions.forEach((style) => {
        it(`supports ${style} as a style option`, () => {
          const profile: UserProfile = { preferredStyles: [style] };
          expect(profile.preferredStyles).toContain(style);
        });
      });
    });

    describe('Avoided Styles', () => {
      it('supports multiple avoided styles', () => {
        const profile: UserProfile = {
          avoidedStyles: ['bohemian', 'sporty', 'grunge'],
        };

        expect(profile.avoidedStyles).toHaveLength(3);
        expect(profile.avoidedStyles).toContain('bohemian');
      });

      it('includes avoided styles in AI prompt', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { avoidedStyles: ['bohemian', 'sporty'] },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Styles to avoid: bohemian, sporty');
      });
    });

    describe('Color Preferences', () => {
      it('supports preferred colors', () => {
        const profile: UserProfile = {
          preferredColors: ['navy', 'black', 'white', 'grey', 'burgundy'],
        };

        expect(profile.preferredColors).toHaveLength(5);
      });

      it('supports avoided colors', () => {
        const profile: UserProfile = {
          avoidedColors: ['orange', 'yellow', 'neon green'],
        };

        expect(profile.avoidedColors).toHaveLength(3);
      });

      it('includes color preferences in AI prompt', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: {
            preferredColors: ['navy', 'grey'],
            avoidedColors: ['orange'],
          },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Favorite colors: navy, grey');
        expect(prompt).toContain('Colors to avoid: orange');
      });
    });

    describe('Formality Preference', () => {
      it('supports formality scale 1-5', () => {
        for (let i = 1; i <= 5; i++) {
          const profile: UserProfile = { formalityDefault: i };
          expect(profile.formalityDefault).toBe(i);
        }
      });

      it('includes formality in AI prompt', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { formalityDefault: 3 },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Default formality preference: 3/5');
      });
    });

    describe('Lifestyle', () => {
      const lifestyleOptions = [
        'office-job',
        'work-from-home',
        'active',
        'parent',
        'social',
        'student',
        'retired',
      ];

      it('supports multiple lifestyle options', () => {
        const profile: UserProfile = {
          lifestyle: ['office-job', 'active', 'social'],
        };

        expect(profile.lifestyle).toHaveLength(3);
      });

      lifestyleOptions.forEach((option) => {
        it(`supports ${option} lifestyle`, () => {
          const profile: UserProfile = { lifestyle: [option] };
          expect(profile.lifestyle).toContain(option);
        });
      });
    });
  });

  describe('Skin Tone Color Recommendations', () => {
    describe('Pale skin tone', () => {
      it('recommends jewel tones', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'pale' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('jewel tones');
      });

      it('recommends navy', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'pale' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('navy');
      });

      it('recommends burgundy', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'pale' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('burgundy');
      });

      it('warns about washed-out colors', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'pale' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt.toLowerCase()).toContain('washed-out');
      });
    });

    describe('Tan skin tone', () => {
      it('recommends earth tones', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'tan' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('earth tones');
      });

      it('recommends coral', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'tan' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('coral');
      });

      it('recommends turquoise', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'tan' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('turquoise');
      });
    });

    describe('Dark skin tone', () => {
      it('recommends bold bright colors', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'dark' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('bold bright colors');
      });

      it('recommends white', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'dark' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('white');
      });

      it('recommends pastels', () => {
        const context: OutfitContext = {
          items: [],
          userProfile: { skinTone: 'dark' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('pastels');
      });
    });
  });

  describe('Feedback-Based Learning', () => {
    describe('Tracking accept/reject', () => {
      it('increments accepted count', () => {
        const profile: UserProfile = {
          acceptedCount: 10,
          rejectedCount: 5,
        };

        // Simulate accepting an outfit
        const newAcceptedCount = profile.acceptedCount! + 1;

        expect(newAcceptedCount).toBe(11);
      });

      it('increments rejected count', () => {
        const profile: UserProfile = {
          acceptedCount: 10,
          rejectedCount: 5,
        };

        // Simulate rejecting an outfit
        const newRejectedCount = profile.rejectedCount! + 1;

        expect(newRejectedCount).toBe(6);
      });

      it('calculates acceptance rate', () => {
        const profile: UserProfile = {
          acceptedCount: 80,
          rejectedCount: 20,
        };

        const total = profile.acceptedCount! + profile.rejectedCount!;
        const acceptRate = profile.acceptedCount! / total;

        expect(acceptRate).toBe(0.8);
      });
    });

    describe('Feedback influences suggestions', () => {
      it('includes accepted outfits in prompt', () => {
        const context: OutfitContext = {
          items: [],
          recentFeedback: [
            { itemIds: [1, 2, 3], action: 'accept', occasion: 'work' },
          ],
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('accepted');
        expect(prompt).toContain('[1, 2, 3]');
      });

      it('includes rejected outfits in prompt', () => {
        const context: OutfitContext = {
          items: [],
          recentFeedback: [
            { itemIds: [4, 5, 6], action: 'reject' },
          ],
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('rejected');
        expect(prompt).toContain('[4, 5, 6]');
      });

      it('includes occasion context with feedback', () => {
        const context: OutfitContext = {
          items: [],
          recentFeedback: [
            { itemIds: [1, 2], action: 'accept', occasion: 'date night' },
          ],
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('date night');
      });
    });
  });

  describe('Profile Completion State', () => {
    it('tracks when profile is completed', () => {
      const profile: UserProfile = {
        bodyType: 'hourglass',
        skinTone: 'tan',
        height: 'average',
        profileCompleted: true,
        skippedProfile: false,
      };

      expect(profile.profileCompleted).toBe(true);
      expect(profile.skippedProfile).toBe(false);
    });

    it('tracks when profile is skipped', () => {
      const profile: UserProfile = {
        profileCompleted: false,
        skippedProfile: true,
      };

      expect(profile.profileCompleted).toBe(false);
      expect(profile.skippedProfile).toBe(true);
    });

    it('tracks last updated timestamp', () => {
      const now = Date.now();
      const profile: UserProfile = {
        bodyType: 'rectangle',
        lastUpdated: now,
      };

      expect(profile.lastUpdated).toBe(now);
    });
  });

  describe('Complete Profile Scenarios', () => {
    it('creates minimal profile (physical only)', () => {
      const minimalProfile: UserProfile = {
        bodyType: 'rectangle',
        skinTone: 'pale',
        height: 'average',
        profileCompleted: true,
      };

      expect(minimalProfile.bodyType).toBe('rectangle');
      expect(minimalProfile.preferredStyles).toBeUndefined();
    });

    it('creates full profile with all attributes', () => {
      const fullProfile: UserProfile = {
        id: 1,
        bodyType: 'hourglass',
        skinTone: 'tan',
        height: 'tall',
        preferredStyles: ['classic', 'minimalist', 'elegant'],
        avoidedStyles: ['bohemian', 'sporty'],
        preferredColors: ['navy', 'black', 'white', 'burgundy'],
        avoidedColors: ['orange', 'neon'],
        formalityDefault: 4,
        lifestyle: ['office-job', 'social'],
        acceptedCount: 45,
        rejectedCount: 12,
        lastUpdated: Date.now(),
        profileCompleted: true,
        skippedProfile: false,
      };

      expect(fullProfile.bodyType).toBe('hourglass');
      expect(fullProfile.preferredStyles).toHaveLength(3);
      expect(fullProfile.lifestyle).toHaveLength(2);
      expect(fullProfile.profileCompleted).toBe(true);
    });

    it('integrates full profile into outfit prompt', () => {
      const fullProfile: UserProfile = {
        bodyType: 'hourglass',
        skinTone: 'tan',
        height: 'tall',
        preferredStyles: ['classic', 'minimalist'],
        avoidedStyles: ['bohemian'],
        preferredColors: ['navy', 'black'],
        avoidedColors: ['orange'],
        formalityDefault: 4,
      };

      const context: OutfitContext = {
        items: [],
        userProfile: fullProfile,
      };
      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('## User Profile');
      expect(prompt).toContain('Body type: hourglass');
      expect(prompt).toContain('Skin tone: tan');
      expect(prompt).toContain('Height: tall');
      expect(prompt).toContain('Preferred styles: classic, minimalist');
      expect(prompt).toContain('Styles to avoid: bohemian');
      expect(prompt).toContain('Favorite colors: navy, black');
      expect(prompt).toContain('Colors to avoid: orange');
      expect(prompt).toContain('Default formality preference: 4/5');
    });
  });
});

describe('Phase 4: Profile Storage', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('saves and retrieves complete profile', async () => {
    let storedProfile: any = null;

    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: () => ({
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockImplementation(async (sql: string, args: any[]) => {
          if (sql.toLowerCase().includes('insert into user_profile')) {
            storedProfile = {
              id: 1,
              bodyType: args[0],
              skinTone: args[1],
              height: args[2],
              preferredStyles: args[3],
              avoidedStyles: args[4],
              preferredColors: args[5],
              avoidedColors: args[6],
              formalityDefault: args[7],
              lifestyle: args[8],
              acceptedCount: args[9],
              rejectedCount: args[10],
              lastUpdated: args[11],
              profileCompleted: args[12],
              skippedProfile: args[13],
            };
            return { lastInsertRowId: 1 };
          }
          return {};
        }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockImplementation(async (sql: string) => {
          if (sql.toLowerCase().includes('select * from user_profile')) {
            return storedProfile;
          }
          return null;
        }),
      }),
    }));

    const storage = require('../app/services/storage');
    await storage.initDB();

    await storage.saveUserProfile({
      bodyType: 'hourglass',
      skinTone: 'tan',
      height: 'average',
      preferredStyles: '["classic","minimalist"]',
      avoidedStyles: '["bohemian"]',
      preferredColors: '["navy"]',
      avoidedColors: '["orange"]',
      formalityDefault: 3,
      lifestyle: '["office-job"]',
      profileCompleted: 1,
    });

    const profile = await storage.getUserProfile();
    expect(profile).not.toBeNull();
    expect(profile.bodyType).toBe('hourglass');
    expect(profile.skinTone).toBe('tan');
  });

  it('increments feedback counts', async () => {
    let currentProfile = {
      id: 1,
      acceptedCount: 10,
      rejectedCount: 5,
    };

    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: () => ({
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockImplementation(async (sql: string) => {
          if (sql.toLowerCase().includes('update user_profile')) {
            if (sql.includes('acceptedCount')) {
              currentProfile.acceptedCount++;
            }
            if (sql.includes('rejectedCount')) {
              currentProfile.rejectedCount++;
            }
          }
          return {};
        }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockImplementation(async (sql: string) => {
          if (sql.toLowerCase().includes('select * from user_profile')) {
            return currentProfile;
          }
          return null;
        }),
      }),
    }));

    const storage = require('../app/services/storage');
    await storage.initDB();

    // Simulate incrementing
    await storage.incrementProfileFeedbackCount('accept');
    expect(currentProfile.acceptedCount).toBe(11);

    await storage.incrementProfileFeedbackCount('reject');
    expect(currentProfile.rejectedCount).toBe(6);
  });
});
