import { Navbar, Hero, HowItWorks, AlertTypes, Pricing, Footer } from "@/components/landing";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <HowItWorks />
        <AlertTypes />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
