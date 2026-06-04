import Link from 'next/link'
import { ProductCatalog } from '@/components/product/ProductCatalog'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'

export default async function Home() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-sky-50 pt-16 pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-500 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            🧶 Handmade with love
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-gray-800 leading-tight mb-6">
            Cozy, Cute &<br />
            <span className="text-pink-300">Handcrafted</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Each piece is made to order with premium yarn. From amigurumi to bags — find something uniquely yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="#catalog"
              className="px-8 py-3 bg-pink-200 text-gray-800 font-medium rounded-full hover:bg-pink-300 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="#about"
              className="px-8 py-3 bg-sky-100 text-gray-800 font-medium rounded-full hover:bg-sky-200 transition-colors"
            >
              About Me
            </Link>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-pink-100 rounded-full opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-sky-100 rounded-full opacity-50 blur-3xl pointer-events-none" />
      </section>

      {/* Features row */}
      <section className="border-y border-pink-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: '✂️', label: 'Made to Order' },
            { icon: '🌿', label: 'Premium Yarn' },
            { icon: '📦', label: 'Tracked Shipping' },
            { icon: '💌', label: 'Gift Wrapping' },
          ].map(f => (
            <div key={f.label} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{f.icon}</span>
              <span className="text-sm font-medium text-gray-600">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <ProductCatalog initialProducts={(products as Product[]) ?? []} />
      </section>

      {/* About */}
      <section id="about" className="bg-gradient-to-br from-sky-50 to-pink-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-800 mb-6">Made by Hand, Sent with Love</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Hi! I&apos;m the maker behind Cozy Loops. I started crocheting as a hobby and fell in love with creating
            cozy, adorable things. Every item in my shop is made by hand — no machines, just yarn, hooks, and lots of care.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Each order is made fresh for you, so please allow 1–2 weeks for production. I ship
            worldwide and always include a handwritten note. 💕
          </p>
        </div>
      </section>
    </>
  )
}
