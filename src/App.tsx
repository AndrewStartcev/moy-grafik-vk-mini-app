import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { AppIcon } from './components/AppIcon';
import { CalendarScreen } from './features/calendar/CalendarScreen';
import { Onboarding } from './features/onboarding/Onboarding';
import { SettingsScreen } from './features/settings/SettingsScreen';
import type { ScheduleConfigV1 } from './domain/schedule/types';
import { analytics } from './services/analytics';
import { scheduleStorage } from './services/storage';

type Screen = 'calendar' | 'settings' | 'onboarding';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    analytics.track('app_error', { message: error.message, stack: info.componentStack?.slice(0, 500) });
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="screen fatal-screen">
          <div className="fatal-card">
            <div className="fatal-icon" aria-hidden="true"><CircleAlert size={26} /></div>
            <h1>Что-то пошло не так</h1>
            <p>Перезапусти приложение. Сохранённый график останется на месте.</p>
            <button type="button" className="primary-html-button" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function Application() {
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleConfigV1 | null>(null);
  const [screen, setScreen] = useState<Screen>('onboarding');

  useEffect(() => {
    let active = true;
    analytics.track('app_open');

    const bootstrap = async () => {
      try {
        const saved = await scheduleStorage.load();
        if (!active) return;

        setSchedule(saved);
        setScreen(saved ? 'calendar' : 'onboarding');
        analytics.track('app_ready', { has_schedule: Boolean(saved) });
        if (!saved) analytics.track('onboarding_open');
      } catch (error) {
        if (!active) return;

        setSchedule(null);
        setScreen('onboarding');
        analytics.track('app_error', {
          message: error instanceof Error ? error.message : 'startup_failed',
        });
        analytics.track('onboarding_open');
      } finally {
        if (active) setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const persist = (next: ScheduleConfigV1) => {
    setSchedule(next);
    void scheduleStorage.save(next);
  };

  const create = (next: ScheduleConfigV1) => {
    persist(next);
    setScreen('calendar');
  };

  const reset = () => {
    setSchedule(null);
    setScreen('onboarding');
    void scheduleStorage.clear();
    analytics.track('onboarding_open');
  };

  if (loading) {
    return (
      <main className="screen loading-screen">
        <AppIcon size={68} className="loading-app-icon" />
        <strong>Мой график</strong>
        <span className="loading-spinner" aria-label="Загрузка" />
      </main>
    );
  }

  if (screen === 'onboarding') {
    return <Onboarding onCreate={create} />;
  }

  if (!schedule) {
    return <Onboarding onCreate={create} />;
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        config={schedule}
        onBack={() => setScreen('calendar')}
        onChange={persist}
        onReconfigure={() => {
          analytics.track('onboarding_open');
          setScreen('onboarding');
        }}
        onReset={reset}
      />
    );
  }

  return (
    <CalendarScreen
      config={schedule}
      onChange={persist}
      onOpenSettings={() => {
        analytics.track('settings_open');
        setScreen('settings');
      }}
    />
  );
}

export function App() {
  return (
    <AppErrorBoundary>
      <div className="app-shell">
        <Application />
      </div>
    </AppErrorBoundary>
  );
}
