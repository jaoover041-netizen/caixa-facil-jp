import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PDVScreen } from './components/PDVScreen';
import { TablesScreen } from './components/TablesScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { ProductsScreen } from './components/ProductsScreen';
import { ConfigScreen } from './components/ConfigScreen';
import { LoginScreen } from './components/LoginScreen';
import { SetupModal } from './components/SetupModal';
import { CashMovementModal } from './components/CashMovementModal';
import { CashClosingModal } from './components/CashClosingModal';

const POSMainApp: React.FC = () => {
  const { telaAtiva, config, toasts } = usePOS();
  
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [cashMovType, setCashMovType] = useState<'SUPRIMENTO' | 'SANGRIA' | null>(null);
  const [isClosingOpen, setIsClosingOpen] = useState(false);

  // If no config exists, prompt setup on first render
  React.useEffect(() => {
    if (!config) {
      setIsSetupOpen(true);
    }
  }, [config]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-amber-400 selection:text-black">
      
      {/* PWA / Web APK Install notification banner */}
      <PWAInstallBanner />

      {/* Top Bar Header */}
      {config && (
        <Header
          onOpenSuprimento={() => setCashMovType('SUPRIMENTO')}
          onOpenSangria={() => setCashMovType('SANGRIA')}
          onOpenFechamento={() => setIsClosingOpen(true)}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 w-full">
        {telaAtiva === 'login' && <LoginScreen onOpenSetup={() => setIsSetupOpen(true)} />}
        {telaAtiva === 'pdv' && <PDVScreen />}
        {telaAtiva === 'mesas' && <TablesScreen />}
        {telaAtiva === 'dash' && <DashboardScreen />}
        {telaAtiva === 'rel' && <ReportsScreen />}
        {telaAtiva === 'prod' && <ProductsScreen />}
        {telaAtiva === 'config' && <ConfigScreen />}
      </main>

      {/* Cash Movement Modals (Suprimento / Sangria) */}
      <CashMovementModal
        isOpen={cashMovType !== null}
        tipo={cashMovType || 'SUPRIMENTO'}
        onClose={() => setCashMovType(null)}
      />

      {/* Cash Closing Modal */}
      <CashClosingModal
        isOpen={isClosingOpen}
        onClose={() => setIsClosingOpen(false)}
      />

      {/* Setup / Onboarding Modal */}
      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
      />

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium shadow-2xl transition-all duration-300 pointer-events-auto text-center border ${
              t.tipo === 'erro'
                ? 'bg-[#180a0a] text-rose-300 border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)]'
                : t.tipo === 'sucesso'
                ? 'bg-[#0a180e] text-emerald-300 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-[#141414] text-amber-300 border-amber-500 shadow-[0_0_20px_rgba(255,193,7,0.3)]'
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>

    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSMainApp />
    </POSProvider>
  );
}
