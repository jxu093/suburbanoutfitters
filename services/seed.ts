import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { createItem, getItems } from './storage';

// Sample items to seed on first launch
const SAMPLE_ITEMS = [
  {
    name: 'White Tee',
    category: 'top',
    tags: ['casual', 'summer', 'basic'],
    asset: require('@/assets/sampleitems/white tee.avif'),
  },
  {
    name: 'White Hoodie',
    category: 'top',
    tags: ['casual', 'winter', 'cozy'],
    asset: require('@/assets/sampleitems/whitehoodie.avif'),
  },
  {
    name: 'Light Blue Jeans',
    category: 'bottom',
    tags: ['casual', 'denim'],
    asset: require('@/assets/sampleitems/lightblue jean.avif'),
  },
  {
    name: 'Black Trousers',
    category: 'bottom',
    tags: ['formal', 'work'],
    asset: require('@/assets/sampleitems/black trouser.avif'),
  },
  {
    name: 'Air Force 1 GTX',
    category: 'shoes',
    tags: ['casual', 'sneakers', 'waterproof'],
    asset: require('@/assets/sampleitems/af1gtx.avif'),
  },
];

const IMAGES_DIR_NAME = 'images';
const THUMBS_DIR_NAME = 'thumbs';

function getImagesDir(): Directory {
  return new Directory(Paths.document, IMAGES_DIR_NAME);
}

function getThumbsDir(): Directory {
  return new Directory(Paths.document, IMAGES_DIR_NAME, THUMBS_DIR_NAME);
}

async function ensureDirectories() {
  try {
    const imagesDir = getImagesDir();
    if (!imagesDir.exists) {
      imagesDir.create();
    }
    const thumbsDir = getThumbsDir();
    if (!thumbsDir.exists) {
      thumbsDir.create();
    }
  } catch (e) {
    console.warn('Error creating directories:', e);
  }
}

/**
 * Seeds the database with sample items if the database is empty.
 * This runs on first launch to give users something to see.
 */
export async function seedSampleItems(): Promise<void> {
  console.log('seedSampleItems: Starting...');
  try {
    // Check if we already have items
    const existingItems = await getItems();
    console.log('seedSampleItems: Existing items count:', existingItems.length);
    if (existingItems.length > 0) {
      // Already have items, skip seeding
      console.log('seedSampleItems: Skipping - items already exist');
      return;
    }

    console.log('Seeding sample items...');
    await ensureDirectories();

    for (const item of SAMPLE_ITEMS) {
      try {
        // Load the asset
        const asset = Asset.fromModule(item.asset);
        await asset.downloadAsync();

        if (!asset.localUri) {
          console.warn(`Failed to load asset for ${item.name}`);
          continue;
        }

        // Copy to our images directory
        const timestamp = Date.now();
        const fileName = `image-${timestamp}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const destFile = new File(getImagesDir(), fileName);

        const sourceFile = new File(asset.localUri);
        sourceFile.copy(destFile);

        // For simplicity, use the same image as thumbnail (in production you'd resize)
        const thumbName = `thumb-${timestamp}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const thumbDestFile = new File(getThumbsDir(), thumbName);
        sourceFile.copy(thumbDestFile);

        // Create the database entry
        await createItem({
          name: item.name,
          category: item.category,
          imageUri: destFile.uri,
          thumbUri: thumbDestFile.uri,
          tags: JSON.stringify(item.tags),
          createdAt: Date.now(),
          hidden: 0,
        });

        console.log(`Seeded: ${item.name}`);
      } catch (e) {
        console.warn(`Failed to seed ${item.name}:`, e);
      }
    }

    console.log('Sample items seeded successfully');
  } catch (e) {
    console.warn('Failed to seed sample items:', e);
  }
}
