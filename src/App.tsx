import {useCallback, useState} from 'react';
import {ARExperience} from './components/ARExperience';
import {ClosingScreen} from './components/ClosingScreen';
import {InstructionsScreen} from './components/InstructionsScreen';
import {SplashScreen} from './components/SplashScreen';
import {DEFAULT_EXPERIENCE_CONTENT} from './config/experienceContent';
import type {AppScreen, ExperienceContentConfig} from './types';

export function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [content, setContent] = useState<ExperienceContentConfig>(
    DEFAULT_EXPERIENCE_CONTENT
  );

  const handleUpdateContent = useCallback(
    (patch: Partial<ExperienceContentConfig>) => {
      setContent((prev) => ({...prev, ...patch}));
    },
    []
  );

  if (screen === 'instructions') {
    return (
      <InstructionsScreen
        content={content}
        onStartCamera={() => setScreen('ar')}
        onBack={() => setScreen('splash')}
        onUpdateContent={handleUpdateContent}
      />
    );
  }

  if (screen === 'ar') {
    return (
      <ARExperience
        content={content}
        onUpdateContent={handleUpdateContent}
        onFinishExperience={() => setScreen('closing')}
        onBackToInstructions={() => setScreen('instructions')}
      />
    );
  }

  if (screen === 'closing') {
    return (
      <ClosingScreen
        content={content}
        onWatchAgainInAR={() => setScreen('ar')}
        onBackToStart={() => setScreen('splash')}
      />
    );
  }

  return (
    <SplashScreen
      content={content}
      onRevealStory={() => setScreen('instructions')}
    />
  );
}
