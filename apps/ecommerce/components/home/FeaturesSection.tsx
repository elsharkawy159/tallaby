
import { Truck, Shield, RotateCcw, Headphones, CreditCard, Star } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "Free delivery on orders over $50"
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "Your payment information is safe"
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "30-day hassle-free returns"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock customer service"
    },
    {
      icon: CreditCard,
      title: "Flexible Payment",
      description: "Multiple payment options available"
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "Premium products from trusted brands"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Why Shop With Us?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Experience the best online shopping with our premium services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className="bg-white/10 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-colors">
                  <IconComponent className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
