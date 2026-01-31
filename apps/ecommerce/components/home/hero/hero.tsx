import CategoryShowcase from "../category/category-showcase";
import HeroBanner from "./hero-banner";

const Hero = () => {
  return (
    <section className="relative w-full mb-10 md:mb-20">
      <HeroBanner />
      <CategoryShowcase className="absolute left-0 right-0 md:-bottom-20 -bottom-10" />
    </section>
  );
};

export default Hero;
