import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute('/custumer/home')({
  component: FlashFoodTruckHome,
});

function FlashFoodTruckHome() {
  return (
    <div className="min-h-screen flex flex-col bg-yellow-50 font-sans">
      {/* Hero Section */}
      <header className="bg-red-500 text-white py-20 text-center">
        <h1 className="text-5xl font-extrabold mb-4">Flash Food Truck ⚡</h1>
        <p className="text-xl mb-6">Fast, fresh, and flavorful street food!</p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* Botón al menú */}
          <Link
            to="custumer/menu"
            className="px-6 py-3 bg-white text-red-500 font-bold rounded hover:bg-gray-100 transition"
          >
            See Our Menu
          </Link>

          {/* Botón de registro */}
          <Link
            to="custumer/register"
            className="px-6 py-3 bg-white text-red-500 font-bold rounded hover:bg-gray-100 transition"
          >
            Register
          </Link>
        </div>
      </header>

      {/* About Section */}
      <section className="py-16 px-8 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">About Flash</h2>
        <p className="text-gray-700 mb-4">
          Flash is your go-to food truck for delicious street eats, made fast but with care and quality ingredients.
        </p>
        <p className="text-gray-700">
          Whether you're craving burgers, tacos, or fresh sides, we bring flavor wherever we park.
        </p>
      </section>

      {/* Highlights Section */}
      <section className="bg-white py-16 px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Flash?</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 shadow rounded">
            <h3 className="font-bold mb-2">Fast & Fresh ⚡</h3>
            <p>Delicious meals served quickly without compromising quality.</p>
          </div>
          <div className="p-6 shadow rounded">
            <h3 className="font-bold mb-2">Street Style</h3>
            <p>Authentic street food experience wherever we park.</p>
          </div>
          <div className="p-6 shadow rounded">
            <h3 className="font-bold mb-2">Flavor Explosion 🌮</h3>
            <p>Bold flavors in every bite, perfect for food lovers.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-red-500 py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Find Flash Near You!</h2>
        <Link
          to="/locations"
          className="px-6 py-3 bg-white text-red-500 font-bold rounded hover:bg-gray-100 transition"
        >
          See Our Locations
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-yellow-100 py-6 text-center text-gray-700">
        © 2026 Flash Food Truck. All rights reserved.
      </footer>
    </div>
  );
}