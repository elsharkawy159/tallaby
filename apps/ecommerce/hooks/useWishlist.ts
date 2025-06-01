
import { useState, useEffect } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/contexts/AuthContext';
// import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    title: string;
    slug: string;
    base_price: number;
    images: Array<{
      url: string;
      alt_text: string;
    }>;
  };
}

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  // const { user } = useAuth();
  // const { toast } = useToast();

  // const fetchWishlistItems = async () => {
  //   if (!user) {
  //     setWishlistItems([]);
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     const { data: wishlist, error: wishlistError } = await supabase
  //       .from('wishlists')
  //       .select('id')
  //       .eq('user_id', user.id)
  //       .eq('is_default', true)
  //       .single();

  //     if (wishlistError || !wishlist) {
  //       setLoading(false);
  //       return;
  //     }

  //     const { data: items, error } = await supabase
  //       .from('wishlist_items')
  //       .select(`
  //         id,
  //         product_id,
  //         products!inner (
  //           id,
  //           title,
  //           slug,
  //           base_price,
  //           product_images!inner (
  //             url,
  //             alt_text
  //           )
  //         )
  //       `)
  //       .eq('wishlist_id', wishlist.id);

  //     if (error) {
  //       console.error('Error fetching wishlist items:', error);
  //     } else {
  //       const transformedItems = items?.map(item => ({
  //         id: item.id,
  //         product_id: item.product_id,
  //         product: {
  //           id: item.products.id,
  //           title: item.products.title,
  //           slug: item.products.slug,
  //           base_price: item.products.base_price,
  //           images: item.products.product_images || []
  //         }
  //       })) || [];
  //       setWishlistItems(transformedItems);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching wishlist:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const addToWishlist = async (productId: string) => {
  //   if (!user) {
  //     toast({
  //       title: "Please sign in",
  //       description: "You need to be signed in to add items to wishlist.",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   try {
  //     // Get default wishlist
  //     const { data: wishlist, error: wishlistError } = await supabase
  //       .from('wishlists')
  //       .select('id')
  //       .eq('user_id', user.id)
  //       .eq('is_default', true)
  //       .single();

  //     if (wishlistError || !wishlist) {
  //       toast({
  //         title: "Error",
  //         description: "Default wishlist not found.",
  //         variant: "destructive"
  //       });
  //       return;
  //     }

  //     // Check if item already exists
  //     const { data: existingItem } = await supabase
  //       .from('wishlist_items')
  //       .select('id')
  //       .eq('wishlist_id', wishlist.id)
  //       .eq('product_id', productId)
  //       .single();

  //     if (existingItem) {
  //       toast({
  //         title: "Already in wishlist",
  //         description: "This item is already in your wishlist."
  //       });
  //       return;
  //     }

  //     // Add to wishlist
  //     const { error } = await supabase
  //       .from('wishlist_items')
  //       .insert({
  //         wishlist_id: wishlist.id,
  //         product_id: productId
  //       });

  //     if (error) throw error;

  //     await fetchWishlistItems();
  //     toast({
  //       title: "Added to wishlist",
  //       description: "Item has been added to your wishlist."
  //     });
  //   } catch (error) {
  //     console.error('Error adding to wishlist:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to add item to wishlist.",
  //       variant: "destructive"
  //     });
  //   }
  // };

  // const removeFromWishlist = async (productId: string) => {
  //   try {
  //     const { data: wishlist, error: wishlistError } = await supabase
  //       .from('wishlists')
  //       .select('id')
  //       .eq('user_id', user?.id)
  //       .eq('is_default', true)
  //       .single();

  //     if (wishlistError || !wishlist) return;

  //     const { error } = await supabase
  //       .from('wishlist_items')
  //       .delete()
  //       .eq('wishlist_id', wishlist.id)
  //       .eq('product_id', productId);

  //     if (error) throw error;

  //     await fetchWishlistItems();
  //     toast({
  //       title: "Removed from wishlist",
  //       description: "Item has been removed from your wishlist."
  //     });
  //   } catch (error) {
  //     console.error('Error removing from wishlist:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to remove item from wishlist.",
  //       variant: "destructive"
  //     });
  //   }
  // };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  // useEffect(() => {
  //   fetchWishlistItems();
  // }, [user]);

  return {
    wishlistItems,
    loading,
    // addToWishlist,
    // removeFromWishlist,
    isInWishlist,
    // refetch: fetchWishlistItems
  };
};
