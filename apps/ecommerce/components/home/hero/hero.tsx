import { Suspense } from "react";
import CategoryShowcase from "../category/category-showcase";
import HeroCarousel from "./hero-carousel";
import { CategoryShowcaseSkeleton } from "../category/category-showcase.skeleton";

const Hero = () => {
  return (
    <section className="relative w-full mb-10 md:mb-20">
      <HeroCarousel />
      <Suspense fallback={<CategoryShowcaseSkeleton />}>
      <CategoryShowcase className="absolute md:-bottom-20 -bottom-10 left-0 right-0" />
      </Suspense>
    </section>
  );
};

export default Hero;
