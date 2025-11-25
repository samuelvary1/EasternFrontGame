// Save and load game state using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = '@eastern_front_save';

export async function saveGameState(gameState) {
  try {
    const jsonValue = JSON.stringify(gameState);
    await AsyncStorage.setItem(SAVE_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving game:', error);
    return false;
  }
}

export async function loadGameState() {
  try {
    const jsonValue = await AsyncStorage.getItem(SAVE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error loading game:', error);
    return null;
  }
}

export async function deleteSave() {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
    return true;
  } catch (error) {
    console.error('Error deleting save:', error);
    return false;
  }
}

export async function hasSavedGame() {
  try {
    const jsonValue = await AsyncStorage.getItem(SAVE_KEY);
    return jsonValue != null;
  } catch (error) {
    return false;
  }
}
