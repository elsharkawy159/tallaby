
import { useState, useEffect } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { useAuth } from '@/contexts/AuthContext';
// import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    title: string;
    slug: string;
    images: Array<{
      url: string;
      alt_text: string;
    }>;
  };
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  // const { user } = useAuth();
  // const { toast } = useToast();

  // const fetchCartItems = async () => {
  //   if (!user) {
  //     setCartItems([]);
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     const { data: cart, error: cartError } = await supabase
  //       .from('carts')
  //       .select('id')
  //       .eq('user_id', user.id)
  //       .single();

  //     if (cartError || !cart) {
  //       setLoading(false);
  //       return;
  //     }

  //     const { data: items, error } = await supabase
  //       .from('cart_items')
  //       .select(`
  //         id,
  //         product_id,
  //         quantity,
  //         price,
  //         products!inner (
  //           title,
  //           slug,
  //           product_images!inner (
  //             url,
  //             alt_text
  //           )
  //         )
  //       `)
  //       .eq('cart_id', cart.id);

  //     if (error) {
  //       console.error('Error fetching cart items:', error);
  //     } else {
  //       const transformedItems = items?.map(item => ({
  //         id: item.id,
  //         product_id: item.product_id,
  //         quantity: item.quantity,
  //         price: item.price,
  //         product: {
  //           title: item.products.title,
  //           slug: item.products.slug,
  //           images: item.products.product_images || []
  //         }
  //       })) || [];
  //       setCartItems(transformedItems);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching cart:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const addToCart = async (productId: string, quantity: number = 1) => {
  //   if (!user) {
  //     toast({
  //       title: "Please sign in",
  //       description: "You need to be signed in to add items to cart.",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   try {
  //     // Get or create cart
  //     let { data: cart, error: cartError } = await supabase
  //       .from('carts')
  //       .select('id')
  //       .eq('user_id', user.id)
  //       .single();

  //     if (cartError || !cart) {
  //       const { data: newCart, error: createError } = await supabase
  //         .from('carts')
  //         .insert({ user_id: user.id })
  //         .select('id')
  //         .single();
        
  //       if (createError) throw createError;
  //       cart = newCart;
  //     }

  //     // Get product price
  //     const { data: product, error: productError } = await supabase
  //       .from('products')
  //       .select('base_price')
  //       .eq('id', productId)
  //       .single();

  //     if (productError) throw productError;

  //     // Check if item already exists in cart
  //     const { data: existingItem, error: existingError } = await supabase
  //       .from('cart_items')
  //       .select('id, quantity')
  //       .eq('cart_id', cart.id)
  //       .eq('product_id', productId)
  //       .maybeSingle();

  //     if (existingItem) {
  //       // Update quantity
  //       const { error: updateError } = await supabase
  //         .from('cart_items')
  //         .update({ quantity: existingItem.quantity + quantity })
  //         .eq('id', existingItem.id);

  //       if (updateError) throw updateError;
  //     } else {
  //       // Add new item
  //       const { error: insertError } = await supabase
  //         .from('cart_items')
  //         .insert({
  //           cart_id: cart.id,
  //           product_id: productId,
  //           quantity,
  //           price: product.base_price,
  //           seller_id: user.id // This should be the actual seller ID
  //         });

  //       if (insertError) throw insertError;
  //     }

  //     await fetchCartItems();
  //     toast({
  //       title: "Added to cart",
  //       description: "Item has been added to your cart."
  //     });
  //   } catch (error) {
  //     console.error('Error adding to cart:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to add item to cart.",
  //       variant: "destructive"
  //     });
  //   }
  // };

  // const removeFromCart = async (itemId: string) => {
  //   try {
  //     const { error } = await supabase
  //       .from('cart_items')
  //       .delete()
  //       .eq('id', itemId);

  //     if (error) throw error;

  //     await fetchCartItems();
  //     toast({
  //       title: "Removed from cart",
  //       description: "Item has been removed from your cart."
  //     });
  //   } catch (error) {
  //     console.error('Error removing from cart:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to remove item from cart.",
  //       variant: "destructive"
  //     });
  //   }
  // };

  // const updateQuantity = async (itemId: string, quantity: number) => {
  //   if (quantity <= 0) {
  //     await removeFromCart(itemId);
  //     return;
  //   }

  //   try {
  //     const { error } = await supabase
  //       .from('cart_items')
  //       .update({ quantity })
  //       .eq('id', itemId);

  //     if (error) throw error;

  //     await fetchCartItems();
  //   } catch (error) {
  //     console.error('Error updating quantity:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to update quantity.",
  //       variant: "destructive"
  //     });
  //   }
  // };

  // const clearCart = async () => {
  //   if (!user) return;

  //   try {
  //     const { data: cart } = await supabase
  //       .from('carts')
  //       .select('id')
  //       .eq('user_id', user.id)
  //       .single();

  //     if (cart) {
  //       const { error } = await supabase
  //         .from('cart_items')
  //         .delete()
  //         .eq('cart_id', cart.id);

  //       if (error) throw error;
  //       await fetchCartItems();
  //     }
  //   } catch (error) {
  //     console.error('Error clearing cart:', error);
  //   }
  // };

  // useEffect(() => {
  //   fetchCartItems();
  // }, [user]);

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return {
    cartItems,
    loading,
    // addToCart,
    // removeFromCart,
    // updateQuantity,
    // clearCart,
    cartTotal,
    itemCount,
    // refetch: fetchCartItems
  };
};
