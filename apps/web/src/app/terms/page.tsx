export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b" style={{ borderColor: '#e7e5e4' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg font-medium text-stone-800" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Invito
            </span>
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1
          className="text-3xl font-light text-stone-900 mb-8"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Условия использования
        </h1>

        <div className="prose prose-stone max-w-none space-y-6 text-sm text-stone-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">1. Общие положения</h2>
            <p>
              Сервис Invito (далее — «Сервис») предоставляет возможность создания и отправки цифровых приглашений на праздничные мероприятия. Используя Сервис, вы соглашаетесь с настоящими условиями.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">2. Регистрация</h2>
            <p>
              Для использования Сервиса требуется регистрация через номер телефона. Вы несёте ответственность за сохранность вашего аккаунта и所有 действий, совершённых с его использованием.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">3. Создание приглашений</h2>
            <p>
              Вы можете создавать приглашения для личных мероприятий. Запрещено использование Сервиса для распространения спама, оскорбительного или незаконного контента.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">4. Конфиденциальность</h2>
            <p>
              Мы собираем только данные, необходимые для работы Сервиса: номер телефона, данные приглашений и ответы гостей. Подробнее — в Политике конфиденциальности.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">5. Ответственность</h2>
            <p>
              Сервис предоставляется «как есть». Мы не несём ответственности за перерывы в работе, потерю данных или действия третьих лиц.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">6. Контакты</h2>
            <p>
              По вопросам обращайтесь: support@invito.kz
            </p>
          </section>

          <p className="text-stone-400 text-xs pt-4">
            Действует с 1 января 2026 года
          </p>
        </div>
      </main>
    </div>
  );
}
