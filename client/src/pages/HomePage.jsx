import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Sliders, Upload, CheckCircle2, Star, ShieldCheck, Heart } from 'lucide-react';
import { apiRequest, formatPrice } from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    apiRequest('/products')
      .then((res) => {
        if (res.success) setProducts(res.products);
      })
      .catch((err) => console.error('Error loading products:', err))
      .finally(() => setLoading(false));
  }, []);

  const readyToWear = products.filter((p) => p.category === 'ready_to_wear');
  const customBlank = products.find((p) => p.isCustomizable) || products[0];

  return (
    <div className="space-y-24 sm:space-y-32 pb-20">
      {/* 3, 4, 5, 6, 7: Editorial Hero Section */}
      <section className="relative min-h-[82vh] flex items-center bg-[#FAFAF8] border-b border-[#E5E5E0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-full text-[11px] uppercase tracking-widest text-neutral-800">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              Heavyweight 240 GSM Combed Cotton
            </div>

            {/* Section 4 Headline */}
            <h1 className="font-editorial text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-neutral-900 leading-[1.05]">
              Made to Wear.<br />
              <span className="italic font-normal">Made by You.</span>
            </h1>

            {/* Section 5 Supporting Text */}
            <p className="text-neutral-600 text-sm sm:text-base max-w-xl font-sans leading-relaxed">
              Discover our curated drop of archival minimalist white tees, or step into our interactive Print-on-Demand Studio to design your own high-density graphic t-shirt on 240 GSM organic French Terry cotton.
            </p>

            {/* Section 6 & 7 CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                to="/shop"
                className="px-8 py-4 bg-black text-white hover:bg-neutral-800 transition-all text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 group rounded"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/customize"
                className="px-8 py-4 bg-white text-black border border-neutral-300 hover:border-black transition-all text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded shadow-sm"
              >
                <span>Create Your T-shirt</span>
                <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
              </Link>
            </div>

            <div className="pt-4 flex items-center gap-8 text-xs text-neutral-500 font-mono">
              <div>
                <strong className="text-neutral-900 block font-sans text-sm">240 GSM</strong>
                Boxy Drop Shoulder
              </div>
              <div className="h-6 w-[1px] bg-neutral-300" />
              <div>
                <strong className="text-neutral-900 block font-sans text-sm">300 DPI</strong>
                Fine DTG Pigment Inks
              </div>
              <div className="h-6 w-[1px] bg-neutral-300" />
              <div>
                <strong className="text-neutral-900 block font-sans text-sm">India Air</strong>
                3–5 Days Delivery
              </div>
            </div>
          </div>

          {/* Right Column: Real T-shirt Photography */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto aspect-[3/4] max-w-md bg-neutral-100 rounded-sm overflow-hidden border border-neutral-200 shadow-xl group">
              <img
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80"
                alt="Model wearing Blanc Atelier White 240 GSM Heavyweight T-Shirt"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 border border-neutral-200/80 rounded-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 block">Current Standard</span>
                  <p className="font-editorial text-sm font-semibold text-neutral-900">Optic White Heavyweight Tee</p>
                </div>
                <Link
                  to="/customize"
                  className="px-3 py-1.5 text-[11px] uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-colors rounded"
                >
                  Customise
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8: Featured Ready-to-Wear Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#E5E5E0] gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Curated Essentials</span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 mt-1">
              Ready-to-Wear Drop 01
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-semibold hover:text-neutral-600 inline-flex items-center gap-1.5"
          >
            View Full Catalogue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {readyToWear.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-neutral-300 rounded p-8 space-y-3 bg-neutral-50/50">
            <p className="font-editorial text-2xl italic text-neutral-500">New Collections Dropping Soon</p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Our ready-to-wear archive is currently being refreshed. In the meantime, craft your bespoke tee in our Print-on-Demand Studio.
            </p>
            <Link
              to="/customize"
              className="inline-block mt-2 px-6 py-2.5 bg-black text-white text-xs uppercase tracking-widest font-semibold rounded hover:bg-neutral-800 transition-colors"
            >
              Open Custom Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {readyToWear.slice(0, 3).map((product) => {
              const wishlisted = isInWishlist(product._id);
              return (
                <div key={product._id} className="group flex flex-col space-y-4">
                  <div className="block relative aspect-[4/5] bg-neutral-100 dark:bg-noir-subtle border border-neutral-200 dark:border-noir-border overflow-hidden rounded-sm">
                    <Link to={`/product/${product.slug}`} className="block w-full h-full">
                      <img
                        src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-noir-card/90 backdrop-blur-sm rounded-full text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
                      title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-noir-card/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase border border-neutral-200 dark:border-noir-border text-neutral-900 dark:text-neutral-100">
                      {product.fabric?.gsm || 240} GSM
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-editorial text-lg font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors">
                        <Link to={`/product/${product.slug}`}>{product.name}</Link>
                      </h3>
                      <span className="font-mono text-sm font-medium text-neutral-900">
                        {formatPrice(product.basePricePaise)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1">{product.shortDescription}</p>
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                          <span key={sz} className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 border border-neutral-200">
                            {sz}
                          </span>
                        ))}
                      </div>
                      <Link
                        to={`/product/${product.slug}`}
                        className="text-[11px] uppercase tracking-wider font-semibold hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 9 & 10: "Make It Yours" Customization Section & 3-Step Process */}
      <section className="bg-neutral-900 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">Interactive Studio</span>
            <h2 className="font-editorial text-4xl sm:text-5xl font-semibold leading-tight">
              Make It Yours. <br />
              <span className="italic font-normal text-neutral-300">Personalized Print-on-Demand.</span>
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Upload your own high-resolution artwork, build clean editorial typography, or personalize one of our minimalist templates. We inspect every pre-press file and print on 240 GSM pure cotton blanks.
            </p>
            <div className="pt-2">
              <Link
                to="/customize"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black text-xs uppercase tracking-widest font-semibold hover:bg-neutral-200 transition-colors rounded"
              >
                <span>Launch Custom Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Section 10: Three-Step Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-neutral-800">
            <div className="space-y-4 p-6 bg-neutral-800/40 border border-neutral-800 rounded-sm">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-mono text-sm font-bold text-white border border-neutral-700">
                01
              </div>
              <h3 className="font-editorial text-xl font-semibold">Choose Garment & Fit</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Select from optic white or vintage off-white heavy cotton. Pick your exact streetwear boxy size (S to XXL).
              </p>
            </div>

            <div className="space-y-4 p-6 bg-neutral-800/40 border border-neutral-800 rounded-sm">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-mono text-sm font-bold text-white border border-neutral-700">
                02
              </div>
              <h3 className="font-editorial text-xl font-semibold">Customize Live</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Position transparent PNGs, curate Swiss fonts, or apply curated templates on the front or back within our 12"x16" boundary.
              </p>
            </div>

            <div className="space-y-4 p-6 bg-neutral-800/40 border border-neutral-800 rounded-sm">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-mono text-sm font-bold text-white border border-neutral-700">
                03
              </div>
              <h3 className="font-editorial text-xl font-semibold">We Print & Dispatch</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Our atelier manually verifies DPI resolution, prints using pigment DTG, performs quality checks, and delivers to your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11: Real Catalogue Bestsellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 pb-4 border-b border-[#E5E5E0]">
          <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Community Favorites</span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 mt-1">
            Studio Bestsellers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.slice(1, 4).map((p) => (
            <div key={p._id} className="border border-neutral-200 bg-white p-4 space-y-3 rounded-sm hover:shadow-md transition-shadow">
              <Link to={`/product/${p.slug}`} className="block aspect-square bg-neutral-100 overflow-hidden">
                <img
                  src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80'}
                  alt={p.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <div className="flex justify-between items-start pt-2">
                <div>
                  <h4 className="font-editorial text-base font-semibold text-neutral-900">
                    <Link to={`/product/${p.slug}`}>{p.name}</Link>
                  </h4>
                  <p className="text-xs text-neutral-500">{p.fabric?.material || '100% Cotton'}</p>
                </div>
                <span className="font-mono text-sm font-semibold">{formatPrice(p.basePricePaise)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 12: Brand Story and Fabric Quality Information */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-y border-[#E5E5E0] bg-[#FAF9F5]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Material Integrity</span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 leading-tight">
              Why 240 GSM French Terry Matters for Indian College Creators.
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Standard commercial t-shirts in India are made from flimsy 160–180 GSM yarn that loses shape after two washes. At BLANC, every garment is knitted from 100% combed long-staple cotton weighing a hefty 240 GSM.
            </p>
            <ul className="space-y-3 text-xs text-neutral-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-900 flex-shrink-0" />
                <span><strong>No transparency:</strong> Pure white that stays opaque under direct sunlight.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-900 flex-shrink-0" />
                <span><strong>Structured collar:</strong> 1.25" heavy ribbed lycra neckband that refuses to sag.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neutral-900 flex-shrink-0" />
                <span><strong>Direct-to-Garment ink hold:</strong> Open-weave fiber absorbing pigment inks smoothly.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80"
              alt="Cotton fabric weave detail"
              className="aspect-square object-cover rounded-sm border border-neutral-300"
            />
            <img
              src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80"
              alt="Model wearing drop shoulder t-shirt"
              className="aspect-square object-cover rounded-sm border border-neutral-300"
            />
          </div>
        </div>
      </section>

      {/* 13: Genuine Customer Reviews / Creator Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Customer Notes</span>
          <h2 className="font-editorial text-3xl font-semibold text-neutral-900">From the Creators</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white border border-neutral-200 rounded-sm space-y-3">
            <div className="flex text-neutral-900">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed italic">
              "Ordered 25 custom tees for our college design club showcase. The canvas editor made it super easy to place our back graphic. Print quality is razor-sharp."
            </p>
            <div className="pt-2 text-xs">
              <strong className="text-neutral-900 block">Aarav M.</strong>
              <span className="text-neutral-500 text-[11px]">NID Ahmedabad</span>
            </div>
          </div>

          <div className="p-6 bg-white border border-neutral-200 rounded-sm space-y-3">
            <div className="flex text-neutral-900">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed italic">
              "The weight of the 240 GSM blank tee is insane. It fits exactly like high-end Japanese streetwear brands at one-fourth the price."
            </p>
            <div className="pt-2 text-xs">
              <strong className="text-neutral-900 block">Rhea S.</strong>
              <span className="text-neutral-500 text-[11px]">St. Xavier's Mumbai</span>
            </div>
          </div>

          <div className="p-6 bg-white border border-neutral-200 rounded-sm space-y-3">
            <div className="flex text-neutral-900">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed italic">
              "Delivered to Bangalore in 4 days. The typography print on the back has zero rubbery feeling. Definitely ordering again."
            </p>
            <div className="pt-2 text-xs">
              <strong className="text-neutral-900 block">Kabir V.</strong>
              <span className="text-neutral-500 text-[11px]">Christ University Bengaluru</span>
            </div>
          </div>
        </div>
      </section>

      {/* 14: Social Media Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Instagram</span>
            <h3 className="font-editorial text-2xl font-semibold">@blanc.atelier</h3>
          </div>
          <span className="text-xs font-mono text-neutral-500">Tagged by creators across India</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="aspect-square bg-neutral-100 overflow-hidden border border-neutral-200">
            <img src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80" alt="Instagram look 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="aspect-square bg-neutral-100 overflow-hidden border border-neutral-200">
            <img src="https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=600&q=80" alt="Instagram look 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="aspect-square bg-neutral-100 overflow-hidden border border-neutral-200">
            <img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80" alt="Instagram look 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="aspect-square bg-neutral-100 overflow-hidden border border-neutral-200">
            <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80" alt="Instagram look 4" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </section>
    </div>
  );
}
