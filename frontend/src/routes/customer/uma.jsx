import { createFileRoute } from '@tanstack/react-router'
import HeroCarousel from "@/components/common/hero";

export const Route = createFileRoute('/customer/uma')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <HeroCarousel/>
  </div>
}
