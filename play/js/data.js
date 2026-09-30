/* Ink Cuisine: everything the game is made of. Cuisines and their dishes, the vibes, the people you can hire,
   the fit-out, the rival restaurants, the week's news and the Quill Guide's thresholds.
   Never reorder CUISINES, VIBES, CHEFS, SOUS or FOH: saved runs refer to them by position. Add new ones at the end. */
"use strict";

// The season: one Friday service a week. The Quill Guide comes out after the last one.
const WEEKS = 8;
const START = { till: 900, buzz: 15, rent: 180, tables: 4 };
const SERVICE = 150;          // seconds of doors open (6pm to 10pm)
const COURSES = ['starter', 'main', 'dessert'];
const MENU_SLOTS = ['starter', 'starter', 'main', 'main', 'main', 'dessert'];
const COURSE_NAME = { starter: 'Starter', main: 'Main', dessert: 'Dessert' };

// A dish: [name, icon, taste, wow, minutes to cook, food cost]. Taste and wow are out of 10 before the chef's touch.
// A twist: [words added to the name, taste, wow, minutes, cost].
const CUISINES = [
  { k: 'french', name: 'French', adj: 'French', line: 'Butter, wine and patience.', icon: 'bird',
    starter: [['French onion soup', 'soup', 5, 2, 8, 3], ['Escargots in garlic butter', 'shell', 5, 4, 7, 5], ['Salade niçoise', 'salad', 4, 2, 6, 4], ['Pâté en croûte', 'bread', 5, 3, 9, 4], ['Steak tartare', 'steak', 6, 4, 6, 6]],
    main: [['Coq au vin', 'bowl', 6, 2, 14, 6], ['Duck à l\'orange', 'bird', 7, 4, 14, 9], ['Sole meunière', 'fish', 6, 3, 11, 10], ['Beef bourguignon', 'bowl', 7, 2, 15, 8], ['Steak frites', 'steak', 6, 1, 10, 8]],
    dessert: [['Crème brûlée', 'scoop', 6, 3, 7, 2], ['Tarte tatin', 'tart', 6, 3, 8, 3], ['Chocolate soufflé', 'cake', 7, 5, 11, 3], ['Profiteroles', 'dumpling', 5, 3, 7, 3], ['Madeleines', 'bread', 4, 2, 5, 1]],
    twists: [['with black truffle', 1, 3, 1, 7], ['flambéed at the table', 0, 4, 2, 2], ['with brown butter', 1, 1, 1, 1], ['in a salt crust', 0, 3, 3, 2], ['with Champagne sauce', 1, 2, 2, 5]] },
  { k: 'italian', name: 'Italian', adj: 'Italian', line: 'Nonna\'s table, done properly.', icon: 'pasta',
    starter: [['Burrata and tomatoes', 'salad', 6, 3, 4, 5], ['Arancini', 'dumpling', 5, 2, 7, 2], ['Beef carpaccio', 'steak', 5, 3, 5, 6], ['Minestrone', 'soup', 4, 1, 8, 2], ['Bruschetta', 'bread', 4, 1, 4, 1]],
    main: [['Cacio e pepe', 'pasta', 6, 2, 8, 3], ['Osso buco', 'bowl', 7, 3, 15, 9], ['Wild mushroom risotto', 'bowl', 6, 3, 12, 5], ['Lasagne', 'tart', 7, 1, 12, 4], ['Sea bass al cartoccio', 'fish', 6, 4, 11, 9]],
    dessert: [['Tiramisu', 'cake', 6, 2, 5, 2], ['Panna cotta', 'scoop', 5, 3, 5, 2], ['Affogato', 'scoop', 5, 2, 3, 2], ['Cannoli', 'bread', 5, 3, 6, 2], ['Lemon ricotta tart', 'tart', 5, 2, 7, 2]],
    twists: [['with shaved truffle', 1, 3, 1, 7], ['with nduja', 1, 2, 1, 2], ['with aged balsamic', 1, 1, 0, 3], ['wood-fired', 1, 2, 2, 1], ['with lemon and chilli', 0, 2, 1, 1]] },
  { k: 'japanese', name: 'Japanese', adj: 'Japanese', line: 'Precise, seasonal, quietly perfect.', icon: 'sushi',
    starter: [['Miso soup', 'soup', 4, 1, 4, 1], ['Pork gyoza', 'dumpling', 5, 2, 7, 2], ['Tuna tataki', 'fish', 6, 4, 6, 8], ['Agedashi tofu', 'bowl', 5, 3, 6, 2], ['Salmon sashimi', 'sushi', 6, 3, 5, 7]],
    main: [['Omakase nigiri', 'sushi', 8, 5, 12, 14], ['Tonkotsu ramen', 'bowl', 7, 2, 14, 4], ['Black cod miso', 'fish', 7, 4, 13, 12], ['Katsu curry', 'bowl', 6, 1, 10, 4], ['Wagyu donburi', 'steak', 7, 4, 9, 13]],
    dessert: [['Matcha ice cream', 'scoop', 5, 2, 3, 2], ['Mochi', 'dumpling', 5, 3, 4, 2], ['Yuzu cheesecake', 'cake', 6, 3, 6, 3], ['Dorayaki', 'bread', 4, 2, 5, 1], ['Black sesame pudding', 'scoop', 5, 4, 5, 2]],
    twists: [['with torched uni', 1, 3, 1, 8], ['smoked over cherry wood', 1, 2, 2, 1], ['with yuzu kosho', 1, 2, 0, 1], ['with gold leaf', 0, 4, 1, 5], ['with pickled plum', 0, 2, 0, 1]] },
  { k: 'indian', name: 'Indian', adj: 'Indian', line: 'Spice, smoke and slow sauces.', icon: 'bowl',
    starter: [['Samosas', 'dumpling', 5, 1, 7, 1], ['Onion bhaji', 'bread', 4, 1, 6, 1], ['Pani puri', 'dumpling', 5, 4, 5, 2], ['Tandoori prawns', 'skewer', 6, 3, 7, 6], ['Dal shorba', 'soup', 4, 1, 6, 1]],
    main: [['Butter chicken', 'bowl', 7, 1, 12, 5], ['Lamb rogan josh', 'bowl', 7, 2, 15, 7], ['Goan fish curry', 'fish', 6, 3, 11, 7], ['Masala dosa', 'bread', 5, 3, 9, 2], ['Chicken biryani', 'bowl', 7, 3, 16, 5]],
    dessert: [['Gulab jamun', 'dumpling', 5, 1, 5, 1], ['Pistachio kulfi', 'scoop', 5, 2, 3, 1], ['Rasmalai', 'scoop', 5, 3, 6, 2], ['Carrot halwa', 'cake', 5, 2, 8, 1], ['Mango shrikhand', 'scoop', 5, 3, 4, 2]],
    twists: [['with smoked ghee', 1, 2, 1, 2], ['with saffron', 1, 2, 1, 4], ['from the tandoor', 1, 2, 2, 1], ['with curry leaf crackle', 0, 3, 1, 1], ['with pomegranate', 0, 2, 0, 2]] },
  { k: 'mexican', name: 'Mexican', adj: 'Mexican', line: 'Masa, chilli and a lot of lime.', icon: 'taco',
    starter: [['Guacamole and totopos', 'salad', 5, 1, 4, 3], ['Tuna tostada', 'taco', 6, 3, 5, 6], ['Elote', 'skewer', 5, 2, 5, 1], ['Sopa de tortilla', 'soup', 5, 2, 8, 2], ['Ceviche', 'fish', 6, 4, 5, 7]],
    main: [['Tacos al pastor', 'taco', 7, 2, 8, 3], ['Mole poblano', 'bird', 7, 5, 16, 6], ['Carnitas', 'steak', 6, 1, 13, 4], ['Baja fish tacos', 'taco', 6, 2, 8, 5], ['Enchiladas verdes', 'tart', 6, 2, 10, 3]],
    dessert: [['Churros', 'bread', 5, 2, 6, 1], ['Tres leches', 'cake', 6, 2, 4, 2], ['Flan', 'scoop', 5, 2, 5, 1], ['Mexican chocolate mousse', 'scoop', 5, 3, 5, 2], ['Paleta trio', 'skewer', 4, 3, 3, 1]],
    twists: [['with salsa macha', 1, 2, 1, 1], ['with smoked chipotle', 1, 2, 1, 1], ['with grasshopper salt', 0, 4, 0, 2], ['with charred pineapple', 1, 1, 1, 1], ['on blue corn', 1, 2, 1, 2]] },
  { k: 'nordic', name: 'Nordic', adj: 'Nordic', line: 'Foraged, pickled, fiercely fresh.', icon: 'fish',
    starter: [['Gravlax', 'fish', 6, 3, 5, 6], ['Smørrebrød', 'bread', 5, 3, 5, 4], ['Pickled herring', 'fish', 4, 2, 3, 3], ['Beetroot and horseradish', 'salad', 5, 4, 6, 2], ['Mussels in cider', 'bowl', 5, 2, 8, 4]],
    main: [['Venison and lingonberries', 'steak', 7, 4, 14, 12], ['Arctic char, dill butter', 'fish', 6, 3, 11, 9], ['Meatballs and mash', 'dumpling', 6, 1, 10, 3], ['Barley and mushrooms', 'bowl', 5, 3, 12, 3], ['Cod with brown butter', 'fish', 6, 2, 11, 8]],
    dessert: [['Cinnamon buns', 'bread', 5, 1, 8, 1], ['Cloudberry cream', 'scoop', 5, 4, 4, 4], ['Skyr cheesecake', 'cake', 6, 3, 6, 2], ['Apple cake', 'cake', 5, 2, 8, 1], ['Liquorice ice cream', 'scoop', 4, 5, 4, 2]],
    twists: [['with pine oil', 0, 3, 0, 1], ['with fermented rhubarb', 1, 3, 1, 1], ['smoked over hay', 1, 3, 2, 1], ['with sea buckthorn', 1, 2, 0, 2], ['with ants', -1, 5, 0, 1]] },
];

// The vibe of the room. crowd: extra parties a night. price: what guests think is fair. wowW: how much they care
// about the show on the plate. linger: how long they take to eat. patience: how long they'll wait at the door.
// size: how big parties tend to be [min, max]. bar: how good the food has to be before guests are impressed
// (the Quill Guide's inspector expects the same of everyone).
const VIBES = [
  { k: 'candle', name: 'Candlelit', line: 'Low light, white cloths, whispered anniversaries.', does: 'Guests pay more and wait longer, but linger over dinner.',
    bar: 5, crowd: -1, price: 1.2, wowW: 1.1, linger: 1.35, patience: 1.2, size: [2, 2] },
  { k: 'rustic', name: 'Rustic farmhouse', line: 'Big wooden tables, bread on a board, dogs welcome.', does: 'Families and friends. Bigger parties, patient and hungry.',
    bar: 3.5, crowd: 0, price: 1, wowW: .8, linger: 1.1, patience: 1.25, size: [2, 4] },
  { k: 'sleek', name: 'Sleek and modern', line: 'Concrete, clean lines, tweezers in the kitchen.', does: 'Guests (and inspectors) care most about a wow on the plate.',
    bar: 5, crowd: 0, price: 1.15, wowW: 1.45, linger: 1, patience: .9, size: [1, 3] },
  { k: 'diner', name: 'Neon diner', line: 'Chrome stools, a jukebox, open late.', does: 'The busiest room in town. Cheaper plates, quick eaters.',
    bar: 2.5, crowd: 3, price: .82, wowW: .7, linger: .75, patience: .85, size: [1, 4] },
  { k: 'garden', name: 'Garden terrace', line: 'Fairy lights, lemon trees, a fountain that nearly works.', does: 'A lovely room makes everyone a little happier.',
    bar: 4, crowd: 1, price: 1.05, wowW: 1, linger: 1.1, patience: 1.05, size: [2, 4], mood: .3 },
];

// Head chefs. flair: new ideas and daring. skill: taste. pace: how fast they cook. spec: the cuisine they're best at.
// wage is per week. say: how they talk when pitching a dish ({d} is the dish).
const CHEFS = [
  { name: 'Margaux Fontaine', short: 'Margaux', spec: 'french', flair: 6, skill: 8, pace: 5, wage: 240, look: { hair: 'bun', brow: 1 },
    bio: 'Trained in Lyon. Shouts, then says sorry with pastry.',
    say: ['{d}. Trust me.', 'Listen. {d}. Nobody leaves unhappy.', '{d}. Classic, because classic works.'],
    push: ['More? Fine. Watch this.', 'You want drama? I am drama.'], fail: ['Non. That was too much. My fault.', 'Hm. It fought me. It won.'],
    yes: ['Bon. It goes on.', 'Good choice. Obviously.'], no: ['Pff. Fine. Something else.', 'You are hard to please. I like that.'] },
  { name: 'Kenji Mori', short: 'Kenji', spec: 'japanese', flair: 5, skill: 9, pace: 6, wage: 260, look: { hair: 'crop', glasses: 1 },
    bio: 'Thirty years of knife work. Speaks softly, plates perfectly.',
    say: ['{d}. Simple. Exact.', 'Perhaps {d}. The fish is very good this week.', '{d}. Nothing extra.'],
    push: ['One small change, then.', 'Let me try something.'], fail: ['No. Too loud. Forgive me.', 'That was a mistake. I will do better.'],
    yes: ['Thank you.', 'It will be right every time.'], no: ['Of course.', 'I understand. Another.'] },
  { name: 'Rosa Bellini', short: 'Rosa', spec: 'italian', flair: 4, skill: 7, pace: 8, wage: 180, look: { hair: 'curls', earrings: 1 },
    bio: 'Feeds everyone. Nobody has ever left her kitchen hungry.',
    say: ['{d}, like my mother made it.', 'Tesoro, {d}. Big plates.', '{d}. You will see.'],
    push: ['Something special? Okay, okay.', 'A little extra love, then.'], fail: ['Ay. Too fancy. That\'s not me.', 'Mamma mia. Let\'s forget that one.'],
    yes: ['Perfetto!', 'They will lick the plate.'], no: ['No? Okay, I have a hundred more.', 'Fine, fine. Another.'] },
  { name: 'Obi Adeyemi', short: 'Obi', spec: null, flair: 9, skill: 6, pace: 5, wage: 220, look: { hair: 'flat', beard: 1 },
    bio: 'Wild ideas, all day long. Some of them are brilliant.',
    say: ['What if... {d}?', 'Okay, hear me out: {d}.', '{d}. But I have plans for it.'],
    push: ['Yes! Let\'s go further!', 'Now we\'re talking.'], fail: ['Ha. Okay. That was a bit much.', 'Science is failing sometimes.'],
    yes: ['Yes! This is going to be good.', 'Love it.'], no: ['Fair. I\'ve got ten more.', 'Next idea, coming up.'] },
  { name: 'Priya Nair', short: 'Priya', spec: 'indian', flair: 7, skill: 7, pace: 6, wage: 230, look: { hair: 'long', dot: 1 },
    bio: 'Spices measured like a watchmaker. Hums while she cooks.',
    say: ['{d}. The spice is balanced to the gram.', 'How about {d}? My grandmother would approve.', '{d}. Warm, bright, layered.'],
    push: ['Let me add one more layer.', 'Something a little daring?'], fail: ['Too many layers. It\'s muddy.', 'No, that doesn\'t sing.'],
    yes: ['Lovely. It goes on.', 'They\'ll remember this one.'], no: ['Something else, then.', 'I have another in mind.'] },
  { name: 'Dolly Hayes', short: 'Dolly', spec: 'mexican', flair: 3, skill: 5, pace: 9, wage: 120, look: { hair: 'beehive', earrings: 1 },
    bio: 'Fast, cheerful and cheap. Hasn\'t burnt a pancake since 1994.',
    say: ['{d}! Quick, hot, everybody loves it.', 'Hon, {d}. Easy.', '{d}. Out in a flash.'],
    push: ['Fancy? I can do fancy. Kinda.', 'Okay, sugar, let\'s jazz it up.'], fail: ['Well, that didn\'t work.', 'Oops. Let\'s pretend that never happened.'],
    yes: ['You got it!', 'Easy peasy.'], no: ['No problem, hon.', 'Sure thing. Next!'] },
];
// The sous chef cooks alongside the head chef (a second station). skill changes how well they cook your dishes.
const SOUS = [
  { name: 'Theo Grant', short: 'Theo', skill: 6, pace: 6, wage: 90, look: { hair: 'crop' }, bio: 'Steady, tidy, never late.' },
  { name: 'Aiko Tanaka', short: 'Aiko', skill: 7, pace: 5, wage: 110, look: { hair: 'bob' }, bio: 'Careful and exact. A future head chef.' },
  { name: 'Bram de Vries', short: 'Bram', skill: 4, pace: 8, wage: 70, look: { hair: 'flat', beard: 1 }, bio: 'Fast hands. Sometimes too fast.' },
];
// Front of house. charm makes guests happier and tip more. pace: takes orders and brings bills without being asked.
const FOH = [
  { name: 'Celeste Moreau', short: 'Celeste', charm: 8, pace: 4, wage: 100, look: { hair: 'long', earrings: 1 }, bio: 'Remembers every regular\'s name. A little slow.' },
  { name: 'Marco Ruiz', short: 'Marco', charm: 6, pace: 7, wage: 85, look: { hair: 'curls', mustache: 1 }, bio: 'Warm, quick and always smiling.' },
  { name: 'Jules Okafor', short: 'Jules', charm: 4, pace: 9, wage: 65, look: { hair: 'crop', glasses: 1 }, bio: 'Lightning quick. Forgets to smile.' },
];
// A line cook joins the kitchen as an extra station.
const LINE_COOK = { name: 'Sam Ortiz', short: 'Sam', skill: 5, pace: 7, wage: 60, look: { hair: 'cap' } };

// Things you can buy in the office between services. k never changes (saved runs use it). wage is weekly.
const UPGRADES = [
  { k: 'table', name: 'Another table', does: 'Seat one more party at a time.', costs: [220, 280, 340, 400], max: 4 },
  { k: 'line', name: 'Hire a line cook', does: 'Sam joins the kitchen: one more dish on the stove at a time.', cost: 0, wage: 60 },
  { k: 'porter', name: 'Hire a porter', does: 'Tables get cleared for you.', cost: 0, wage: 45 },
  { k: 'decor', name: 'Do up the room', does: 'Nicer room, happier guests. Inspectors notice.', costs: [260, 480, 720], max: 3 },
  { k: 'lamp', name: 'Heat lamps at the pass', does: 'Plates stay hot twice as long.', cost: 240 },
  { k: 'somm', name: 'Hire a sommelier', does: 'Wine with dinner: every bill is bigger.', cost: 0, wage: 90 },
];

// The other restaurants in town. buzz is out of 100. stars: last year's Quill Guide.
const RIVALS = [
  { name: 'Kaito', cuisine: 'Japanese', buzz: 78, stars: 2 },
  { name: 'Maison Blanc', cuisine: 'French', buzz: 70, stars: 1 },
  { name: 'The Gilded Spoon', cuisine: 'Modern', buzz: 64, stars: 1 },
  { name: 'Nonna Rosa\'s', cuisine: 'Italian', buzz: 55, stars: 0 },
  { name: 'Smoke and Salt', cuisine: 'Barbecue', buzz: 48, stars: 0 },
  { name: 'Verde', cuisine: 'Mexican', buzz: 40, stars: 0 },
];
// The Quill Guide: an inspector eats here in secret three times a season, once in each of these windows (weeks, from 0).
const INSPECT_WINDOWS = [[1, 2], [3, 5], [6, 7]];
// The average inspection score (out of 100) needed for each star. Rivals earn stars from their buzz.
const STAR_AT = [52, 68, 82];
const RIVAL_STAR_AT = [62, 76, 90];

// The week's news. {r} is a rival. crowd: extra (or fewer) parties this week. rb: change to that rival's buzz.
const NEWS = [
  { t: 'A food festival fills the streets this weekend. Expect a crowd.', crowd: 3 },
  { t: 'It\'s pouring all week. Fewer people will venture out.', crowd: -2 },
  { t: '{r} got a glowing write-up in the Evening Ink.', rb: 6 },
  { t: '{r}\'s oven broke down. Their regulars are looking elsewhere.', rb: -6, crowd: 1 },
  { t: '{r} is doing half-price Fridays. Tough competition.', rb: 3, crowd: -2 },
  { t: 'A big concert lets out nearby at nine.', crowd: 2 },
  { t: 'Payday weekend. People feel like treating themselves.', crowd: 2 },
  { t: '{r} lost their head chef to a rival across town.', rb: -8 },
  { t: 'A heatwave. Nobody wants to cook at home.', crowd: 1 },
  { t: '{r} is booked out with a TV crew all week.', rb: 5, crowd: 1 },
  { t: 'A quiet week in town. Nothing much going on.' },
];

// Name ideas for the restaurant, and for the people who eat there.
const NAME_IDEAS = ['The Blue Ladle', 'Ink and Onion', 'Little Fork', 'Salt House', 'The Crooked Spoon', 'Copper Pot', 'Parsley', 'The Open Oven',
  'Brass Kettle', 'Two Olives', 'Quill and Plate', 'The Hungry Heron', 'Saffron Door', 'Black Pepper', 'Lantern', 'The Last Crumb', 'Fig and Fennel', 'Night Owl'];
const SURNAMES = ['Garcia', 'Nguyen', 'Smith', 'Okafor', 'Rossi', 'Kowalski', 'Chen', 'Patel', 'Silva', 'Murphy', 'Haddad', 'Larsen', 'Kim', 'Dubois', 'Novak', 'Sato', 'Reyes', 'Bauer'];
const FIRSTS = ['Ada', 'Ben', 'Cleo', 'Dev', 'Eve', 'Finn', 'Gus', 'Hana', 'Ivo', 'Jade', 'Kai', 'Lena', 'Milo', 'Nora', 'Otto', 'Pia', 'Rae', 'Sol', 'Tess', 'Uma', 'Vic', 'Wes', 'Zoe'];

// What guests say afterwards, by how many stars they gave. {d} is a dish they had.
const REVIEWS = {
  5: ['Best meal I\'ve had all year.', 'The {d} alone is worth the trip.', 'We\'re already booking again.', 'Flawless, start to finish.'],
  4: ['Lovely evening. The {d} was a highlight.', 'Really good. We\'ll be back.', 'Great food, great room.', 'The {d}! Wow.'],
  3: ['Fine. Nothing to write home about.', 'Decent {d}. A bit slow.', 'Solid, if a little ordinary.', 'Good, not great.'],
  2: ['We waited ages.', 'The {d} arrived cold.', 'Too pricey for what it was.', 'Disappointing, honestly.'],
  1: ['Never again.', 'An evening we\'d rather forget.', 'Cold food and no apology.', 'I\'ve had better at a petrol station.'],
};
