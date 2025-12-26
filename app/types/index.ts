export type Item = {
  id?: number;
  name: string;
  category?: string | null;
  imageUri?: string | null;
  thumbUri?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  createdAt?: number;
  wornAt?: number | null;
  hidden?: boolean | null;
  hiddenUntil?: number | null; // unix ms timestamp
};

export type Outfit = {
  id?: number;
  name: string;
  itemIds: number[];
  notes?: string;
  createdAt?: number;
};
