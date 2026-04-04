import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Importación de imágenes (ajusta las rutas según tu proyecto)
// import imgCamion from "./../img/camion..png";    // Quitamos el doble punto ".."
// import imgChef from "./../img/ib.png";          // Corregido .pgn -> .png y doble slash //
// import imgEstudiante from "./../img/ty..png";    // Añadida extensión .png necesaria
// import imgAmigos from "./../img/j.png";
// import imgChica from "./../img/pink.png";

import imgCamion from "../../img/8.png";
import imgChef from "../../img/9.png";
import imgEstudiante from "../../img/10.png";
import imgAmigos from "../../img/11.png";
import imgChica from "../../img/12.png";

const layers = [
  { id: 1, img: imgCamion, x: "0%", yStart: "100vh", size: "w-[100%]", z: 10 }, // El camión, más al fondo
  { id: 2, img: imgChef, x: "0%", yStart: "110vh", size: "w-[100%]", z: 30 }, // El chef con falafel, más arriba
  { id: 3, img: imgEstudiante, x: "0", yStart: "130vh", size: "w-[100%]", z: 25 }, // Estudiante con laptop
  { id: 4, img: imgAmigos, x: "0%", yStart: "140vh", size: "w-[100%]", z: 35 }, // Amigos y perro, los más adelantados
  { id: 5, img: imgChica, x: "0%", yStart: "150vh", size: "w-[100%]", z: 40 }, // Chica de rosa, siempre al frente
];

const HeroScene = () => {
  const containerRef = useRef(null);
  
  // Rastrear el scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Texto de fondo: aparece suavemente detrás de la escena.
  // Su opacidad nunca llega a 1, solo un toque semi-transparente y elegante.
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 0.3]);

  return (
    <section 
      ref={containerRef} 
      className="relative bg-[#a64d33]" // Color OKLCH aproximado
      style={{ height: "500vh" }} // Espacio para el scroll de las 5 capas sólidas
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* TEXTO DE FONDO - SIEMPRE DETRÁS DE LAS CAPAS */}
        <motion.h1 
          style={{ 
            opacity: textOpacity,
            zIndex: 5, // Aseguramos que esté detrás de z=10
          }}
          className="absolute text-[15vw] font-black text-white pointer-events-none select-none uppercase leading-none text-center"
        >
          Shako <br /> Kabob
        </motion.h1>

        {/* MAPEO DE CAPAS SÓLIDAS (Igual que image_31.png) */}
        {layers.map((layer, index) => (
          <SceneLayer 
            key={layer.id} 
            layer={layer} 
            progress={scrollYProgress} 
            index={index} 
            total={layers.length} 
          />
        ))}

      </div>
    </section>
  );
};

const SceneLayer = ({ layer, progress, index, total }) => {
  // Calculamos el rango de scroll para esta capa específica
  const start = index / total;
  const end = (index + 1) / total;

  // Animación suave de entrada: viene desde abajo y se queda en 0.
  // IMPORTANTE: Mantenemos la opacidad en [1, 1] (sin transparencia).
  const y = useTransform(progress, [0, end], [layer.yStart, "0%"]);
  const scale = useTransform(progress, [start, end], [0.9, 1]);
  // const opacity = [1, 1];  // Descomenta si Framer-motion lo requiere, pero es la predeterminada.

  return (
    <motion.div
      style={{ 
        y, 
        scale, 
        zIndex: layer.z, // Respetar el orden de apilado que pediste
        left: "50%",
        x: "-50%", // Centrado horizontal base
      }}
      className={`absolute bottom-0 flex justify-center items-end ${layer.size} select-none`}
    >
      <img 
        src={layer.img} 
        alt={`Layer ${layer.id}`} 
        className="w-full h-auto object-contain"
        style={{ transform: `translateX(${layer.x})` }} // Ajuste lateral manual para composición
      />
    </motion.div>
  );
};

export default HeroScene;