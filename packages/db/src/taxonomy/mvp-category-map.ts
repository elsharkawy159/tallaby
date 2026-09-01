/**
 * MVP product category mapping for Tallaby.
 *
 * Maps required merchandising taxonomy areas to existing Shopify-imported
 * categories. Use REUSE entries when assigning products; CREATE entries
 * are seeded by migration 0018_mvp_category_gaps.sql.
 *
 * Do NOT add marketing concepts (Trending, Seasonal, Deals, etc.) here —
 * those are product flags / future collections.
 */

export type MvpCategoryAction = "REUSE" | "CREATE";

export interface MvpCategoryMapping {
  /** Required MVP category label */
  required: string;
  /** Best existing category name (or planned name for CREATE) */
  existingMatch: string;
  /** Category UUID when REUSE; null until CREATE migration runs */
  categoryId: string | null;
  /** Parent category name for context */
  parent: string;
  action: MvpCategoryAction;
  /** Alternate names vendors may search for */
  synonyms?: string[];
  notes?: string;
}

export const MVP_CATEGORY_MAP: MvpCategoryMapping[] = [
  // Drinkware & Lunch
  {
    required: "Thermal Mugs",
    existingMatch: "Thermoses",
    categoryId: "b0a52633-89ca-44fc-bba6-78f2a5bdf01d",
    parent: "Food & Beverage Carriers",
    action: "REUSE",
    synonyms: ["Insulated Mugs", "Vacuum Flasks"],
  },
  {
    required: "Travel Mugs",
    existingMatch: "Travel Mugs",
    categoryId: "537febee-7c93-4d1e-b145-1f7705cc00a2",
    parent: "Drinkware",
    action: "CREATE",
    synonyms: ["Commuter Mugs"],
  },
  {
    required: "Tumblers",
    existingMatch: "Tumblers",
    categoryId: "8d7286ce-7e58-473c-ad82-0f6ac2bbdf09",
    parent: "Drinkware",
    action: "REUSE",
  },
  {
    required: "Water Bottles",
    existingMatch: "Water Bottles",
    categoryId: "ee6a5cd1-8fdb-49b0-b47e-fd35d0f3c34e",
    parent: "Food & Beverage Carriers",
    action: "REUSE",
    synonyms: ["Reusable Water Bottles"],
  },
  {
    required: "Lunch Boxes",
    existingMatch: "Lunch Boxes & Totes",
    categoryId: "02fe9014-aa07-4637-aee1-ff54f7867de2",
    parent: "Food & Beverage Carriers",
    action: "REUSE",
    synonyms: ["Lunch Containers"],
  },
  {
    required: "Food Containers",
    existingMatch: "Food Storage Containers",
    categoryId: "a4bc8e45-1786-417a-b519-9b3c7f22368d",
    parent: "Kitchen Storage",
    action: "REUSE",
    synonyms: ["Meal Prep Containers"],
    notes: "Use kitchen Food Storage Containers, not pet variants.",
  },

  // Tech & Gadgets
  {
    required: "Small Electronics",
    existingMatch: "Electronics Accessories",
    categoryId: "5dff822b-0eab-4e39-909b-10e7b42928b0",
    parent: "Electronics",
    action: "REUSE",
  },
  {
    required: "Mobile Accessories",
    existingMatch: "Mobile & Smart Phone Accessories",
    categoryId: "6fcd4836-7e2f-4729-b3de-1d542535f42c",
    parent: "Communications",
    action: "REUSE",
    synonyms: ["Phone Accessories", "Smartphone Accessories"],
  },
  {
    required: "Phone Stands & Holders",
    existingMatch: "Mobile Phone Stands",
    categoryId: "cc595a24-a8bf-4f67-abb2-69f2deb79987",
    parent: "Mobile & Smart Phone Accessories",
    action: "REUSE",
    synonyms: ["Phone Holders", "Mobile Phone Holders"],
  },
  {
    required: "Desk Gadgets",
    existingMatch: "Desk Gadgets",
    categoryId: "186fc468-c2a8-4c3a-af27-006b21794698",
    parent: "Office Supplies",
    action: "CREATE",
  },
  {
    required: "Portable Fans",
    existingMatch: "Powered Hand Fans & Misters",
    categoryId: "d2acf694-f350-4e51-9d5f-15a9ac7ce97a",
    parent: "Fans",
    action: "REUSE",
    synonyms: ["Handheld Fans", "Personal Fans"],
  },
  {
    required: "LED / Lighting Gadgets",
    existingMatch: "LED Lights",
    categoryId: "2ddba355-c596-4cb8-8c7c-baa74b924d2f",
    parent: "Special Effects Lighting",
    action: "REUSE",
  },
  {
    required: "Charging Accessories",
    existingMatch: "Charging Docks",
    categoryId: "827934e4-04b4-4f20-9281-4ae7f41ba904",
    parent: "Electronics Accessories",
    action: "REUSE",
    synonyms: ["Power Banks", "Wireless Chargers", "Charging Cables"],
  },
  {
    required: "Cable Management / Organizers",
    existingMatch: "Cable Management",
    categoryId: "bf0727bc-d7fe-40d5-8ee5-b7fe813fb478",
    parent: "Electronics Accessories",
    action: "REUSE",
    synonyms: ["Cable Organizers"],
  },
  {
    required: "Car Gadgets",
    existingMatch: "Car Gadgets",
    categoryId: "0fa087a9-1380-4ae7-b2c3-58e3ab7fe4ab",
    parent: "Electronics Accessories",
    action: "CREATE",
    synonyms: ["Automotive Gadgets"],
  },

  // Home & Lifestyle
  {
    required: "Kitchen Gadgets",
    existingMatch: "Kitchen Tools & Utensils",
    categoryId: "00b56f88-a44d-428c-9d48-f2b10caabebf",
    parent: "Kitchen & Dining",
    action: "REUSE",
    synonyms: ["Cooking Gadgets"],
  },
  {
    required: "Home Organization",
    existingMatch: "Storage & Organization",
    categoryId: "59fa81bf-14e4-48d5-9abc-d5299492f319",
    parent: "Home & Garden",
    action: "REUSE",
    synonyms: ["Home Organizers"],
  },
  {
    required: "Storage Products",
    existingMatch: "Household Storage Containers",
    categoryId: "2cce1660-9cca-4679-87e1-b4d548a2e570",
    parent: "Storage & Organization",
    action: "REUSE",
  },
  {
    required: "Home Accessories",
    existingMatch: "Home Accessories",
    categoryId: "872754a7-4431-423d-842e-b3003ad86213",
    parent: "Home & Garden",
    action: "CREATE",
  },
  {
    required: "Desk & Office Accessories",
    existingMatch: "Office Furniture Accessories",
    categoryId: "1ff146bb-57c4-45a0-be20-0578f5c66890",
    parent: "Office Supplies",
    action: "REUSE",
    synonyms: ["Desk Accessories"],
  },
  {
    required: "Cleaning Products",
    existingMatch: "Household Cleaning Products",
    categoryId: "a7707980-45ec-4732-ba92-fade22b72a9a",
    parent: "Household Cleaning Supplies",
    action: "REUSE",
  },
  {
    required: "Bathroom Accessories",
    existingMatch: "Bathroom Accessories",
    categoryId: "8af9b10c-a594-4efd-a667-6cf1566723ef",
    parent: "Home & Garden",
    action: "REUSE",
  },
  {
    required: "Home Decor",
    existingMatch: "Decor",
    categoryId: "b0114621-163c-4aff-ae3c-8bf076b08fc6",
    parent: "Home & Garden",
    action: "REUSE",
    synonyms: ["Home Decorations"],
    notes: "Seasonal & Holiday Decorations is a product decor type, not a merchandising flag.",
  },

  // Bags & Everyday Carry
  {
    required: "Backpacks",
    existingMatch: "Backpacks",
    categoryId: "fc1f5c72-8d69-4217-8438-846f4282dcca",
    parent: "Luggage & Bags",
    action: "REUSE",
  },
  {
    required: "Crossbody Bags",
    existingMatch: "Cross Body Bags",
    categoryId: "974e8f9c-6fb0-48b0-b71b-3a55a1a24a8a",
    parent: "Handbags",
    action: "REUSE",
    synonyms: ["Cross-Body Bags"],
  },
  {
    required: "Shoulder Bags",
    existingMatch: "Shoulder Bags",
    categoryId: "a5bff9ff-0472-4f87-bc7e-270bd050597c",
    parent: "Handbags",
    action: "REUSE",
  },
  {
    required: "Travel Bags",
    existingMatch: "Suitcase Travel Sets",
    categoryId: "85c321d6-2baa-4866-a026-eedfe82d46d6",
    parent: "Luggage & Bags",
    action: "REUSE",
  },
  {
    required: "Laptop Bags",
    existingMatch: "Laptop Bags",
    categoryId: "d1a34c98-e5b8-459a-990d-97d5cc94a1eb",
    parent: "Luggage & Bags",
    action: "REUSE",
  },
  {
    required: "Waist Bags",
    existingMatch: "Fanny Packs",
    categoryId: "4b9bcc25-8e7b-430b-9de4-e23ab64d9e6f",
    parent: "Luggage & Bags",
    action: "REUSE",
    synonyms: ["Belt Bags"],
  },
  {
    required: "Pouches & Organizers",
    existingMatch: "Travel Pouches",
    categoryId: "8284389d-7e56-4071-ac90-a23c26e888e6",
    parent: "Luggage Accessories",
    action: "REUSE",
    synonyms: ["Storage Pouches"],
  },
  {
    required: "Wallets",
    existingMatch: "Wallets",
    categoryId: "059ee691-4a7a-4601-83da-6085dd37dc82",
    parent: "Wallets & Money Clips",
    action: "REUSE",
  },
  {
    required: "Key Holders",
    existingMatch: "Keychains",
    categoryId: "63e5ec24-612c-43c2-8bf4-35d8fd2ee242",
    parent: "Sports Fan Accessories",
    action: "REUSE",
    synonyms: ["Key Organizers"],
  },

  // Fashion Accessories
  {
    required: "Watches",
    existingMatch: "Watches",
    categoryId: "157c8cf3-9c98-43e2-88da-7507bcec34ab",
    parent: "Jewelry",
    action: "REUSE",
  },
  {
    required: "Sunglasses",
    existingMatch: "Sunglasses",
    categoryId: "a2b5457f-90ef-4198-b0d8-fb21cb39302e",
    parent: "Clothing Accessories",
    action: "REUSE",
  },
  {
    required: "Caps / Hats",
    existingMatch: "Baseball Caps",
    categoryId: "cf26fe49-3c0a-4144-b568-5f91c05bed94",
    parent: "Hats",
    action: "REUSE",
    synonyms: ["Hats", "Snapback Caps"],
  },
  {
    required: "Jewelry",
    existingMatch: "Jewelry",
    categoryId: "7da58041-4346-41c2-bdee-53a0f21622dc",
    parent: "Apparel & Accessories",
    action: "REUSE",
  },
  {
    required: "Hair Accessories",
    existingMatch: "Hair Accessories",
    categoryId: "73e975e6-915e-4643-9f30-2b6dc087b122",
    parent: "Clothing Accessories",
    action: "REUSE",
  },
  {
    required: "Belts",
    existingMatch: "Belts",
    categoryId: "cd7a4ccb-0db7-4fb3-9052-e7acd5ddc3a5",
    parent: "Clothing Accessories",
    action: "REUSE",
    synonyms: ["Fashion Belts", "Leather Belts"],
  },
  {
    required: "Fashion Accessories",
    existingMatch: "Clothing Accessories",
    categoryId: "46b0203b-a62d-4201-ab6b-12cc3ef84464",
    parent: "Apparel & Accessories",
    action: "REUSE",
  },

  // Travel & Outdoor
  {
    required: "Travel Accessories",
    existingMatch: "Travel & Leisure",
    categoryId: "cda14605-5f6b-4316-a14d-ae5f9d1cf09a",
    parent: "Luggage & Bags",
    action: "REUSE",
  },
  {
    required: "Travel Organizers",
    existingMatch: "Travel Organizer Bags",
    categoryId: "63cb0c62-9ba6-496c-aa70-b5d877a00531",
    parent: "Cosmetic & Toiletry Bags",
    action: "REUSE",
  },
  {
    required: "Luggage Accessories",
    existingMatch: "Luggage Accessories",
    categoryId: "cbd04922-81ee-481c-bd6a-2a39d4a8abc2",
    parent: "Luggage & Bags",
    action: "REUSE",
    synonyms: ["Travel & Luggage Accessories"],
  },
  {
    required: "Passport Holders",
    existingMatch: "Passport Holders",
    categoryId: "55ee2a7e-5946-4f9b-a0b2-69a8129d6847",
    parent: "Luggage Accessories",
    action: "CREATE",
    synonyms: ["Passport Wallets", "Passport Covers"],
  },
  {
    required: "Packing Organizers",
    existingMatch: "Packing Organizers",
    categoryId: "87312576-0347-46bd-999f-905ff3d88503",
    parent: "Luggage Accessories",
    action: "REUSE",
  },
  {
    required: "Outdoor Accessories",
    existingMatch: "Outdoor Accessories",
    categoryId: "005e4ad5-3530-4532-9c02-a3f2e38bebda",
    parent: "Sporting Goods",
    action: "CREATE",
  },

  // Events & Party
  {
    required: "Birthday Party Supplies",
    existingMatch: "Birthday Party Supplies",
    categoryId: "07c942f0-fc60-47ad-b22b-180c4290888f",
    parent: "Party Supplies",
    action: "CREATE",
  },
  {
    required: "Wedding / Engagement Accessories",
    existingMatch: "Bridal Accessories",
    categoryId: "c1064c1f-585e-4102-829a-572868ddcb6b",
    parent: "Clothing Accessories",
    action: "REUSE",
    synonyms: ["Wedding Ceremony Supplies", "Engagement Accessories"],
    notes: "Engagement: also see Wedding Ceremony Supplies (4b20d66c-9461-4e0b-a85e-d530e1542495).",
  },
  {
    required: "Graduation Products",
    existingMatch: "Graduation Products",
    categoryId: "823154c0-19af-45b4-9723-8288534e337c",
    parent: "Party Supplies",
    action: "CREATE",
    synonyms: ["Graduation Party Supplies"],
  },
  {
    required: "Baby Shower Products",
    existingMatch: "Baby Shower Products",
    categoryId: "f00eafe1-07f2-4947-8f32-961b14c64dc3",
    parent: "Party Supplies",
    action: "CREATE",
  },
  {
    required: "Party Decorations",
    existingMatch: "Party Streamers & Curtains",
    categoryId: "319e1ea8-fe7a-40b8-9391-65fb1a8b5799",
    parent: "Party Supplies",
    action: "REUSE",
    synonyms: ["Inflatable Party Decorations", "Balloons"],
  },
  {
    required: "Photo Props",
    existingMatch: "Photo Props",
    categoryId: "83d0fa5a-6984-4da6-a59e-fb23e9f9674e",
    parent: "Party Supplies",
    action: "CREATE",
    synonyms: ["Party Props", "Selfie Props"],
  },
];

/** Categories that must NOT be added to the taxonomy (merchandising / collections). */
export const FORBIDDEN_CATEGORY_NAMES = [
  "Trending Now",
  "Seasonal",
  "Best Sellers",
  "Deals",
  "New Arrivals",
  "Under 100",
  "Under 200",
  "Under 300",
  "Gift Ideas",
] as const;

export function getMvpCategoriesToCreate(): MvpCategoryMapping[] {
  return MVP_CATEGORY_MAP.filter((m) => m.action === "CREATE");
}

export function getMvpCategoriesToReuse(): MvpCategoryMapping[] {
  return MVP_CATEGORY_MAP.filter((m) => m.action === "REUSE");
}
