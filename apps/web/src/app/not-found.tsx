export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="text-center max-w-sm">
        <div
          className="text-8xl font-light mb-6"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#e7e5e4' }}
        >
          404
        </div>
        <h1
          className="text-2xl font-light text-stone-800 mb-3"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Страница не найдена
        </h1>
        <p className="text-stone-400 text-sm mb-8">
          Запрашиваемая страница не существует или была перемещена
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)' }}
        >
          На главную
        </a>
      </div>
    </div>
  );
}
