import { Button } from "@workspace/ui/components/button";

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-r from-primary to-primary/80 text-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Unlock Up to
            <span className="text-secondary"> 70% Off</span>
          </h1>
          <p className="text-xl mb-8 text-white/90">
            Discover the latest fashion trends from top brands and vendors. Your
            style journey starts here.
          </p>
          <Button
            size="lg"
            className="bg-secondary hover:bg-secondary/90 text-black font-semibold px-8 py-3 text-lg"
          >
            Shop Now
          </Button>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute bottom-20 right-40 w-20 h-20 bg-secondary rounded-full"></div>
        <div className="absolute top-40 right-60 w-16 h-16 bg-white rounded-full"></div>
      </div>
    </section>
  );
};

export default HeroSection;
