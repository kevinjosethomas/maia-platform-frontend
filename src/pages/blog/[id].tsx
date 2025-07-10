import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { GetStaticPaths, GetStaticProps } from 'next'

import { Post } from 'src/types'
import { Markdown } from 'src/components'
import { getSortedPostsData, getPostData } from 'src/blog/posts'

interface BlogPostProps {
  post: Post
}

const BlogPost = ({ post }: BlogPostProps) => {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Loading...</div>
  }

  return (
    <div className="mx-auto flex h-full w-[80ch] flex-col items-start justify-center gap-5 py-[10%] md:py-[2%]">
      <Head>
        <title>Blog – Maia Chess</title>
        <meta
          name="description"
          content="Maia Chess is in beta! Sign up to get access"
        />
      </Head>
      <div className="flex w-full flex-col items-center justify-center overflow-x-hidden">
        <div className="mb-8 flex w-full flex-col gap-2">
          <Link href="/blog">
            <p className="hover:opacity-75">← Go back</p>
          </Link>
          <h1 className="text-4xl font-bold">{post.title}</h1>
          <div className="flex items-center gap-4">
            <p>
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            {post.github && (
              <a
                href={post.github}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                GitHub
              </a>
            )}
            {post.arxiv && (
              <a
                href={post.arxiv}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                arXiv
              </a>
            )}
            {post.journal && <p>{post.journal}</p>}
          </div>
          <div className="no-scrollbar mt-1 flex items-center gap-2 overflow-x-scroll">
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
        <div className="prose-xl prose-invert w-full max-w-[80ch] leading-relaxed prose-headings:mb-2 prose-a:text-human-2 hover:prose-a:underline prose-ul:list-inside prose-ul:list-disc prose-li:text-sm prose-hr:my-8 prose-hr:opacity-20">
          <Markdown>{post.content}</Markdown>
        </div>
      </div>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getSortedPostsData()
  const paths = posts.map((post) => ({
    params: { id: post.id },
  }))

  return { paths, fallback: true }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = getPostData(params?.id as string)

  return {
    props: {
      post,
    },
  }
}

export default BlogPost
