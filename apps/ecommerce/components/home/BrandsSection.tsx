
import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";

interface Brand {
  id: string;
  name: string;
  logo_url: string;
  description: string;
}

const BrandsSection = () => {
  const [brands, setBrands] = useState<Brand[]>([]);

  // useEffect(() => {
  //   const fetchBrands = async () => {
  //     const { data, error } = await supabase
  //       .from('brands')
  //       .select('id, name, logo_url, description')
  //       .eq('is_verified', true)
  //       .limit(8);

  //     if (!error && data) {
  //       setBrands(data);
  //     }
  //   };

  //   fetchBrands();
  // }, []);

  // Fallback brands if none in database
  const fallbackBrands = [
    { id: '1', name: 'Nike', logo_url: 'https://logos-world.net/wp-content/uploads/2020/04/Nike-Logo.png', description: 'Athletic footwear and apparel' },
    { id: '2', name: 'Apple', logo_url: 'https://logoeps.com/wp-content/uploads/2013/03/apple-vector-logo.png', description: 'Technology and electronics' },
    { id: '3', name: 'Samsung', logo_url: 'https://logos-world.net/wp-content/uploads/2020/04/Samsung-Logo.png', description: 'Electronics and technology' },
    { id: '4', name: 'Adidas', logo_url: 'https://logoeps.com/wp-content/uploads/2014/05/adidas-vector-logo.png', description: 'Sports apparel and footwear' },
    { id: '5', name: 'Sony', logo_url: 'https://logos-world.net/wp-content/uploads/2020/04/Sony-Logo.png', description: 'Electronics and entertainment' },
    { id: '6', name: 'LG', logo_url: 'https://logos-world.net/wp-content/uploads/2020/04/LG-Logo.png', description: 'Home appliances and electronics' },
  ];

  const displayBrands = brands.length > 0 ? brands : fallbackBrands;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted Brands
          </h2>
          <p className="text-lg text-gray-600">
            Shop from the world's most trusted and loved brands
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {displayBrands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer"
            >
              <div className="text-center">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="h-12 w-auto mx-auto mb-2 grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <div className="h-12 w-16 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">{brand.name}</span>
                  </div>
                )}
                <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                  {brand.name}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">500+</div>
            <div className="text-gray-600">Trusted Brands</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">50K+</div>
            <div className="text-gray-600">Products</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">1M+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-gray-600">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
