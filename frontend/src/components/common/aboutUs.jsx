import React, { useEffect, useRef } from "react";

const AboutUs = () => {
  const team = [
    "CEO (Chief Eating Officer)",
    "Lead Developer (Ctrl+C / Ctrl+V Specialist)",
    "Bug Creator",
    "Console.log Analyst",
    "Stack Overflow Research Expert",
  ];

  const values = [
    "Clean code (on good days)",
    "Coffee before everything",
    "If it works, don’t touch it",
    "It was working yesterday",
    "Never trust code at 2 AM",
  ];

  const stats = [
    "87% of bugs fixed by restarting",
    "42 browser tabs always open",
    "100% stress before deadlines",
    "0% idea why it suddenly works",
  ];

  const useScrollReveal = () => {
    const ref = useRef();

    useEffect(() => {
      const el = ref.current;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("opacity-100", "translate-y-0");
          }
        },
        { threshold: 0.2 }
      );

      if (el) observer.observe(el);

      return () => observer.disconnect();
    }, []);

    return ref;
  };

  const GlowCard = ({ text }) => {
    const ref = useScrollReveal();

    return (
      <div
        ref={ref}
        className="group relative w-full h-28 flex items-center justify-center rounded-2xl border-4 overflow-hidden transition-all duration-500 opacity-0 translate-y-10 hover:shadow-[0_0_20px_var(--color-1),0_0_40px_var(--color-1)]"
        style={{
          borderColor: "var(--color-1)",
        }}
      >
        {/* Card content */}
        <div
          className="relative z-10 w-full h-full flex items-center justify-center transition-all duration-300"
          style={{ background: "var(--card)" }}
        >
          <p
            className="text-center transition-all duration-300 group-hover:scale-110 font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            {text}
          </p>
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300"
          style={{
            background: "var(--color-1)",
            boxShadow: "0 0 20px var(--color-1), 0 0 40px var(--color-1)",
          }}
        ></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            About Us
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Where code meets chaos and somehow becomes a Point of Sale system.
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-[var(--color-1)] text-center">
          <h2 className="text-2xl font-semibold mb-2"> Our Mission</h2>
          <p className="text-muted-foreground">
            To build a powerful POS system… and survive whatever happens next.
          </p>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-center"> Meet the Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((role, i) => (
              <GlowCard key={i} text={role} />
            ))}
          </div>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-center"> Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((v, i) => (
              <GlowCard key={i} text={v} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-center"> Project Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <GlowCard key={i} text={s} />
            ))}
          </div>
        </div>

        {/* Button */}
        <div className="text-center">
          <button
            onClick={() => alert("We told you not to click it 😄")}
            className="mt-4 px-6 py-2 rounded-lg transition-all duration-300 font-medium hover:shadow-[0_0_20px_var(--color-1),0_0_40px_var(--color-1)] active:scale-95"
            style={{
              background: "var(--color-1)",
              color: "white",
            }}
          >
            Don’t click this
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-muted-foreground pt-6 border-t border-border">
          <p>Built with React, determination, and last-minute decisions.</p>
          <p className="text-sm mt-2">
            Educational project. No real customers were harmed.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
