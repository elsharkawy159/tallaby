"use client";

import Link from "next/link";
import Image from "next/image";
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
      href: "/products",
      image: "/banner.jpg",
    },
    {
      id: 2,
      href: "/products",
      image: "/banner2.jpg",
    },
    {
      id: 2,
      href: "/products",
      image: "/banner3.jpg",
    },
    {
      id: 2,
      href: "/products",
      image: "/banner4.jpg",
    },
    {
      id: 2,
      href: "/products",
      image: "/banner5.jpg",
    },
    {
      id: 2,
      href: "/products",
      image: "/banner6.jpg",
    },
  ];

  return (
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
                  className="object-cover object-top"
                />
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0 group-hover:opacity-100 opacity-0 bg-transparent border-none h-full rounded-none hover:bg-black/5 px-10 duration-200 shadow-none transition-all" />
      <CarouselNext className="right-0 group-hover:opacity-100 opacity-0 bg-transparent border-none h-full rounded-none hover:bg-black/5 px-10 duration-200 shadow-none transition-all" />
    </Carousel>
  );
};

export default HeroCarousel;
