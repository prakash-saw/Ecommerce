import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20 space-y-16">
      {/* Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <span className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">Our Ethos</span>
        <h1 className="font-editorial text-4xl sm:text-6xl font-semibold text-neutral-900 leading-tight">
          Heavyweight Cotton.<br />
          <span className="italic font-normal">Independent Expression.</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans pt-2">
          Founded in Bengaluru, BLANC ATELIER was created to bridge high-density streetwear silhouette standards with an intuitive, precision Print-on-Demand studio for Gen Z and collegiate creators across India.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs leading-relaxed">
        <div className="p-6 bg-white border border-neutral-200 rounded space-y-3">
          <span className="font-mono text-base font-bold text-neutral-900">240 GSM</span>
          <h3 className="font-editorial text-lg font-semibold text-neutral-900">No Flimsy Fabrics</h3>
          <p className="text-neutral-600">
            We exclusively knit with 100% combed long-staple cotton yarn. Every piece is bio-washed, pre-shrunk, and engineered to drape with an architectural streetwear silhouette.
          </p>
        </div>

        <div className="p-6 bg-white border border-neutral-200 rounded space-y-3">
          <Sparkles className="w-5 h-5 text-neutral-900" />
          <h3 className="font-editorial text-lg font-semibold text-neutral-900">Direct-to-Garment DTG</h3>
          <p className="text-neutral-600">
            Water-based Japanese pigment inks bond intimately into the fiber lattice. No peeling vinyl transfers, no stiff rubbery plastics.
          </p>
        </div>

        <div className="p-6 bg-white border border-neutral-200 rounded space-y-3">
          <Shield className="w-5 h-5 text-neutral-900" />
          <h3 className="font-editorial text-lg font-semibold text-neutral-900">Ethically Made in India</h3>
          <p className="text-neutral-600">
            Knitted and stitched in Tirupur, customized and dispatched from Indiranagar, Bangalore. Transparent pricing with zero hidden surcharges.
          </p>
        </div>
      </div>

      {/* Atelier Story Narrative */}
      <div className="bg-[#FAF9F5] border border-neutral-300 p-8 sm:p-12 rounded-sm space-y-6 text-neutral-800">
        <h2 className="font-editorial text-3xl font-semibold">The White T-Shirt Standard</h2>
        <p className="text-xs sm:text-sm leading-relaxed text-neutral-700">
          The plain white t-shirt is the most iconic garment in modern fashion, yet 95% of options available in India are transparent, cut poorly, or shrink irregularly in hot machine washes. We spent seven months perfecting our single jersey weight, balancing thermal comfort in Indian weather with the opaque density required for bold typography.
        </p>
        <p className="text-xs sm:text-sm leading-relaxed text-neutral-700">
          Whether you pick one of our archival ready-made drops or upload personal art in our Print-on-Demand Studio, every single t-shirt is pressed on the exact same heavyweight standard.
        </p>
        <div className="pt-4">
          <Link
            to="/customize"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 rounded transition-colors"
          >
            <span>Open Custom POD Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
