import {
  Truck,
  Shield,
  RotateCcw,
  Headphones,
  CreditCard,
  Star,
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "Free delivery on orders over $50",
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "Your payment information is safe",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "30-day hassle-free returns",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock customer service",
    },
    {
      icon: CreditCard,
      title: "Flexible Payment",
      description: "Multiple payment options available",
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "Premium products from trusted brands",
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary via-primary/80 to-primary/70 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Why Shop With Us?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto">
            Experience the best online shopping with our premium services
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className="bg-white/10 backdrop-blur-sm w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-white/20 transition-colors">
                  <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
