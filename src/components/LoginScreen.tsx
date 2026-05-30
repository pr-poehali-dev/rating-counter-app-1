import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface LoginScreenProps {
  onLogin: (email: string, name: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'email' | 'name'>('email');
  const [error, setError] = useState('');

  function handleEmailSubmit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Введите корректный email');
      return;
    }
    setError('');
    setStep('name');
  }

  function handleLogin() {
    if (!name.trim()) {
      setError('Введите ваше имя');
      return;
    }
    setError('');
    onLogin(email.trim().toLowerCase(), name.trim());
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-montserrat font-black text-2xl"
          style={{ background: 'var(--gold)', color: 'hsl(var(--background))', boxShadow: '0 0 32px rgba(245,166,35,0.3)' }}
        >
          S
        </div>
        <div className="text-center">
          <div className="font-montserrat font-black text-xl text-foreground tracking-wider">СТРАЙКБОЛ</div>
          <div className="text-xs text-muted-foreground mt-0.5">Рейтинговая система</div>
        </div>
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-sm rounded-xl p-6 space-y-4 animate-scale-in"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        {step === 'email' ? (
          <>
            <div>
              <div className="font-montserrat font-700 text-base text-foreground mb-1">Вход в систему</div>
              <div className="text-xs text-muted-foreground">Введите email для входа или регистрации</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-montserrat font-600 text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Icon name="Mail" size={15} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="your@email.com"
                  autoFocus
                  className="w-full text-sm pl-9 pr-3 py-2.5 rounded-lg outline-none"
                  style={{ background: 'hsl(var(--muted))', border: `1px solid ${error ? '#E53935' : 'hsl(var(--border))'}`, color: 'hsl(var(--foreground))' }}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                />
              </div>
              {error && <div className="text-xs" style={{ color: '#E53935' }}>{error}</div>}
            </div>

            <button
              onClick={handleEmailSubmit}
              className="w-full py-2.5 rounded-lg font-montserrat font-700 text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
            >
              Продолжить <Icon name="ArrowRight" size={15} />
            </button>
          </>
        ) : (
          <>
            <div>
              <button
                onClick={() => { setStep('email'); setError(''); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
              >
                <Icon name="ArrowLeft" size={13} /> Назад
              </button>
              <div className="font-montserrat font-700 text-base text-foreground mb-1">Как вас зовут?</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-montserrat font-600 text-muted-foreground uppercase tracking-wider">
                Имя и фамилия
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Icon name="User" size={15} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Иван Иванов"
                  autoFocus
                  className="w-full text-sm pl-9 pr-3 py-2.5 rounded-lg outline-none"
                  style={{ background: 'hsl(var(--muted))', border: `1px solid ${error ? '#E53935' : 'hsl(var(--border))'}`, color: 'hsl(var(--foreground))' }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {error && <div className="text-xs" style={{ color: '#E53935' }}>{error}</div>}
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-2.5 rounded-lg font-montserrat font-700 text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
            >
              Войти <Icon name="LogIn" size={15} />
            </button>
          </>
        )}
      </div>

      <div className="mt-6 text-xs text-muted-foreground text-center">
        Войдите, чтобы участвовать в играх и отслеживать свой рейтинг
      </div>
    </div>
  );
}
