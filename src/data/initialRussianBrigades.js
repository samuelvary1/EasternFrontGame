// Initial Russian brigades for player-controlled Russian campaign - Expanded

export const initialRussianBrigades = [
  // NORTHERN FRONT
  {
    id: 'ru_1_guards',
    name: '1st Guards Tank Army',
    type: 'armor',
    strength: 85,
    morale: 70,
    supply: 75,
    location: 'belarus_border',
    stance: 'offensive',
    droneCount: 4,
    experience: 65,
    card: '🄡', // Ace of Clubs
  },
  {
    id: 'ru_76_airborne',
    name: '76th Guards Air Assault Division',
    type: 'airborne',
    strength: 75,
    morale: 75,
    supply: 70,
    location: 'belarus_border',
    stance: 'offensive',
    droneCount: 4,
    experience: 70,
    card: '🄮', // King of Clubs
  },
  {
    id: 'ru_4_guards',
    name: '4th Guards Tank Division',
    type: 'armor',
    strength: 80,
    morale: 65,
    supply: 75,
    location: 'belarus_border',
    stance: 'offensive',
    droneCount: 4,
    experience: 60,
    card: '🄭', // Queen of Clubs
  },
  {
    id: 'ru_41_combined',
    name: '41st Combined Arms Army',
    type: 'mechanized',
    strength: 75,
    morale: 70,
    supply: 70,
    location: 'chernihiv',
    stance: 'offensive',
    droneCount: 3,
    experience: 55,
    card: '🃛', // Jack of Clubs
  },
  {
    id: 'ru_2_guards',
    name: '2nd Guards Motor Rifle Division',
    type: 'mechanized',
    strength: 70,
    morale: 65,
    supply: 75,
    location: 'chernihiv',
    stance: 'offensive',
    droneCount: 3,
    experience: 60,
    card: '🃚', // 10 of Clubs
  },
  
  // EASTERN FRONT
  {
    id: 'ru_1st_donetsk',
    name: '1st Army Corps (Donetsk)',
    type: 'mechanized',
    strength: 80,
    morale: 70,
    supply: 80,
    location: 'donbas',
    stance: 'offensive',
    droneCount: 3,
    experience: 75,
    card: '🃙', // 9 of Clubs
  },
  {
    id: 'ru_2nd_luhansk',
    name: '2nd Army Corps (Luhansk)',
    type: 'mechanized',
    strength: 75,
    morale: 70,
    supply: 75,
    location: 'donbas',
    stance: 'offensive',
    droneCount: 3,
    experience: 70,
    card: '🃘', // 8 of Clubs
  },
  {
    id: 'ru_58th_army',
    name: '58th Combined Arms Army',
    type: 'mechanized',
    strength: 70,
    morale: 65,
    supply: 70,
    location: 'sumy',
    stance: 'offensive',
    droneCount: 3,
    experience: 55,
    card: '🃝', // Queen of Diamonds
  },
  
  // SOUTHERN FRONT
  {
    id: 'ru_150_motorized',
    name: '150th Motor Rifle Division',
    type: 'mechanized',
    strength: 75,
    morale: 70,
    supply: 75,
    location: 'mariupol',
    stance: 'offensive',
    droneCount: 3,
    experience: 65,
    card: '🃛', // Jack of Diamonds
  },
  {
    id: 'ru_810_marines',
    name: '810th Naval Infantry Brigade',
    type: 'mechanized',
    strength: 70,
    morale: 75,
    supply: 70,
    location: 'kherson',
    stance: 'offensive',
    droneCount: 3,
    experience: 60,
    card: '🃚', // 10 of Diamonds
  },
  {
    id: 'ru_7_airborne',
    name: '7th Guards Air Assault Division',
    type: 'airborne',
    strength: 75,
    morale: 75,
    supply: 75,
    location: 'kherson',
    stance: 'offensive',
    droneCount: 4,
    experience: 70,
    card: '🃙', // 9 of Diamonds
  },
];
