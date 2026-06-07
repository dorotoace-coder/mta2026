import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ScheduleSection from "@/components/ScheduleSection";
import RegisterSection from "@/components/RegisterSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen" style={{ background: "#0d0002" }}>
    <Navbar />
    <HeroSection />
    <AboutSection />
    <ScheduleSection />
    <RegisterSection />
    <Footer />
  </div>
);

export default Index;
