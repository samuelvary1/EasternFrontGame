// MainMenuScreen - entry point for the game

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameEngine } from '../engine/gameEngine';
import { useLanguage } from '../context/LanguageContext';
import { hasSavedGame } from '../storage/saveGame';
import { DIFFICULTY_LEVELS } from '../config/difficultySettings';
import ActionButton from '../components/ActionButton';

export default function MainMenuScreen({ navigation }) {
  const { startNewGame, loadGame, gameState } = useGameEngine();
  const { language, changeLanguage, t } = useLanguage();
  const [saveExists, setSaveExists] = useState(false);
  const [showFactionSelect, setShowFactionSelect] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState('ukraine');
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_LEVELS.NORMAL);

  useEffect(() => {
    checkSave();
  }, []);

  const checkSave = async () => {
    const exists = await hasSavedGame();
    setSaveExists(exists);
  };

  const handleNewGame = () => {
    setShowFactionSelect(true);
  };

  const handleFactionSelected = (faction) => {
    setSelectedFaction(faction);
    setShowFactionSelect(false);
    setShowDifficulty(true);
  };

  const handleStartWithDifficulty = () => {
    startNewGame(selectedDifficulty, selectedFaction);
    navigation.navigate('Campaign');
  };

  const handleResume = () => {
    navigation.navigate('Campaign');
  };

  const handleContinue = async () => {
    const loaded = await loadGame();
    if (loaded) {
      navigation.navigate('Campaign');
    }
  };

  const handleHowToPlay = () => {
    alert(
      'EASTERN FRONT - Operational Wargame\n\n' +
      'Choose Ukraine or Russia and manage your forces in a strategic campaign.\n\n' +
      'KEY MECHANICS:\n' +
      '• Manage brigade Strength, Morale, and Supply\n' +
      '• Move brigades between adjacent regions\n' +
      '• Change stances (hold, mobile defense, counterattack, fallback)\n' +
      '• Attack enemy-held regions\n' +
      '• Protect supply routes and key objectives\n\n' +
      'VICTORY:\n' +
      'Ukraine: Hold Kyiv for 20 turns\n' +
      'Russia: Capture Kyiv within 20 turns'
    );
  };

  if (showFactionSelect) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('mainMenu.selectFaction')}</Text>
          <Text style={styles.subtitle}>{t('mainMenu.chooseSide')}</Text>

          <TouchableOpacity
            style={[styles.factionCard, styles.ukraineCard]}
            onPress={() => handleFactionSelected('ukraine')}
          >
            <Text style={styles.factionFlag}>🇺🇦</Text>
            <Text style={styles.factionName}>{t('mainMenu.ukraine')}</Text>
            <Text style={styles.factionDescription}>
              {t('mainMenu.ukraineDescription')}
            </Text>
            <Text style={styles.factionObjective}>
              {t('mainMenu.ukraineVictory')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.factionCard, styles.russiaCard]}
            onPress={() => handleFactionSelected('russia')}
          >
            <Text style={styles.factionFlag}>🇷🇺</Text>
            <Text style={styles.factionName}>{t('mainMenu.russia')}</Text>
            <Text style={styles.factionDescription}>
              {t('mainMenu.russiaDescription')}
            </Text>
            <Text style={styles.factionObjective}>
              {t('mainMenu.russiaVictory')}
            </Text>
          </TouchableOpacity>

          <ActionButton
            title={t('mainMenu.cancel')}
            onPress={() => setShowFactionSelect(false)}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (showDifficulty) {
    const getDifficultyName = (levelId) => {
      const map = {
        'EASY': t('mainMenu.recruitName'),
        'NORMAL': t('mainMenu.veteranName'),
        'HARD': t('mainMenu.eliteName'),
      };
      return map[levelId] || levelId;
    };

    const getDifficultyDescription = (levelId) => {
      const map = {
        'EASY': t('mainMenu.recruitDescription'),
        'NORMAL': t('mainMenu.veteranDescription'),
        'HARD': t('mainMenu.eliteDescription'),
      };
      return map[levelId] || '';
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.difficultyContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.difficultyTitle} numberOfLines={1} adjustsFontSizeToFit>
              {t('mainMenu.difficulty')}
            </Text>
          </View>

          {Object.values(DIFFICULTY_LEVELS).map(level => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.difficultyCard,
                selectedDifficulty.id === level.id && styles.difficultyCardSelected
              ]}
              onPress={() => setSelectedDifficulty(level)}
            >
              <Text style={styles.difficultyName}>{getDifficultyName(level.id)}</Text>
              <Text style={styles.difficultyDescription}>{getDifficultyDescription(level.id)}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.buttonContainer}>
            <ActionButton
              title={t('mainMenu.start')}
              onPress={handleStartWithDifficulty}
              variant="primary"
            />
            <ActionButton
              title={t('mainMenu.cancel')}
              onPress={() => {
                setShowDifficulty(false);
                setShowFactionSelect(true);
              }}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{t('mainMenu.title').split('\n')[0]}</Text>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{t('mainMenu.title').split('\n')[1]}</Text>
        </View>
        <Text style={styles.subtitle}>{t('mainMenu.subtitle')}</Text>
        <Text style={styles.description}>{t('mainMenu.description')}</Text>

        <View style={styles.buttonContainer}>
          {gameState.gameStarted && (
            <ActionButton
              title={t('mainMenu.resume')}
              onPress={handleResume}
              variant="primary"
            />
          )}

          <ActionButton
            title={t('mainMenu.newCampaign')}
            onPress={handleNewGame}
            variant={gameState.gameStarted ? "secondary" : "primary"}
          />

          <ActionButton
            title={t('mainMenu.loadGame')}
            onPress={handleContinue}
            variant="secondary"
            disabled={!saveExists}
          />

          <ActionButton
            title={t('mainMenu.howToPlay')}
            onPress={handleHowToPlay}
            variant="secondary"
          />
        </View>

        <View style={styles.languageToggle}>
          <TouchableOpacity
            style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
            onPress={() => changeLanguage('en')}
          >
            <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageButton, language === 'ru' && styles.languageButtonActive]}
            onPress={() => changeLanguage('ru')}
          >
            <Text style={[styles.languageText, language === 'ru' && styles.languageTextActive]}>
              Русский
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a strategic simulation focusing on operational decisions and logistics.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  difficultyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 44,
    paddingHorizontal: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 60,
    textAlign: 'center',
    letterSpacing: 2,
  },
  difficultyTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#3b82f6',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 56,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  difficultyCard: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#374151',
    width: '100%',
    maxWidth: 350,
  },
  difficultyCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  difficultyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 8,
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  factionCard: {
    padding: 25,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 3,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  ukraineCard: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  russiaCard: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  factionFlag: {
    fontSize: 48,
    marginBottom: 10,
  },
  factionName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  factionDescription: {
    fontSize: 15,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  factionObjective: {
    fontSize: 13,
    color: '#fbbf24',
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  languageToggle: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#3b82f6',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  languageTextActive: {
    color: '#ffffff',
  },
});
