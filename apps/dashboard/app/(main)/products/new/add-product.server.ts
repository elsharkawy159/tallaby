"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  db,
  products,
  productImages,
  productListings,
  productCategories,
  categories,
  brands,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  addProductFormSchema,
  type AddProductFormData,
  type CategoryOption,
  type BrandOption,
} from "./add-product.schema";
import { generateSKU } from "./add-product.lib";

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string>;
}

// Mock seller ID - in real app, this would come from auth session
const getCurrentSellerId = async (): Promise<string> => {
  // TODO: Get from auth session
  // const session = await getServerSession();
  // return session.user.sellerId;
  return "seller-123"; // Mock seller ID
};

// Fetch categories from database
export const fetchCategoriesAction = async (): Promise<ActionResult> => {
  try {
    const categoriesData = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        level: categories.level,
        parentId: categories.parentId,
      })
      .from(categories)
      .orderBy(categories.level, categories.displayOrder);

    const categoryOptions: CategoryOption[] = categoriesData.map(
      (cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        level: cat.level,
        parentId: cat.parentId || undefined,
      })
    );

    return {
      success: true,
      data: categoryOptions,
      message: "Categories fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      data: [],
      message: "Failed to fetch categories",
    };
  }
};

// Fetch brands from database
export const fetchBrandsAction = async (): Promise<ActionResult> => {
  try {
    const brandsData = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        isVerified: brands.isVerified,
      })
      .from(brands)
      .orderBy(brands.name);

    const brandOptions: BrandOption[] = brandsData.map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      isVerified: brand.isVerified,
    }));

    return {
      success: true,
      data: brandOptions,
      message: "Brands fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching brands:", error);
    return {
      success: false,
      data: [],
      message: "Failed to fetch brands",
    };
  }
};

// Check if slug is available
export const checkSlugAvailabilityAction = async (
  slug: string
): Promise<ActionResult> => {
  try {
    const existingProduct = await db
      .select({ id: products.id })
      .from(products)
      // @ts-ignore
      .where(eq(products.slug, slug))
      .limit(1);

    const isAvailable = existingProduct.length === 0;

    return {
      success: true,
      data: { isAvailable, slug },
      message: isAvailable ? "Slug is available" : "Slug is already taken",
    };
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return {
      success: false,
      message: "Failed to check slug availability",
    };
  }
};

// Upload image action (mock implementation)
export const uploadImageAction = async (file: File): Promise<ActionResult> => {
  try {
    // TODO: Implement actual file upload to cloud storage
    // For now, return a mock URL
    const mockUrl = `https://images.example.com/${Date.now()}-${file.name}`;

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      data: { url: mockUrl },
      message: "Image uploaded successfully",
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      message: "Failed to upload image",
    };
  }
};

// Main add product action
export const addProductAction = async (
  data: AddProductFormData
): Promise<ActionResult> => {
  try {
    // Validate the data
    const validatedData = addProductFormSchema.parse(data);

    // Get current seller ID
    const sellerId = await getCurrentSellerId();

    // Generate SKU if not provided
    const productSku = validatedData.sku || generateSKU("PRD");

    // Start database transaction
    const result = await db.transaction(async (tx: any) => {
      // 1. Insert the main product
      const [newProduct] = await tx
        .insert(products)
        .values({
          title: validatedData.title,
          slug: validatedData.slug,
          description: validatedData.description || null,
          bulletPoints: validatedData.bulletPoints || null,
          brandId: validatedData.brandId || null,
          mainCategoryId: validatedData.mainCategoryId,
          basePrice: validatedData.basePrice.toString(),
          listPrice: validatedData.listPrice?.toString() || null,
          isActive: validatedData.isActive,
          isAdult: validatedData.isAdult,
          isPlatformChoice: validatedData.isPlatformChoice,
          isBestSeller: validatedData.isBestSeller,
          taxClass: validatedData.taxClass,
          metaTitle: validatedData.metaTitle || null,
          metaDescription: validatedData.metaDescription || null,
          metaKeywords: validatedData.metaKeywords || null,
          searchKeywords: validatedData.searchKeywords || null,
        })
        .returning();

      // 2. Insert product images if provided
      if (validatedData.images && validatedData.images.length > 0) {
        await tx.insert(productImages).values(
          validatedData.images.map((image, index) => ({
            productId: newProduct.id,
            url: image.url,
            altText: image.altText || null,
            position: image.position || index,
            isPrimary: image.isPrimary || index === 0,
          }))
        );
      }

      // 3. Create product listing for the seller
      await tx.insert(productListings).values({
        productId: newProduct.id,
        sellerId: sellerId,
        sku: productSku,
        condition: validatedData.condition,
        price: validatedData.basePrice.toString(),
        salePrice: validatedData.salePrice?.toString() || null,
        quantity: validatedData.stockQuantity,
        fulfillmentType: validatedData.fulfillmentType,
        handlingTime: validatedData.handlingTime,
        maxOrderQuantity: validatedData.maxOrderQuantity || null,
        isActive: validatedData.isActive,
      });

      return newProduct;
    });

    // Revalidate the products page
    revalidatePath("/products");

    return {
      success: true,
      data: { productId: result.id },
      message: "Product created successfully!",
    };
  } catch (error) {
    console.error("Error creating product:", error);

    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });

      return {
        success: false,
        message: "Validation failed",
        errors: fieldErrors,
      };
    }

    return {
      success: false,
      message: "Failed to create product. Please try again.",
    };
  }
};

// Save draft action
export const saveDraftAction = async (
  data: Partial<AddProductFormData>
): Promise<ActionResult> => {
  try {
    // TODO: Implement draft saving to database
    // For now, just simulate saving
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      message: "Draft saved successfully",
    };
  } catch (error) {
    console.error("Error saving draft:", error);
    return {
      success: false,
      message: "Failed to save draft",
    };
  }
};

// Delete product action
export const deleteProductAction = async (
  productId: string
): Promise<ActionResult> => {
  try {
    await db.transaction(async (tx: any) => {
      // Delete in correct order due to foreign key constraints
      await tx
        .delete(productImages)
        .where(eq(productImages.productId as any, productId));
      await tx
        .delete(productListings)
        .where(eq(productListings.productId as any, productId));
      await tx
        .delete(productCategories)
        .where(eq(productCategories.productId as any, productId));
      await tx.delete(products).where(eq(products.id as any, productId));
    });

    revalidatePath("/products");

    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      message: "Failed to delete product",
    };
  }
};
