import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts.js';

export default function BlogIndexPage() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">SageSet Blog</h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">Practical articles on workout planning, nutrition logging, and building a routine that fits your schedule and equipment.</p>
        <ul className="mt-10 space-y-8">
          {blogPosts.map((post) => (
            <li key={post.slug} className="border-b border-gray-100 pb-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">{post.pillar}</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                <Link to={`/blog/${post.slug}`} className="hover:text-sage-700 transition-colors">{post.title}</Link>
              </h2>
              <p className="mt-2 text-base leading-7 text-gray-600">{post.description}</p>
              <Link to={`/blog/${post.slug}`} className="mt-3 inline-block text-sm font-semibold text-sage-700 hover:text-sage-800">
                Read more &rarr;
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
