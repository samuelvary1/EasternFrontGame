// Initial Ukrainian brigades - Expanded for larger map

export const initialBrigades = [
  // KYIV DEFENSE
  {
    id: 'brigade_1',
    name: '93rd Mechanized Brigade',
    type: 'mechanized',
    strength: 85,
    morale: 90,
    supply: 80,
    location: 'kyiv',
    droneCount: 2,
    stance: 'mobile defense',
    experience: 70,
    card: '🂡', // Ace of Spades
  },
  {
    id: 'brigade_2',
    name: '1st Tank Brigade',
    type: 'armor',
    strength: 75,
    morale: 85,
    supply: 70,
    location: 'kyiv',
    droneCount: 1,
    stance: 'hold',
    experience: 75,
    card: '🂮', // King of Spades
  },
  {
    id: 'brigade_3',
    name: 'Territorial Defense - Kyiv',
    type: 'territorial defense',
    strength: 65,
    morale: 95,
    supply: 85,
    location: 'kyiv',
    droneCount: 0,
    stance: 'hold',
    experience: 50,
    card: '🂭', // Queen of Spades
  },
  
  // NORTHERN DEFENSE
  {
    id: 'brigade_4',
    name: '72nd Mechanized Brigade',
    type: 'mechanized',
    strength: 70,
    morale: 85,
    supply: 75,
    location: 'chernihiv',
    droneCount: 2,
    stance: 'mobile defense',
    experience: 65,
  },
  {
    id: 'brigade_5',
    name: 'Territorial Defense - Chernihiv',
    type: 'territorial defense',
    strength: 60,
    morale: 90,
    supply: 70,
    location: 'chernihiv',
    droneCount: 1,
    stance: 'hold',
    experience: 45,
  },
  
  // EASTERN DEFENSE
  {
    id: 'brigade_6',
    name: '92nd Mechanized Brigade',
    type: 'mechanized',
    strength: 80,
    morale: 85,
    supply: 75,
    location: 'kharkiv',
    droneCount: 2,
    stance: 'mobile defense',
    experience: 80,
  },
  {
    id: 'brigade_7',
    name: 'Territorial Defense - Kharkiv',
    type: 'territorial defense',
    strength: 70,
    morale: 90,
    supply: 80,
    location: 'kharkiv',
    droneCount: 1,
    stance: 'hold',
    experience: 55,
  },
  {
    id: 'brigade_8',
    name: '54th Mechanized Brigade',
    type: 'mechanized',
    strength: 75,
    morale: 85,
    supply: 70,
    location: 'donbas',
    droneCount: 2,
    stance: 'mobile defense',
    experience: 85,
  },
  
  // SOUTHERN DEFENSE
  {
    id: 'brigade_9',
    name: '28th Mechanized Brigade',
    type: 'mechanized',
    strength: 70,
    morale: 80,
    supply: 75,
    location: 'zaporizhzhia',
    droneCount: 1,
    stance: 'mobile defense',
    experience: 60,
    card: '🃋', // Jack of Hearts
  },
  {
    id: 'brigade_10',
    name: 'Azov Regiment',
    type: 'mechanized',
    strength: 75,
    morale: 95,
    supply: 65,
    location: 'mariupol',
    droneCount: 2,
    stance: 'hold',
    experience: 75,
    card: '🃊', // 10 of Hearts
  },
  
  // WESTERN RESERVE
  {
    id: 'brigade_11',
    name: '80th Air Assault Brigade',
    type: 'airborne',
    strength: 80,
    morale: 90,
    supply: 85,
    location: 'lviv',
    droneCount: 2,
    stance: 'mobile defense',
    experience: 70,
    card: '🃑', // Ace of Diamonds
  },
  {
    id: 'brigade_12',
    name: '10th Mountain Assault Brigade',
    type: 'mechanized',
    strength: 75,
    morale: 85,
    supply: 90,
    location: 'lviv',
    droneCount: 1,
    stance: 'mobile defense',
    experience: 65,
    card: '🃞', // King of Diamonds
  },
];
