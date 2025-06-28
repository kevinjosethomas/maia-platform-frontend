import Head from 'next/head'
import Link from 'next/link'

import { Post } from 'src/types'
import { getSortedPostsData } from 'src/blog/posts'

export default function Blog({ posts }: { posts: Post[] }) {
  return (
    <div className="mx-auto flex h-full w-[90%] flex-col items-start justify-center gap-5 py-[10%] md:py-[2%]">
      <Head>
        <title>Blog – Maia Chess</title>
        <meta
          name="description"
          content="Maia Chess is in beta! Sign up to get access"
        />
      </Head>
      <h1 className="text-4xl font-bold">Blog</h1>
      <div className="flex w-full flex-col gap-6 overflow-x-hidden">
        {posts.map((post, index) => (
          <Link href={`/blog/${post.id}`} key={index}>
            <div className="flex w-full cursor-pointer flex-col gap-2 overflow-hidden hover:opacity-80 md:w-auto md:max-w-2xl">
              <div className="flex flex-col">
                <p>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <h2 className="text-2xl font-semibold">{post.title}</h2>
                <p>{post.excerpt}</p>
              </div>
              <div className="no-scrollbar flex items-center gap-2 overflow-x-scroll">
                {post.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center gap-2 rounded-sm bg-background-1 px-3 py-1"
                  >
                    <div className="h-2 w-2 rounded-full bg-human-3" />
                    <p className="whitespace-nowrap text-sm text-secondary">
                      {tag}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export async function getStaticProps() {
  const posts = getSortedPostsData()
  return {
    props: {
      posts,
    },
  }
}
