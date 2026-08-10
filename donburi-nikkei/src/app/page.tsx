import { Hero } from "@/components/home/hero";
import { Highlights } from "@/components/home/highlights";
import { FeaturedDishes } from "@/components/home/featured-dishes";
import { Testimonials } from "@/components/home/testimonials";
import { Location } from "@/components/home/location";
import { CtaOrder } from "@/components/home/cta-order";

export default function Home() {
  return (
    <>
      <Hero />
      <Highlights />
      <FeaturedDishes />
      <Testimonials />
      <CtaOrder />
      <Location />
    </>
  );
}
