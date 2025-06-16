import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1E90FF',
          border: '2px solid #000000',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            background: '#1E90FF',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '16px',
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