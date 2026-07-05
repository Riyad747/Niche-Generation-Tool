/**
 * Starter niche taxonomy — shared by the DB seed and the portfolio-gap engine
 * so "what categories exist" has one source of truth. Extend freely.
 */
export const TAXONOMY: Record<string, string[]> = {
  Healthcare: [
    'Telemedicine',
    'Mental Health',
    'Healthcare Icons',
    'Pediatric Care',
    'Elderly Care',
    'Medical Devices',
    'Healthcare Technology',
    'Medical Education',
  ],
  Business: ['Finance', 'Startups', 'Remote Work', 'Productivity', 'E-commerce', 'Marketing'],
  Lifestyle: ['Wellness', 'Fitness', 'Travel', 'Food', 'Home Decor', 'Sustainability'],
  Technology: ['AI', 'Cybersecurity', 'Cloud', 'IoT', 'Blockchain', 'Data Science'],
  Education: ['E-learning', 'STEM', 'Language Learning', 'Kids Education'],
  Nature: ['Plants', 'Animals', 'Landscapes', 'Weather', 'Space'],
  Seasonal: ['Christmas', 'Halloween', 'Valentines', 'Summer', 'Back to School'],
};

export const TOP_CATEGORIES = Object.keys(TAXONOMY);
