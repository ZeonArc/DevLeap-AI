"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const cursorDot = document.querySelector(".cursor-dot");
    const cursorRing = document.querySelector(".cursor-ring");
    
    // Set initial position offscreen to avoid flashing in top left
    gsap.set(cursorDot, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    gsap.set(cursorRing, { xPercent: -50, yPercent: -50, x: -100, y: -100 });

    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Dot follows instantly
      gsap.to(cursorDot, {
        x: mouseX,
        y: mouseY,
        duration: 0.1,
        ease: "none",
      });

      // Ring follows with slight delay
      gsap.to(cursorRing, {
        x: mouseX,
        y: mouseY,
        duration: 0.5,
        ease: "power2.out",
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "a" || 
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("hover-button") ||
        target.closest(".hover-button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <>
      <div className={`cursor-dot fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[999999] mix-blend-difference transition-opacity duration-300 ${isHovering ? "opacity-0" : "opacity-100"}`}></div>
      <div className={`cursor-ring fixed top-0 left-0 w-10 h-10 border border-primary/50 rounded-full pointer-events-none z-[999999] mix-blend-difference transition-all duration-300 ${isHovering ? "w-20 h-20 bg-primary/20 backdrop-blur-sm border-primary scale-125" : ""}`}></div>
    </>
  );
}
