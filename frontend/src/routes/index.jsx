import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Truck } from "lucide-react";
import HeroCarousel from "@/components/common/hero";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFeatured(data.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-amber-950/20">
      {/* <HeroCarousel/> */}
      {/* Hero */}
      <section className="bg-amber-600 dark:bg-amber-700 text-white py-24 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Truck size={40} />
          <h1 className="text-5xl font-extrabold tracking-tight">
            Shako Kabob
          </h1>
        </div>
        <p className="text-amber-100 text-xl mt-2 mb-8 max-w-md mx-auto">
          Fresh street food, made to order. Find us around the city.
        </p>
        <Link to="/order">
          <Button
            size="lg"
            className="bg-white text-amber-700 hover:bg-amber-50 dark:bg-amber-100 dark:text-amber-800 font-bold px-8 text-base"
          >
            Order Now <ChevronRight size={18} className="ml-1" />
          </Button>
        </Link>
      </section>

      {/* Featured items */}
      {featured.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8 text-foreground">
            Customer Favorites
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((item) => (
              <Card
                key={item.menu_item_id}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{item.item_name}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-3 font-bold text-amber-600 dark:text-amber-400">
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/order">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500 px-8">
                View Full Menu
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
