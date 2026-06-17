export default function PrivacyPage() {
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
          Политика конфиденциальности
        </h1>

        <div className="prose prose-stone max-w-none space-y-6 text-sm text-stone-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Какие данные мы собираем</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Номер телефона — для авторизации и отправки кодов подтверждения</li>
              <li>Данные приглашений — название, дата, место, тексты, шаблоны</li>
              <li>Данные гостей — имена, контактные данные, ответы на приглашения</li>
              <li>Технические данные — IP-адрес, User-Agent, журналы доступа</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Как мы используем данные</h2>
            <p>
              Данные используются исключительно для работы Сервиса: аутентификация, создание и отправка приглашений, обработка ответов гостей. Мы не продаём и не передаём персональные данные третьим лицам.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Хранение данных</h2>
            <p>
              Данные хранятся на защищённых серверах. Сессии автоматически истекают через 7 дней. Вы можете запросить удаление всех ваших данных, написав на support@invito.kz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Cookies</h2>
            <p>
              Мы используем cookies для авторизации (session_token) и запоминания языковых предпочтений. Вы можете отключить cookies в настройках браузера, но это ограничит функциональность.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Ваши права</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Получить копию ваших данных</li>
              <li>Исправить неточные данные</li>
              <li>Удалить ваш аккаунт и все данные</li>
              <li>Отозвать согласие на обработку данных</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Контакты</h2>
            <p>
              По вопросам конфиденциальности: support@invito.kz
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
