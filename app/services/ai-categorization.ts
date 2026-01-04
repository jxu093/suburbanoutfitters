import { pipeline, env } from '@xenova/transformers';
import type { Category } from '../constants';

// Configure transformers.js for React Native
env.allowLocalModels = false;
env.useBrowserCache = false; // Browser cache not available in React Native
env.allowRemoteModels = true; // Allow downloading models from CDN

// Cache the classifier to avoid reloading the model
let classifierPromise: Promise<any> | null = null;

/**
 * Maps image classification labels to our clothing categories
 */
function mapLabelToCategory(label: string): Category | null {
  const normalizedLabel = label.toLowerCase();

  // Top category patterns
  if (
    normalizedLabel.includes('shirt') ||
    normalizedLabel.includes('t-shirt') ||
    normalizedLabel.includes('tshirt') ||
    normalizedLabel.includes('blouse') ||
    normalizedLabel.includes('sweater') ||
    normalizedLabel.includes('sweatshirt') ||
    normalizedLabel.includes('hoodie') ||
    normalizedLabel.includes('cardigan') ||
    normalizedLabel.includes('tank top') ||
    normalizedLabel.includes('jersey') ||
    normalizedLabel.includes('polo')
  ) {
    return 'top';
  }

  // Bottom category patterns
  if (
    normalizedLabel.includes('pants') ||
    normalizedLabel.includes('jeans') ||
    normalizedLabel.includes('trouser') ||
    normalizedLabel.includes('shorts') ||
    normalizedLabel.includes('skirt') ||
    normalizedLabel.includes('leggings')
  ) {
    return 'bottom';
  }

  // Shoes category patterns
  if (
    normalizedLabel.includes('shoe') ||
    normalizedLabel.includes('sneaker') ||
    normalizedLabel.includes('boot') ||
    normalizedLabel.includes('sandal') ||
    normalizedLabel.includes('loafer') ||
    normalizedLabel.includes('heel') ||
    normalizedLabel.includes('footwear')
  ) {
    return 'shoes';
  }

  // Outerwear category patterns
  if (
    normalizedLabel.includes('jacket') ||
    normalizedLabel.includes('coat') ||
    normalizedLabel.includes('blazer') ||
    normalizedLabel.includes('parka') ||
    normalizedLabel.includes('windbreaker') ||
    normalizedLabel.includes('raincoat')
  ) {
    return 'outerwear';
  }

  // Hat category patterns
  if (
    normalizedLabel.includes('hat') ||
    normalizedLabel.includes('cap') ||
    normalizedLabel.includes('beanie') ||
    normalizedLabel.includes('beret') ||
    normalizedLabel.includes('fedora')
  ) {
    return 'hat';
  }

  // Accessory category patterns
  if (
    normalizedLabel.includes('bag') ||
    normalizedLabel.includes('purse') ||
    normalizedLabel.includes('backpack') ||
    normalizedLabel.includes('watch') ||
    normalizedLabel.includes('glasses') ||
    normalizedLabel.includes('sunglasses') ||
    normalizedLabel.includes('scarf') ||
    normalizedLabel.includes('tie') ||
    normalizedLabel.includes('belt') ||
    normalizedLabel.includes('glove') ||
    normalizedLabel.includes('sock') ||
    normalizedLabel.includes('jewelry') ||
    normalizedLabel.includes('necklace') ||
    normalizedLabel.includes('bracelet')
  ) {
    return 'accessory';
  }

  return null;
}

/**
 * Analyzes clothing image and returns predicted category
 *
 * NOTE: Currently disabled in React Native due to WebAssembly requirement.
 * The @xenova/transformers library requires WebAssembly which is not available
 * in React Native/Hermes environment.
 *
 * To enable AI categorization, consider:
 * 1. Using a cloud-based vision API (Google Vision, AWS Rekognition, etc.)
 * 2. Implementing a custom React Native module with native ML libraries
 * 3. Using Expo's built-in ML capabilities if available
 */
export async function categorizeClothesByImage(imageUri: string): Promise<Category | null> {
  // Disabled: WebAssembly not available in React Native
  console.log('[AI] AI categorization is currently disabled in React Native environment');
  return null;

  /* Original implementation - requires WebAssembly
  try {
    // Initialize classifier (cached after first load)
    if (!classifierPromise) {
      console.log('[AI] Loading image classification model...');
      classifierPromise = pipeline('image-classification', 'Xenova/vit-base-patch16-224');
    }

    const classifier = await classifierPromise;
    console.log('[AI] Running classification on image:', imageUri);

    // Run classification
    const results = await classifier(imageUri, { topk: 5 });
    console.log('[AI] Classification results:', results);

    // Try to map top predictions to our categories
    for (const result of results) {
      const category = mapLabelToCategory(result.label);
      if (category) {
        console.log(`[AI] Mapped "${result.label}" to category: ${category}`);
        return category;
      }
    }

    console.log('[AI] No category match found in top predictions');
    return null;
  } catch (error) {
    console.error('[AI] Error categorizing image:', error);
    return null;
  }
  */
}

/**
 * Check if AI categorization is available
 * Returns false - currently disabled in React Native due to WebAssembly requirement
 */
export async function isAiCategorizationAvailable(): Promise<boolean> {
  // AI categorization is currently disabled in React Native
  return false;
}

/**
 * Preload the AI model in the background to improve first-use experience
 */
export async function preloadAiModel(): Promise<void> {
  try {
    console.log('[AI] Preloading AI model...');
    if (!classifierPromise) {
      classifierPromise = pipeline('image-classification', 'Xenova/vit-base-patch16-224');
    }
    await classifierPromise;
    console.log('[AI] AI model preloaded successfully');
  } catch (error) {
    console.error('[AI] Failed to preload AI model:', error);
  }
}
