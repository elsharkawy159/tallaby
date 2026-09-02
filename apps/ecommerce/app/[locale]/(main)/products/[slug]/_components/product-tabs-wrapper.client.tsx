"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/supabase/client";
import { ProductTabs } from "./product-tabs";
import type { Product } from "./product-page.types";

interface ProductTabsWrapperProps {
  product: Product;
}

export const ProductTabsWrapper = ({ product }: ProductTabsWrapperProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, []);

  return <ProductTabs product={product} user={user} />;
};
