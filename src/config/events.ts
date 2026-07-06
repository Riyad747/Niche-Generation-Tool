/**
 * Curated recurring content opportunities for microstock creators — holidays,
 * seasons, awareness days, and shopping events. `leadDays` is how far ahead you
 * should START creating (stock platforms reward early seasonal uploads).
 *
 * `approx: true` marks events whose exact date shifts each year (Easter,
 * Thanksgiving, Lunar New Year…) — the month/day is a representative anchor,
 * which is precise enough for lead-time planning.
 */
export type EventCategory = 'holiday' | 'seasonal' | 'awareness' | 'shopping' | 'cultural';

export interface CalendarEvent {
  id: string;
  name: string;
  category: EventCategory;
  month: number; // 1-12
  day: number; // 1-31 (start day for seasons)
  leadDays: number; // start creating this many days before
  note: string; // what sells / what to make
  approx?: boolean;
}

export const EVENTS: CalendarEvent[] = [
  { id: 'new-year', name: "New Year's Day", category: 'holiday', month: 1, day: 1, leadDays: 60, note: 'Resolutions, fireworks, goals, fresh starts, countdowns.' },
  { id: 'lunar-new-year', name: 'Lunar New Year', category: 'cultural', month: 2, day: 17, leadDays: 60, approx: true, note: 'Red & gold, zodiac animals, lanterns, prosperity.' },
  { id: 'valentines', name: "Valentine's Day", category: 'holiday', month: 2, day: 14, leadDays: 60, note: 'Love, hearts, couples, romance, gifts, flowers.' },
  { id: 'intl-womens', name: "International Women's Day", category: 'awareness', month: 3, day: 8, leadDays: 45, note: 'Empowerment, women, diversity, equality.' },
  { id: 'st-patricks', name: "St. Patrick's Day", category: 'holiday', month: 3, day: 17, leadDays: 45, note: 'Green, shamrocks, Irish culture, celebration.' },
  { id: 'spring', name: 'Spring', category: 'seasonal', month: 3, day: 20, leadDays: 60, note: 'Flowers, renewal, pastels, gardening, fresh growth.' },
  { id: 'ramadan', name: 'Ramadan', category: 'cultural', month: 2, day: 18, leadDays: 45, approx: true, note: 'Crescent & lanterns, community, reflection, iftar.' },
  { id: 'easter', name: 'Easter', category: 'holiday', month: 4, day: 5, leadDays: 60, approx: true, note: 'Eggs, bunnies, pastels, spring, family brunch.' },
  { id: 'world-health-day', name: 'World Health Day', category: 'awareness', month: 4, day: 7, leadDays: 40, note: 'Healthcare, wellness, medical, prevention.' },
  { id: 'tax-season', name: 'Tax Season (US)', category: 'seasonal', month: 4, day: 15, leadDays: 45, note: 'Finance, accounting, taxes, small business, receipts.' },
  { id: 'earth-day', name: 'Earth Day', category: 'awareness', month: 4, day: 22, leadDays: 45, note: 'Sustainability, eco, nature, recycling, green energy.' },
  { id: 'mental-health-month', name: 'Mental Health Awareness Month', category: 'awareness', month: 5, day: 1, leadDays: 45, note: 'Mental health, mindfulness, wellbeing, self-care.' },
  { id: 'mothers-day', name: "Mother's Day", category: 'holiday', month: 5, day: 11, leadDays: 60, approx: true, note: 'Moms, family, flowers, gratitude, gifts.' },
  { id: 'graduation', name: 'Graduation Season', category: 'seasonal', month: 5, day: 15, leadDays: 45, note: 'Caps & gowns, achievement, students, diplomas.' },
  { id: 'wedding-season', name: 'Wedding Season', category: 'seasonal', month: 6, day: 1, leadDays: 60, note: 'Weddings, florals, rings, romance, celebration.' },
  { id: 'pride', name: 'Pride Month', category: 'cultural', month: 6, day: 1, leadDays: 45, note: 'Rainbow, LGBTQ+, diversity, inclusion, love.' },
  { id: 'fathers-day', name: "Father's Day", category: 'holiday', month: 6, day: 15, leadDays: 45, approx: true, note: 'Dads, family, tools, hobbies, gifts.' },
  { id: 'summer', name: 'Summer', category: 'seasonal', month: 6, day: 21, leadDays: 75, note: 'Beach, travel, sun, tropical, vacation, ice cream.' },
  { id: 'back-to-school', name: 'Back to School', category: 'seasonal', month: 8, day: 15, leadDays: 60, note: 'Education, kids, supplies, classrooms, learning.' },
  { id: 'autumn', name: 'Autumn / Fall', category: 'seasonal', month: 9, day: 22, leadDays: 60, note: 'Leaves, cozy, harvest, warm tones, pumpkin spice.' },
  { id: 'diwali', name: 'Diwali', category: 'cultural', month: 10, day: 20, leadDays: 45, approx: true, note: 'Lights, diyas/lamps, festive, rangoli, gold.' },
  { id: 'halloween', name: 'Halloween', category: 'holiday', month: 10, day: 31, leadDays: 75, note: 'Spooky, pumpkins, costumes, ghosts, horror, candy.' },
  { id: 'singles-day', name: "Singles' Day (11.11)", category: 'shopping', month: 11, day: 11, leadDays: 40, note: 'Sales, e-commerce, shopping (huge in Asia).' },
  { id: 'thanksgiving', name: 'Thanksgiving (US)', category: 'holiday', month: 11, day: 26, leadDays: 60, approx: true, note: 'Gratitude, family, turkey, harvest, autumn table.' },
  { id: 'black-friday', name: 'Black Friday', category: 'shopping', month: 11, day: 27, leadDays: 45, approx: true, note: 'Sales, discounts, e-commerce, shopping bags.' },
  { id: 'cyber-monday', name: 'Cyber Monday', category: 'shopping', month: 11, day: 30, leadDays: 45, approx: true, note: 'Online shopping, tech deals, e-commerce.' },
  { id: 'winter', name: 'Winter', category: 'seasonal', month: 12, day: 1, leadDays: 75, note: 'Snow, cozy, cold, festive lights, warm drinks.' },
  { id: 'christmas', name: 'Christmas', category: 'holiday', month: 12, day: 25, leadDays: 90, note: 'Gifts, festive, family, decorations, snow, Santa.' },
  { id: 'new-years-eve', name: "New Year's Eve", category: 'holiday', month: 12, day: 31, leadDays: 60, note: 'Party, fireworks, countdown, champagne, celebration.' },
];
