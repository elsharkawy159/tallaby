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
  sellers,
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

  // For development, use a hardcoded seller ID
  // In production, this should come from the authenticated user's session
  return "550e8400-e29b-41d4-a716-446655440000"; // Test seller ID
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

// Fetch a single product by ID
export const fetchProductAction = async (
  productId: string
): Promise<ActionResult> => {
  try {
    // TODO: Fix Drizzle ORM version conflicts
    // For now, return mock data to test the UI
    console.log("Fetching product with ID:", productId);

    // Mock product data for testing
    const mockProduct = {
      title: "Sample Product",
      slug: "sample-product",
      description: "This is a sample product for testing edit functionality",
      bulletPoints: ["Feature 1", "Feature 2", "Feature 3"],
      mainCategoryId: "550e8400-e29b-41d4-a716-446655440001",
      brandId: "",
      basePrice: 99.99,
      listPrice: 129.99,
      price: 99.99,
      salePrice: 129.99,
      sku: "SAMPLE-001",
      stockQuantity: 10,
      isActive: true,
      isAdult: false,
      isPlatformChoice: false,
      isBestSeller: false,
      isFeatured: false,
      condition: "new" as const,
      fulfillmentType: "seller_fulfilled" as const,
      handlingTime: 1,
      taxClass: "standard" as const,
      metaTitle: "Sample Product - Meta Title",
      metaDescription: "Sample product meta description",
      metaKeywords: "sample, product, test",
      searchKeywords: "sample product test",
      images: ["https://via.placeholder.com/400x400?text=Product+Image"],
    };

    return {
      success: true,
      data: mockProduct,
      message: "Product fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      message: "Failed to fetch product",
    };
  }
};

// Update an existing product
export const updateProductAction = async (
  productId: string,
  data: AddProductFormData
): Promise<ActionResult> => {
  try {
    // TODO: Fix Drizzle ORM version conflicts
    // For now, simulate update success
    console.log("Updating product with ID:", productId, "Data:", data);

    // Validate the data
    const validatedData = addProductFormSchema.parse(data);

    // Simulate database update delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    revalidatePath("/products");
    revalidatePath(`/products/new`);

    return {
      success: true,
      message: "Product updated successfully",
    };
  } catch (error) {
    console.error("Error updating product:", error);

    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path.join(".");
        errors[field] = err.message;
      });

      return {
        success: false,
        message: "Validation failed",
        errors,
      };
    }

    return {
      success: false,
      message: "Failed to update product",
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

    // Check if seller exists (mock check for now)

    // Start database transaction
    const result = await db.transaction(async (tx: any) => {
      console.log("Inserting product with data:", {
        title: validatedData.title,
        slug: validatedData.slug,
        description: validatedData.description || null,
        bulletPoints: validatedData.bulletPoints || null,
        images: validatedData.images,
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
      });

      // 1. Insert the main product
      const [newProduct] = await tx
        .insert(products)
        .values({
          title: validatedData.title,
          slug: validatedData.slug,
          description: validatedData.description || null,
          bulletPoints: validatedData.bulletPoints || null,
          images: validatedData.images,
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

      // 2. Create product listing for the seller
      // const [newListing] = await tx
      //   .insert(productListings)
      //   .values({
      //     productId: newProduct.id,
      //     sellerId: sellerId,
      //     sku: productSku,
      //     condition: validatedData.condition,
      //     price: validatedData.price.toString(),
      //     salePrice: validatedData.salePrice?.toString() || null,
      //     quantity: validatedData.stockQuantity,
      //     fulfillmentType: validatedData.fulfillmentType,
      //     handlingTime: validatedData.handlingTime,
      //     maxOrderQuantity: validatedData.maxOrderQuantity || null,
      //     isActive: validatedData.isActive,
      //   })
      //   .returning();

      // console.log("Product listing created successfully:", newListing);

      return newProduct;
    });

    // Revalidate the products page
    revalidatePath("/products");

    return {
      success: true,
      data: { productId: result.id },
      message: "Product created successfully!",
    };
  } catch (error: any) {
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

    // Check for specific database errors
    if (error?.message?.includes("foreign key")) {
      return {
        success: false,
        message: "Invalid category, brand, or seller reference",
      };
    }

    if (error?.message?.includes("unique constraint")) {
      return {
        success: false,
        message: "Product with this slug or SKU already exists",
      };
    }

    return {
      success: false,
      message: `Failed to create product: ${error?.message || "Unknown error"}`,
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
    return {
      success: false,
      message: "Failed to delete product",
    };
  }
};
