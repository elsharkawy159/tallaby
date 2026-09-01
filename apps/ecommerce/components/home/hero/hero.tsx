import { Suspense } from "react";
import CategoryShowcase from "../category/category-showcase";
import { CategoryShowcaseSkeleton } from "../category/category-showcase.skeleton";
import HeroBanner from "./hero-banner";

const Hero = () => {
  return (
    <section className="relative w-full mb-10 md:mb-20">
      <HeroBanner />
      <Suspense fallback={<CategoryShowcaseSkeleton className="absolute left-0 right-0 md:-bottom-20 -bottom-10" />}>
        <CategoryShowcase className="absolute left-0 right-0 md:-bottom-20 -bottom-10" />
      </Suspense>
    </section>
  );
};

export default Hero;
