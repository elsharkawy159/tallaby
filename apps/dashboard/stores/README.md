# Zustand Stores

This directory contains Zustand stores for managing application state across the dashboard application.

## Store Structure

```
stores/
├── index.ts                    # Main export file for all stores
├── add-product-form.store.ts   # Add product form state management
└── README.md                   # This documentation file
```

## Usage Pattern

All stores follow a consistent pattern:

1. **State Interface**: Define the state structure and actions
2. **Default Values**: Provide sensible defaults for all state properties
3. **Actions**: Implement state mutations and business logic
4. **Persistence**: Use Zustand's persist middleware for session storage
5. **Type Safety**: Full TypeScript support with proper typing

## Example Store

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ExampleState {
  data: any[];
  isLoading: boolean;
  setData: (data: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      data: [],
      isLoading: false,
      setData: (data) => set({ data }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "example-storage",
      partialize: (state) => ({ data: state.data }),
    }
  )
);
```

## Adding New Stores

When adding new stores:

1. Create the store file following the naming convention: `{feature-name}.store.ts`
2. Export the store from `index.ts`
3. Update this README with the new store information
4. Follow the established patterns for consistency

## Best Practices

- Keep stores focused on a single responsibility
- Use descriptive names for store files and actions
- Implement proper TypeScript interfaces
- Use persist middleware for data that should survive page refreshes
- Keep actions simple and composable
- Avoid storing sensitive data in persisted stores

## Available Stores

### `useAddProductFormStore`

Manages the add product form state including:

- Form data persistence across steps
- Current step tracking
- Form reset functionality

**Usage:**

```typescript
import { useAddProductFormStore } from "@/stores";

const { formData, currentStep, setFormData, setCurrentStep } =
  useAddProductFormStore();
```
