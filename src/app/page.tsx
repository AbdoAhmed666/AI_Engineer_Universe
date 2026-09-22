import Hero from "@/sections/Hero";
import Ask from "@/sections/Ask";
import About from "@/sections/About";
import Skills from "@/sections/Skills";
import Projects from "@/sections/Projects";
import Experience from "@/sections/Experience";
import Contact from "@/sections/Contact";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Ask />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
    </div>
  );
}
