import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'QazShaqyru — цифровые приглашения для тои и торжеств';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        
      >
        <div
          
        />
        <div
          
        />
        <div
          
        >
          QazShaqyru
        </div>
        <div
          
        >
          Цифровые приглашения для тои и торжеств
        </div>
        <div
          
        >
          Создайте за 5 минут · Казахстан
        </div>
      </div>
    ),
    { ...size },
  );
}
