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
    <div className="mx-auto flex h-full w-[90%] flex-col items-start justify-center gap-5 py-[10%] md:py-[2%]">
      <Head>
        <title>Blog – Maia Chess</title>
        <meta
          name="description"
          content="Maia Chess is in beta! Sign up to get access"
        />
      </Head>
      <div className="flex w-full flex-col items-center justify-start overflow-x-hidden">
        <div className="flex flex-col gap-2 md:w-8/12">
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
        <div className="markdown-content w-full leading-relaxed md:w-8/12">
          <Markdown>{post.content}</Markdown>
        </div>
      </div>
      <style>{`
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
            margin-top: 0.8em;
            margin-bottom: 0.1em;
        }

        .markdown-content p {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
        }
      `}</style>
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
