import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CountdownTimer from "@/components/CountdownTimer";
import AboutSection from "@/components/AboutSection";
import ScheduleSection from "@/components/ScheduleSection";
import RegisterSection from "@/components/RegisterSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen mta-page-shell">
    <Navbar />
    <HeroSection />
    <CountdownTimer />
    <AboutSection />
    <ScheduleSection />
    <RegisterSection />
    <Footer />
  </div>
);

export default Index;
