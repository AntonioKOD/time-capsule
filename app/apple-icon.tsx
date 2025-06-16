import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1E90FF',
          border: '8px solid #000000',
          borderRadius: '32px',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            background: '#1E90FF',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '64px',
            fontFamily: 'system-ui',
          }}
        >
          T
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 