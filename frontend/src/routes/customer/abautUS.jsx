import { createFileRoute } from '@tanstack/react-router'
import HeroCarousel from "@/components/common/hero";
import AboutUs from '@/components/common/aboutUs';

export const Route = createFileRoute('/customer/abautUS')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <HeroCarousel/>
    <AboutUs/>
  </div>
}
