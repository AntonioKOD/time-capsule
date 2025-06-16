'use client'
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Zap } from "lucide-react";

/**
 * Time Capsule Creator Landing Page
 * Neobrutalist/Retro design with minimal bittersweet palette (black, white, electric blue)
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Brutalist Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white border-b-4 border-black">
        <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link 
            href="/" 
            className="flex items-center space-x-3 text-2xl font-black text-black hover:text-blue transition-colors duration-200 font-retro uppercase"
          >
            <div className="flex h-12 w-12 items-center justify-center bg-white border-3 border-black shadow-brutalist overflow-hidden">
              <Image 
                src="/time_capsule.png" 
                alt="Time Capsule Creator Logo" 
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span>Time Capsule</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex font-bold text-black hover:bg-gray border-2 border-transparent hover:border-black font-retro uppercase">
              <Link href="/gallery">Explore</Link>
            </Button>
            <button className="brutalist-button brutalist-button-primary">
              <Link href="/create" className="flex items-center gap-2 no-underline text-inherit">
                Create Capsule
                <ArrowRight className="h-4 w-4" />
              </Link>
            </button>
          </div>
        </div>
      </nav>

      {/* Brutalist Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 bg-white">
        {/* Floating brutalist elements */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-blue border-4 border-black shadow-brutalist animate-brutalist-float" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-black border-4 border-black shadow-brutalist-lg animate-brutalist-bounce" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gray border-3 border-black shadow-brutalist" />
        
        <div className="relative container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Brutalist Badge */}
            <div className="mb-8 inline-flex items-center">
              <div className="brutalist-window">
                <div className="brutalist-window-header">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue border border-black" />
                    <span>Time Capsule System</span>
                  </div>
                </div>
                <div className="brutalist-window-content bg-gray text-black">
                  <div className="flex items-center gap-4">
                    <span className="font-bold">Preserve memories for the future</span>
                    <div className="brutalist-badge">
                      $1 Capsules
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Brutalist Main Heading */}
            <h1 className="mb-8 text-4xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-black font-retro uppercase">
              <span className="text-blue">
                Seal a Memory.
              </span>
              <br />
              <span className="text-black">
                Open it Later.
              </span>
            </h1>
            
            {/* Description */}
            <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-black font-bold">
              Create digital time capsules with your thoughts, photos, and voice messages. 
              Set them to open at the perfect moment in the future.
            </p>
            
            {/* Brutalist CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row mb-16">
              <button className="brutalist-button brutalist-button-primary text-lg px-8 py-4">
                <Link href="/create" className="flex items-center gap-3 no-underline text-inherit">
                  Create Your Time Capsule - $1
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </button>
            </div>
            

          </div>
        </div>
      </section>

      {/* Brutalist Features Section */}
      <section className="py-24 bg-gray">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-4xl font-black tracking-tight text-black mb-6 font-retro uppercase">
              Everything you need to preserve memories
            </h2>
            <p className="text-xl text-black font-bold leading-relaxed">
              Powerful features designed to help you create meaningful time capsules
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Write Your Thoughts",
                description: "Capture your current feelings, dreams, and reflections in beautifully formatted text",
                color: "brutalist-card-blue",
                textColor: "text-white"
              },
              {
                title: "Save Photos",
                description: "Preserve special moments with high-quality photo storage and organization",
                color: "brutalist-card-black",
                textColor: "text-white"
              },
              {
                title: "Record Voice Messages",
                description: "Leave audio messages to hear your voice from the past with crystal clear quality",
                color: "brutalist-card-white",
                textColor: "text-black"
              },
              {
                title: "Create Video Messages",
                description: "Record video messages up to 3 minutes to capture moments in motion",
                color: "brutalist-card-blue",
                textColor: "text-white"
              },
              {
                title: "Set Future Dates",
                description: "Choose exactly when your capsule opens - days, months, or years in the future",
                color: "brutalist-card-black",
                textColor: "text-white"
              },
              {
                title: "Secure & Private",
                description: "Your memories are encrypted and protected with enterprise-grade security",
                color: "brutalist-card-white",
                textColor: "text-black"
              }
            ].map((feature, index) => (
              <div key={index} className={`brutalist-card ${feature.color} p-8 hover:animate-brutalist-pop`}>
                <h3 className={`text-xl font-black mb-4 font-retro uppercase ${feature.textColor}`}>
                  {feature.title}
                </h3>
                <p className={`text-base leading-relaxed font-bold ${feature.textColor}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brutalist How It Works Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-4xl font-black tracking-tight text-black mb-6 font-retro uppercase">
              How It Works
            </h2>
            <p className="text-xl text-black font-bold leading-relaxed">
              Creating your time capsule is simple and fun
            </p>
          </div>
          
          <div className="grid gap-12 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create Your Capsule",
                description: "Write a message, upload photos, or record audio/video. Add recipients and set a password if you want.",
                color: "brutalist-card-blue",
                textColor: "text-white"
              },
              {
                step: "02", 
                title: "Choose Opening Date",
                description: "Pick exactly when your capsule should open - from tomorrow to 20 years in the future.",
                color: "brutalist-card-black",
                textColor: "text-white"
              },
              {
                step: "03",
                title: "Receive & Open",
                description: "Get notified when it's time to open. Experience the joy of rediscovering your past self.",
                color: "brutalist-card-white",
                textColor: "text-black"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className={`brutalist-card ${step.color} p-8 mb-6`}>
                  <div className={`text-6xl font-black mb-4 font-retro ${step.textColor}`}>{step.step}</div>
                  <h3 className={`text-xl font-black mb-4 font-retro uppercase ${step.textColor}`}>{step.title}</h3>
                  <p className={`text-base font-bold leading-relaxed ${step.textColor}`}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brutalist CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black tracking-tight mb-6 font-retro uppercase text-blue">
            Ready to Create Your First Time Capsule?
          </h2>
          <p className="text-xl font-bold mb-12 max-w-2xl mx-auto">
            Join thousands of people preserving their memories for the future. 
            Start your journey today for just $1.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="brutalist-button brutalist-button-primary text-lg px-8 py-4">
              <Link href="/create" className="flex items-center gap-3 no-underline text-inherit">
                <Zap className="h-5 w-5" />
                Create Time Capsule Now
              </Link>
            </button>
            
            <button className="brutalist-button brutalist-button-secondary text-lg px-8 py-4">
              <Link href="/gallery" className="flex items-center gap-3 no-underline text-inherit">
                <Heart className="h-5 w-5" />
                Explore Public Gallery
              </Link>
            </button>
          </div>
        </div>
      </section>

      {/* Brutalist Footer */}
      <footer className="bg-white border-t-4 border-black py-16">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center bg-white border-3 border-black shadow-brutalist overflow-hidden">
                  <Image 
                    src="/time_capsule.png" 
                    alt="Time Capsule Creator Logo" 
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-black text-black font-retro uppercase">Time Capsule</span>
              </div>
              <p className="text-black font-bold mb-6 max-w-md">
                Preserve your memories for the future. Create digital time capsules that open exactly when you want them to.
              </p>
              <div className="flex gap-4">
                {["Twitter", "Instagram", "TikTok"].map((social) => (
                  <button key={social} className="brutalist-badge brutalist-badge-black">
                    {social}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-black text-black mb-4 font-retro uppercase">Product</h3>
              <ul className="space-y-2">
                {["Features", "Pricing", "Security", "API"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-black font-bold hover:text-blue transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-black text-black mb-4 font-retro uppercase">Support</h3>
              <ul className="space-y-2">
                {["Help Center", "Contact", "Privacy", "Terms"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-black font-bold hover:text-blue transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t-3 border-black mt-12 pt-8 text-center">
            <p className="text-black font-bold">
              © 2024 Time Capsule. Made with <Heart className="inline h-4 w-4 text-blue" /> for preserving memories.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
