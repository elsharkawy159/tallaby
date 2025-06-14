"use client";

import Link from "next/link";
import Image from "next/image";
import CategoryShowcase from "./CategoryShowcase";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import Autoplay from "embla-carousel-autoplay";

const HeroCarousel = () => {
  const banners = [
    {
      id: 1,
      href: "/",
      image: "/banner.jpg",
    },
    {
      id: 2,
      href: "/",
      image: "/banner2.jpg",
    },
  ];

  return (
    <section className="relative w-full mb-20">
      <Carousel
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: true,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full group"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className="p-0">
              <Link href={banner.href}>
                <div className="relative h-[500px] w-full overflow-hidden">
                  <Image
                    src={banner.image}
                    alt={banner.image}
                    fill
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 group-hover:opacity-100 opacity-0 bg-transparent border-none h-full rounded-none hover:bg-black/5 px-10 duration-200 shadow-none transition-all" />
        <CarouselNext className="right-0 group-hover:opacity-100 opacity-0 bg-transparent border-none h-full rounded-none hover:bg-black/5 px-10 duration-200 shadow-none transition-all" />
      </Carousel>
      <CategoryShowcase className="absolute -bottom-20 left-0 right-0" />
    </section>
  );
};

export default HeroCarousel;
