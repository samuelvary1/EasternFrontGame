// PlayingCard component - displays playing card SVG images

import React from 'react';
import { View, StyleSheet } from 'react-native';

// Import all SVG cards as components
import AS from '../../assets/cards/AS.svg';
import KS from '../../assets/cards/KS.svg';
import QS from '../../assets/cards/QS.svg';
import JS from '../../assets/cards/JS.svg';
import TS from '../../assets/cards/TS.svg';
import NineS from '../../assets/cards/9S.svg';
import EightS from '../../assets/cards/8S.svg';
import SevenS from '../../assets/cards/7S.svg';
import SixS from '../../assets/cards/6S.svg';
import FiveS from '../../assets/cards/5S.svg';
import FourS from '../../assets/cards/4S.svg';
import ThreeS from '../../assets/cards/3S.svg';
import TwoS from '../../assets/cards/2S.svg';

import AH from '../../assets/cards/AH.svg';
import KH from '../../assets/cards/KH.svg';
import QH from '../../assets/cards/QH.svg';
import JH from '../../assets/cards/JH.svg';
import TH from '../../assets/cards/TH.svg';
import NineH from '../../assets/cards/9H.svg';
import EightH from '../../assets/cards/8H.svg';
import SevenH from '../../assets/cards/7H.svg';
import SixH from '../../assets/cards/6H.svg';
import FiveH from '../../assets/cards/5H.svg';
import FourH from '../../assets/cards/4H.svg';
import ThreeH from '../../assets/cards/3H.svg';
import TwoH from '../../assets/cards/2H.svg';

import AD from '../../assets/cards/AD.svg';
import KD from '../../assets/cards/KD.svg';
import QD from '../../assets/cards/QD.svg';
import JD from '../../assets/cards/JD.svg';
import TD from '../../assets/cards/TD.svg';
import NineD from '../../assets/cards/9D.svg';
import EightD from '../../assets/cards/8D.svg';
import SevenD from '../../assets/cards/7D.svg';
import SixD from '../../assets/cards/6D.svg';
import FiveD from '../../assets/cards/5D.svg';
import FourD from '../../assets/cards/4D.svg';
import ThreeD from '../../assets/cards/3D.svg';
import TwoD from '../../assets/cards/2D.svg';

import AC from '../../assets/cards/AC.svg';
import KC from '../../assets/cards/KC.svg';
import QC from '../../assets/cards/QC.svg';
import JC from '../../assets/cards/JC.svg';
import TC from '../../assets/cards/TC.svg';
import NineC from '../../assets/cards/9C.svg';
import EightC from '../../assets/cards/8C.svg';
import SevenC from '../../assets/cards/7C.svg';
import SixC from '../../assets/cards/6C.svg';
import FiveC from '../../assets/cards/5C.svg';
import FourC from '../../assets/cards/4C.svg';
import ThreeC from '../../assets/cards/3C.svg';
import TwoC from '../../assets/cards/2C.svg';

// Map emoji cards to SVG components
const cardComponents = {
  '🂡': AS, '🂮': KS, '🂭': QS, '🂫': JS, '🂪': TS, '🂩': NineS, '🂨': EightS, '🂧': SevenS,
  '🂦': SixS, '🂥': FiveS, '🂤': FourS, '🂣': ThreeS, '🂢': TwoS,
  '🃁': AH, '🃎': KH, '🃍': QH, '🃋': JH, '🃊': TH, '🃉': NineH, '🃈': EightH, '🃇': SevenH,
  '🃆': SixH, '🃅': FiveH, '🃄': FourH, '🃃': ThreeH, '🃂': TwoH,
  '🃑': AD, '🃞': KD, '🃝': QD, '🃛': JD, '🃚': TD, '🃙': NineD, '🃘': EightD, '🃗': SevenD,
  '🃖': SixD, '🃕': FiveD, '🃔': FourD, '🃓': ThreeD, '🃒': TwoD,
  '🃡': AC, '🃮': KC, '🃭': QC, '🃫': JC, '🃪': TC, '🃩': NineC, '🃨': EightC, '🃧': SevenC,
  '🃦': SixC, '🃥': FiveC, '🃤': FourC, '🃣': ThreeC, '🃢': TwoC,
};

export default function PlayingCard({ card, size = 'medium' }) {
  if (!card) return null;

  const CardSvg = cardComponents[card];
  if (!CardSvg) return null;

  const sizeStyles = {
    small: { width: 28, height: 40 },
    medium: { width: 36, height: 52 },
    large: { width: 50, height: 72 },
  };

  const cardSize = sizeStyles[size] || sizeStyles.medium;

  return (
    <View style={[styles.card, { width: cardSize.width, height: cardSize.height }]}>
      <CardSvg width="100%" height="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    overflow: 'hidden',
  },
});
