import { useState } from 'react';
import { Player } from '@/data/store';
import Icon from '@/components/ui/icon';

interface LoginScreenProps {
  players: Player[];
  onLogin: (email: string, password: string, name: string) => string | null;
}

type Step = 'email' | 'login' | 'register';

function inputStyle(hasError: boolean) {
  return {
    background: 'hsl(var(--muted))',
    border: `1px solid ${hasError ? '#E53935' : 'hsl(var(--border))'}`,
    color: 'hsl(var(--foreground))',
  };
}

export default function LoginScreen({ players, onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const isExisting = players.some(p => p.email === email.trim().toLowerCase());

  function switchToLogin() {
    setError('');
    setPassword('');
    setConfirmPassword('');
    setStep('login');
  }

  function switchToRegister() {
    setError('');
    setPassword('');
    setConfirmPassword('');
    setStep('register');
  }

  function handleEmailNext() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Введите корректный email');
      return;
    }
    setError('');
    setStep(isExisting ? 'login' : 'register');
  }

  function handleLoginSubmit() {
    if (!password) { setError('Введите пароль'); return; }
    const err = onLogin(email.trim().toLowerCase(), password, '');
    if (err) setError(err);
  }

  function handleRegisterSubmit() {
    if (!name.trim()) { setError('Введите имя'); return; }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    if (password !== confirmPassword) { setError('Пароли не совпадают'); return; }
    const err = onLogin(email.trim().toLowerCase(), password, name.trim());
    if (err) setError(err);
  }

  function goBack() {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirm(false);
  }

  const inputClass = 'w-full text-sm pl-9 pr-10 py-2.5 rounded-lg outline-none';

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

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-xl p-6 space-y-4 animate-scale-in"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        {/* Step: email */}
        {step === 'email' && (
          <>
            <div>
              <div className="font-montserrat font-700 text-base text-foreground mb-1">Добро пожаловать</div>
              <div className="text-xs text-muted-foreground">Введите email для входа или регистрации</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-montserrat font-600 text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Icon name="Mail" size={15} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="your@email.com"
                  autoFocus
                  className={inputClass}
                  style={inputStyle(!!error)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailNext()}
                />
              </div>
              {error && <div className="text-xs" style={{ color: '#E53935' }}>{error}</div>}
            </div>

            <button
              onClick={handleEmailNext}
              className="w-full py-2.5 rounded-lg font-montserrat font-700 text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
            >
              Продолжить <Icon name="ArrowRight" size={15} />
            </button>
          </>
        )}

        {/* Step: login (existing user) */}
        {step === 'login' && (
          <>
            <div>
              <button onClick={goBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
                <Icon name="ArrowLeft" size={13} /> Назад
              </button>
              <div className="font-montserrat font-700 text-base text-foreground mb-1">Вход</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-montserrat font-600 text-muted-foreground uppercase tracking-wider">Пароль</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Icon name="Lock" size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoFocus
                  className={inputClass}
                  style={inputStyle(!!error)}
                  onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={15} />
                </button>
              </div>
              {error && <div className="text-xs" style={{ color: '#E53935' }}>{error}</div>}
            </div>

            <button
              onClick={handleLoginSubmit}
              className="w-full py-2.5 rounded-lg font-montserrat font-700 text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
            >
              Войти <Icon name="LogIn" size={15} />
            </button>

            <button
              onClick={switchToRegister}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-montserrat"
            >
              Нет аккаунта? <span style={{ color: 'var(--gold)' }}>Зарегистрироваться</span>
            </button>
          </>
        )}

        {/* Step: register (new user) */}
        {step === 'register' && (
          <>
            <div>
              <button onClick={goBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
                <Icon name="ArrowLeft" size={13} /> Назад
              </button>
              <div className="font-montserrat font-700 text-base text-foreground mb-1">Регистрация</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-montserrat font-600 text-muted-foreground uppercase tracking-wider">Имя и фамилия</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Icon name="User" size={15} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Иван Иванов"
                  autoFocus
                  className={inputClass}
                  style={inputStyle(!!error && !name.trim())}
                  onKeyDown={e => e.key === 'Enter' && handleRegisterSubmit()}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-montserrat font-600 text-muted-foreground uppercase tracking-wider">Пароль</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Icon name="Lock" size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Минимум 6 символов"
                  className={inputClass}
                  style={inputStyle(!!error && password.length < 6)}
                  onKeyDown={e => e.key === 'Enter' && handleRegisterSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={15} />
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <label className="text-xs font-montserrat font-600 text-muted-foreground uppercase tracking-wider">Повторите пароль</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Icon name="Lock" size={15} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className={inputClass}
                  style={inputStyle(!!error && password !== confirmPassword)}
                  onKeyDown={e => e.key === 'Enter' && handleRegisterSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name={showConfirm ? 'EyeOff' : 'Eye'} size={15} />
                </button>
              </div>
              {error && <div className="text-xs" style={{ color: '#E53935' }}>{error}</div>}
            </div>

            <button
              onClick={handleRegisterSubmit}
              className="w-full py-2.5 rounded-lg font-montserrat font-700 text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--gold)', color: 'hsl(var(--background))' }}
            >
              Зарегистрироваться <Icon name="UserPlus" size={15} />
            </button>

            <button
              onClick={switchToLogin}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-montserrat"
            >
              Уже есть аккаунт? <span style={{ color: 'var(--gold)' }}>Войти</span>
            </button>
          </>
        )}
      </div>

      <div className="mt-6 text-xs text-muted-foreground text-center">
        {step === 'email' && 'Новый аккаунт создаётся автоматически'}
        {step === 'login' && 'Аккаунт с этим email уже существует'}
        {step === 'register' && 'Создаём новый аккаунт'}
      </div>
    </div>
  );
}