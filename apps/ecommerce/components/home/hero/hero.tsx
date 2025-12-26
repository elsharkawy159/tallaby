import CategoryShowcase from "../category/category-showcase";
import HeroCarousel from "./hero-carousel";

const Hero = () => {
  return (
    <section className="relative w-full mb-10 md:mb-20">
      <HeroCarousel />
      <CategoryShowcase className="absolute md:-bottom-20 -bottom-10 left-0 right-0" />
    </section>
  );
};

export default Hero;
