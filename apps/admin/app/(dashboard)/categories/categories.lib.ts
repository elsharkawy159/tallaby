import type { Category, CategoryNode } from "./categories.types";

/**
 * Builds a hierarchical tree structure from a flat array of categories
 */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const idToCategory = new Map<string, CategoryNode>();
  const rootCategories: CategoryNode[] = [];

  // First pass: create a map from ID to category node
  categories.forEach((category) => {
    idToCategory.set(category.id, {
      ...category,
      children: [],
      parent: null,
    });
  });

  // Second pass: link children to parents
  categories.forEach((category) => {
    const node = idToCategory.get(category.id)!;
    if (category.parentId) {
      const parent = idToCategory.get(category.parentId);
      if (parent) {
        parent.children.push(node);
        node.parent = parent;
      }
    } else {
      rootCategories.push(node);
    }
  });

  // Sort children by name
  const sortChildren = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      return nameA.localeCompare(nameB);
    });
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(rootCategories);

  return rootCategories;
}

/**
 * Flattens a category tree into a flat array
 */
export function flattenCategoryTree(
  tree: CategoryNode[],
  result: Category[] = []
): Category[] {
  tree.forEach((node) => {
    result.push(node);
    if (node.children.length > 0) {
      flattenCategoryTree(node.children, result);
    }
  });
  return result;
}

/**
 * Gets the full path of a category (e.g., "Electronics > Smartphones")
 */
export function getCategoryPath(
  category: Category,
  allCategories: Category[]
): string {
  const path: string[] = [];
  let current: Category | undefined = category;

  while (current) {
    path.unshift(current.name || "");
    if (current.parentId) {
      current = allCategories.find((c) => c.id === current.parentId);
    } else {
      break;
    }
  }

  return path.join(" > ");
}

/**
 * Generates a slug from a category name
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}
