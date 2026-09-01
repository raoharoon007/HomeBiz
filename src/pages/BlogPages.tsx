import React from 'react';
import { usePathname, Link } from '../lib/navigation';
import { Storage } from '../lib/storage';
import { BlogPost } from '../types';
import { Clock, User, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export function BlogPage() {
  const posts = Storage.getBlogPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
          Community Stories & Tips
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
          HomeBiz Stories & Inspiration
        </h1>
        <p className="text-xs sm:text-sm text-[#665d55]">
          Read creator spotlights, party planning guides, culinary trends, and micro-business growth playbooks from Pakistan and Australia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="bg-white rounded-3xl overflow-hidden border border-[#e3e2e1] hover:border-[#003527] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="h-48 overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 space-y-2">
                <span className="text-[10px] font-bold bg-[#FFF1E7] text-[#735c00] px-2.5 py-0.5 rounded-full">
                  {post.category}
                </span>
                <h3 className="font-bold text-base text-[#1a1c1c] group-hover:text-[#003527] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-[#404944] line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 border-t border-[#f4f3f2] flex items-center justify-between text-[11px] text-[#665d55]">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-[#003527]" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#003527]" />
                {post.readTime}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BlogPostPage() {
  const pathname = usePathname();
  const slug = pathname.replace('/blog/', '').split('/')[0];
  const post = Storage.getBlogPostBySlug(slug) || Storage.getBlogPosts()[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003527] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Articles</span>
        </Link>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-bold bg-[#FFF1E7] text-[#735c00] px-3 py-1 rounded-full">
          {post.category}
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans'] leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-[#665d55] pt-2">
          <span>By {post.author}</span>
          <span>•</span>
          <span>{new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden shadow-md">
        <img src={post.coverImage} alt={post.title} className="w-full h-80 object-cover" />
      </div>

      <div className="bg-white rounded-3xl p-8 border border-[#e3e2e1] shadow-xs space-y-6 text-sm text-[#404944] leading-relaxed">
        <p className="font-semibold text-base text-[#1a1c1c] leading-relaxed">
          {post.excerpt}
        </p>

        <p>
          In recent years, Pakistan and Australia have seen an unprecedented wave of home micro-entrepreneurs. Women and artisans are transforming home kitchens and sewing tables into flourishing commercial enterprises. Powered by platforms like HomeBiz, local creators can reach genuine customers across major cities in both nations.
        </p>

        <h3 className="text-lg font-bold text-[#1a1c1c]">Why Supporting Home Businesses Matters</h3>
        <p>
          When you order a bespoke wedding cake, organic chemical-free henna cones, or slow-cooked Hyderabadi Dum Biryani from a verified home creator, you're directly fostering financial independence and artisanal authenticity. Every order has personal love and rigorous hygiene backing it.
        </p>

        <div className="p-6 bg-[#b0f0d6]/20 border border-[#95d3ba]/40 rounded-2xl text-xs text-[#003527] space-y-2">
          <span className="font-bold block text-sm">💡 Pro Tip for Customers</span>
          <p>
            Always message the creator 3 to 4 days ahead of large event celebrations to guarantee slot availability and discuss custom theme colors.
          </p>
        </div>
      </div>
    </div>
  );
}
