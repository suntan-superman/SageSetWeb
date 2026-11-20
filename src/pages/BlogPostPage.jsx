import { Link, useParams } from 'react-router-dom';
import { getBlogPost } from '../data/blogPosts.js';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Post not found</h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">This article is not currently available.</p>
          <Link to="/blog" className="mt-8 inline-flex rounded-lg bg-sage-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sage-800">
            Back to the blog
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">{post.pillar}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">{post.title}</h1>
        <p className="mt-4 text-sm text-gray-500">{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div className="mt-8 space-y-5">
          {post.body.map((block, index) => (
            block.h ? (
              <h2 key={index} className="text-2xl font-semibold text-gray-900 pt-2">{block.h}</h2>
            ) : (
              <p key={index} className="text-base leading-7 text-gray-600">{block.p}</p>
            )
          ))}
        </div>
        <a
          href="/download"
          className="mt-10 inline-flex rounded-lg bg-sage-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sage-800"
        >
          Try SageSet
        </a>
        <div className="mt-6">
          <Link to="/blog" className="text-sm font-semibold text-sage-700 hover:text-sage-800">&larr; Back to the blog</Link>
        </div>
      </div>
    </article>
  );
}
