import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CountdownTimer from "@/components/CountdownTimer";
import AboutSection from "@/components/AboutSection";
import ScheduleSection from "@/components/ScheduleSection";
import RegisterSection from "@/components/RegisterSection";
import Footer from "@/components/Footer";
import { useReveal } from "@/hooks/useReveal";

const Index = () => {
  useReveal();

  return (
    <div className="min-h-screen overflow-x-clip mta-page-shell">
      <Navbar />
      <main>
        <HeroSection />
        <CountdownTimer />
        <AboutSection />
        <ScheduleSection />
        <RegisterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
