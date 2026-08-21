import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import Marquee from '@/components/landing/Marquee'
import HowItWorks from '@/components/landing/HowItWorks'
import ConsolePreview from '@/components/landing/ConsolePreview'
import Features from '@/components/landing/Features'
import WebsiteScanSection from '@/components/landing/WebsiteScanSection'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <ConsolePreview />
        <Features />
        <WebsiteScanSection />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
