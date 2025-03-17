import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local from parent directory
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const parentEnvPath = path.join(__dirname, '..', '.env.local')
config({ path: parentEnvPath })

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  env: {
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    NEXT_PUBLIC_LIVEKIT_API_KEY: process.env.NEXT_PUBLIC_LIVEKIT_API_KEY,
    NEXT_PUBLIC_LIVEKIT_API_SECRET: process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
