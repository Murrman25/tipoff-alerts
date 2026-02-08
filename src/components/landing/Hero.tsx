import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
export const Hero = () => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  return <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-gold-muted">Real-time odds alerts platform</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-4xl">
            Real-time sports alerts —{" "}
            <span className="text-gradient-gold">
              ​Get Tipped Off  
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Track line movements, game states, and odds changes across all major sports. 
            Get notified the instant your conditions are met.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="bg-gold-gradient text-primary-foreground hover:opacity-90 transition-opacity px-8 py-6 text-lg font-semibold">
              Start for free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 px-8 py-6 text-lg" onClick={() => setIsVideoModalOpen(true)}>
              <Play className="w-5 h-5 mr-2" />
              Watch now
            </Button>
          </div>

          {/* Trust indicator */}
          <p className="text-sm text-muted-foreground pt-4">
            No credit card required • Free forever on Rookie plan
          </p>
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl">See how TipOff works</DialogTitle>
            <DialogDescription>
              Watch how TipOff helps you catch every move in real-time.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-4">
            <AspectRatio ratio={16 / 9} className="bg-secondary/50 rounded-lg overflow-hidden">
              <video src="/videos/Sora-4bb00449.mp4" controls autoPlay muted playsInline onEnded={() => setIsVideoModalOpen(false)} className="w-full h-full object-contain" />
            </AspectRatio>
          </div>
        </DialogContent>
      </Dialog>
    </section>;
};