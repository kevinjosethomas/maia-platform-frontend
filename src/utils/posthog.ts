import { PostHog } from 'posthog-node'

// NOTE: This is a Node.js client for sending events from the server side to PostHog.
export default function PostHogClient(): PostHog {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })
  return posthogClient
}
