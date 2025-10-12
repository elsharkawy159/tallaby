"use client";

import {
  createContext,
  ReactNode,
  useState,
  useCallback,
  useContext,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAddresses,
  addAddress as addAddressAction,
  updateAddress as updateAddressAction,
  deleteAddress as deleteAddressAction,
  setDefaultAddress as setDefaultAddressAction,
} from "@/actions/customer";
import type { AddressData } from "@/components/address/address.schema";

interface AddressState {
  addresses: AddressData[];
  defaultAddress: AddressData | null;
  selectedAddress: AddressData | null;
  isLoading: boolean;
  isAddingAddress: boolean;
  isUpdatingAddress: boolean;
  isDeletingAddress: boolean;
  isSettingDefault: boolean;
  // Methods
  addAddress: (
    data: AddressData
  ) => Promise<{ success: boolean; data?: AddressData }>;
  updateAddress: (
    id: string,
    data: AddressData
  ) => Promise<{ success: boolean; data?: AddressData }>;
  deleteAddress: (id: string) => Promise<{ success: boolean }>;
  setDefaultAddress: (id: string) => Promise<{ success: boolean }>;
  selectAddress: (address: AddressData | null) => void;
  refreshAddresses: () => Promise<void>;
  getAddressById: (id: string) => AddressData | undefined;
}

const AddressContext = createContext<AddressState | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    null
  );

  // Query for addresses
  const {
    data: addresses = [],
    isLoading,
    refetch: refreshAddresses,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const result = await getAddresses();
      if (result.success) {
        return (result.data || []) as AddressData[];
      }
      throw new Error(result.error || "Failed to load addresses");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Find default address
  const defaultAddress =
    (addresses as AddressData[]).find((addr: AddressData) => addr.isDefault) ||
    null;

  // Mutation for adding address
  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressData) => {
      const result = await addAddressAction(data);
      if (!result.success) {
        throw new Error(result.error || "Failed to add address");
      }
      return result.data as AddressData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<AddressData[]>(["addresses"], (old = []) => {
        // If this is a default address, unset others
        const updated = data.isDefault
          ? old.map((addr) => ({ ...addr, isDefault: false }))
          : old;
        return [data, ...updated];
      });
      toast.success("Address added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add address");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  // Mutation for updating address
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressData }) => {
      const result = await updateAddressAction(id, data);
      if (!result.success) {
        throw new Error(result.error || "Failed to update address");
      }
      return result.data as AddressData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<AddressData[]>(["addresses"], (old = []) => {
        // If updating to default, unset others
        const updated = data.isDefault
          ? old.map((addr) =>
              addr.id === data.id ? data : { ...addr, isDefault: false }
            )
          : old.map((addr) => (addr.id === data.id ? data : addr));
        return updated;
      });

      // Update selected address if it's the one being updated
      if (selectedAddress?.id === data.id) {
        setSelectedAddress(data);
      }

      toast.success("Address updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update address");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  // Mutation for deleting address
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAddressAction(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete address");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AddressData[]>(["addresses"], (old = []) =>
        old.filter((addr) => addr.id !== id)
      );

      // Clear selected address if it's the one being deleted
      if (selectedAddress?.id === id) {
        setSelectedAddress(null);
      }

      toast.success("Address deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete address");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  // Mutation for setting default address
  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await setDefaultAddressAction(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to set default address");
      }
      return { id, data: result.data as AddressData };
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["addresses"] });

      // Snapshot previous value
      const previousAddresses = queryClient.getQueryData<AddressData[]>([
        "addresses",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<AddressData[]>(["addresses"], (old = []) =>
        old.map((addr) => ({
          ...addr,
          isDefault: addr.id === id,
        }))
      );

      return { previousAddresses };
    },
    onSuccess: ({ id, data }) => {
      // Ensure cache is updated with server data
      queryClient.setQueryData<AddressData[]>(["addresses"], (old = []) =>
        old.map((addr) => ({
          ...addr,
          isDefault: addr.id === id,
        }))
      );

      // Update selected address if it's now the default
      if (selectedAddress?.id === id) {
        setSelectedAddress({ ...selectedAddress, isDefault: true });
      }

      toast.success("Default address updated");
    },
    onError: (error: Error, id, context) => {
      // Rollback on error
      if (context?.previousAddresses) {
        queryClient.setQueryData(["addresses"], context.previousAddresses);
      }
      toast.error(error.message || "Failed to set default address");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  // Wrapper methods
  const addAddress = useCallback(
    async (data: AddressData) => {
      try {
        const result = await addAddressMutation.mutateAsync(data);
        return { success: true, data: result };
      } catch (error) {
        return { success: false };
      }
    },
    [addAddressMutation]
  );

  const updateAddress = useCallback(
    async (id: string, data: AddressData) => {
      try {
        const result = await updateAddressMutation.mutateAsync({ id, data });
        return { success: true, data: result };
      } catch (error) {
        return { success: false };
      }
    },
    [updateAddressMutation]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      try {
        await deleteAddressMutation.mutateAsync(id);
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    },
    [deleteAddressMutation]
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      try {
        await setDefaultAddressMutation.mutateAsync(id);
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    },
    [setDefaultAddressMutation]
  );

  const selectAddress = useCallback((address: AddressData | null) => {
    setSelectedAddress(address);
  }, []);

  const getAddressById = useCallback(
    (id: string) => {
      return (addresses as AddressData[]).find(
        (addr: AddressData) => addr.id === id
      );
    },
    [addresses]
  );

  const value: AddressState = {
    addresses: addresses as AddressData[],
    defaultAddress,
    selectedAddress,
    isLoading,
    isAddingAddress: addAddressMutation.isPending,
    isUpdatingAddress: updateAddressMutation.isPending,
    isDeletingAddress: deleteAddressMutation.isPending,
    isSettingDefault: setDefaultAddressMutation.isPending,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    selectAddress,
    refreshAddresses: async () => {
      await refreshAddresses();
    },
    getAddressById,
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
}

export function useAddress(): AddressState {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error("useAddress must be used within an AddressProvider");
  }
  return context;
}
