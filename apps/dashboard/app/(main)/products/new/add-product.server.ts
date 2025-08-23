"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  db,
  products,
  productCategories,
  categories,
  brands,
} from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import {
  addProductFormSchema,
  type AddProductFormData,
} from "./add-product.schema";
import { getCurrentSeller } from "@/actions/seller";

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string>;
}

// Mock seller ID - in real app, this would come from auth session
const getCurrentSellerId = async (): Promise<string> => {
  const seller = await getCurrentSeller();
  return seller?.id || "";
};

// Fetch categories with simplified query
export const getCategories = async (): Promise<ActionResult> => {
  try {
    const categoriesData = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      columns: {
        id: true,
        name: true,
        slug: true,
        level: true,
        parentId: true,
      },
      orderBy: [categories.level, categories.displayOrder],
    });

    return {
      success: true,
      data: categoriesData,
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

// Fetch brands with simplified query
export const getBrands = async (): Promise<ActionResult> => {
  try {
    const brandsData = await db.query.brands.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
        isVerified: true,
      },
      orderBy: brands.name,
    });

    return {
      success: true,
      data: brandsData,
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
export const checkSlugAvailability = async (
  slug: string
): Promise<ActionResult> => {
  try {
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      columns: { id: true },
    });

    const isAvailable = !existingProduct;

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

// Fetch a single product by ID with all related data
export const getProduct = async (productId: string): Promise<ActionResult> => {
  try {
    // Get product with all related data using findFirst with relations
    const productData = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        brand: {
          columns: {
            id: true,
            name: true,
            slug: true,
            isVerified: true,
          },
        },
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
            level: true,
          },
        },
        seller: {
          columns: {
            id: true,
            displayName: true,
            businessName: true,
          },
        },
        productCategories: {
          with: {
            category: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!productData) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    return {
      success: true,
      data: productData,
      message: "Product fetched successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch product",
    };
  }
};

// Get all products with pagination and filtering
export const getProducts = async (params?: {
  limit?: number;
  offset?: number;
  sellerId?: string;
  categoryId?: string;
  isActive?: boolean;
}): Promise<ActionResult> => {
  try {
    const {
      limit = 20,
      offset = 0,
      sellerId,
      categoryId,
      isActive,
    } = params || {};

    // Build where conditions
    const conditions = [];
    if (sellerId) conditions.push(eq(products.sellerId, sellerId));
    if (categoryId) conditions.push(eq(products.mainCategoryId, categoryId));
    if (typeof isActive === "boolean")
      conditions.push(eq(products.isActive, isActive));

    // Use findMany with relations
    const productsData = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        brand: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      columns: {
        id: true,
        title: true,
        slug: true,
        images: true,
        sku: true,
        basePrice: true,
        listPrice: true,
        salePrice: true,
        quantity: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
      },
      orderBy: desc(products.createdAt),
      limit,
      offset,
    });

    // Get total count for pagination using findMany without limit
    const totalCount = await db
      .select({ count: count() })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalCount[0]?.count || 0;

    return {
      success: true,
      data: {
        products: productsData.map((product) => ({
          ...product,
          brandName: product.brand?.name,
          categoryName: product.category?.name,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
        },
      },
      message: "Products fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      message: "Failed to fetch products",
    };
  }
};

// Update an existing product
export const updateProduct = async (
  productId: string,
  data: AddProductFormData
): Promise<ActionResult> => {
  try {
    // Validate the data
    const validatedData = addProductFormSchema.parse(data);

    await db.transaction(async (tx) => {
      // Update the product
      await tx
        .update(products)
        .set({
          title: validatedData.title,
          slug: validatedData.slug,
          description: validatedData.description,
          bulletPoints: validatedData.bulletPoints,
          images: validatedData.images,
          brandId: validatedData.brandId,
          mainCategoryId: validatedData.mainCategoryId,
          sku: validatedData.sku,
          basePrice: validatedData.basePrice.toString(),
          listPrice: validatedData.listPrice?.toString(),
          salePrice: validatedData.salePrice?.toString(),
          quantity: validatedData.quantity,
          condition: validatedData.condition,
          fulfillmentType: validatedData.fulfillmentType,
          handlingTime: validatedData.handlingTime,
          maxOrderQuantity: validatedData.maxOrderQuantity,
          isActive: validatedData.isActive,
          isAdult: validatedData.isAdult,
          isPlatformChoice: validatedData.isPlatformChoice,
          isBestSeller: validatedData.isBestSeller,
          isFeatured: validatedData.isFeatured,
          taxClass: validatedData.taxClass,
          metaTitle: validatedData.metaTitle,
          metaDescription: validatedData.metaDescription,
          metaKeywords: validatedData.metaKeywords,
          searchKeywords: validatedData.searchKeywords,
          notes: validatedData.notes,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, productId));
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

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

// Main add product action with transaction
export const addProduct = async (
  data: AddProductFormData
): Promise<ActionResult> => {
  try {
    // Validate the data
    const validatedData = addProductFormSchema.parse(data);

    // Get current seller ID
    const seller = await getCurrentSeller();
    if (!seller) {
      return {
        success: false,
        message: "Seller not found",
      };
    }

    await db.insert(products).values({
      ...validatedData,
      sellerId: seller.id,
    } as any);

    revalidatePath("/products");

    return {
      success: true,
      message: "Product created successfully!",
    };
  } catch (error: any) {
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

    // Handle unique constraint violations
    if (error?.code === "23505") {
      if (error?.constraint?.includes("slug")) {
        return {
          success: false,
          message:
            "A product with this slug already exists. Please choose a different slug.",
        };
      }
      if (error?.constraint?.includes("sku")) {
        return {
          success: false,
          message:
            "A product with this SKU already exists for this seller. Please choose a different SKU.",
        };
      }
    }

    // Handle foreign key constraint violations
    if (error?.code === "23503") {
      return {
        success: false,
        message: "Invalid category, brand, or seller reference",
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
    // TODO: Implement draft saving to database or localStorage alternative
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

// Delete product action with proper transaction handling
export const deleteProductAction = async (
  productId: string
): Promise<ActionResult> => {
  try {
    await db.delete(products).where(eq(products.id, productId));

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
