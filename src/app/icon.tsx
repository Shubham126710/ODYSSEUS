import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg' style={{ width: '100%', height: '100%' }}>
          <circle cx='50' cy='50' r='50' fill='#FF6B4A' />
          <circle cx='50' cy='50' r='44' stroke='#FFFDD0' strokeWidth='6' />
          <g transform='rotate(45 50 50)'>
            <path d='M50 8 L60 50 L40 50 Z' fill='#FFFDD0' />
            <path d='M50 92 L60 50 L40 50 Z' fill='#5D8246' />
            <circle cx='50' cy='50' r='8' fill='#FFFDD0' stroke='#5D8246' strokeWidth='4' />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  )
}
