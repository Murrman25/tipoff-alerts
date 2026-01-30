import { Navbar, Hero, GamesSection, AlertsSection, Pricing, Footer } from "@/components/landing";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <GamesSection />
        <AlertsSection />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
