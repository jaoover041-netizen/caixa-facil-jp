import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, X, KeyRound, AlertCircle } from 'lucide-react';
import { verifyAdminCredential } from '../utils/security';
import { sounds } from '../utils/sound';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Autorização Administrativa',
  description = 'Digite a senha do administrador para liberar esta ação.'
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setShowPassword(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPassword = password.trim();
    if (!cleanPassword) {
      setErrorMsg('Informe a senha para continuar.');
      sounds.error();
      return;
    }

    const isValid = verifyAdminCredential(cleanPassword);
    if (isValid) {
      sounds.cashRegisterDing();
      onSuccess();
      onClose();
    } else {
      sounds.error();
      setErrorMsg('Senha incorreta. Acesso não autorizado.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleDigit = (digit: string) => {
    setPassword((prev) => prev + digit);
    setErrorMsg('');
  };

  const handleBackspace = () => {
    setPassword((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPassword('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-neutral-800 border-t-2 border-t-amber-400 rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                {title}
              </h3>
              <p className="text-[10px] text-neutral-400">Acesso Restrito</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-300 leading-relaxed">
          {description}
        </p>

        {/* Password input form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Digite a senha..."
              autoComplete="off"
              className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-xl pl-9 pr-10 py-2.5 text-center font-mono tracking-widest text-lg text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg p-2 font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick POS Touch Pinpad */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleDigit(n)}
                className="py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-black border border-neutral-800 hover:border-neutral-700 rounded-lg font-display text-sm font-bold text-neutral-200 transition-colors cursor-pointer"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-lg font-display text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-black border border-neutral-800 hover:border-neutral-700 rounded-lg font-display text-sm font-bold text-neutral-200 transition-colors cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-lg font-display text-xs transition-colors cursor-pointer flex items-center justify-center"
            >
              ⌫
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display text-xs uppercase transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2.5 px-3 rounded-xl bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-display font-bold uppercase text-xs shadow-[0_0_15px_rgba(255,193,7,0.3)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Autorizar</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
