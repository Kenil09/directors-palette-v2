// Nano-Banana Model Specific Prompts for Director's Palette
// These prompts are optimized for the nano-banana model's capabilities

export interface PromptPreset {
  id: string
  title: string
  prompt: string
  categoryId: string
  tags: string[]
  isQuickAccess?: boolean
  reference?: string
}

export const PROMPT_CATEGORIES = [
  { id: 'cinematic', name: 'Cinematic Shots', icon: '🎬' },
  { id: 'characters', name: 'Character Styles', icon: '👤' },
  { id: 'lighting', name: 'Lighting Setups', icon: '💡' },
  { id: 'environments', name: 'Environments', icon: '🏞️' },
  { id: 'effects', name: 'Special Effects', icon: '✨' },
  { id: 'moods', name: 'Moods & Atmosphere', icon: '🎭' },
  { id: 'camera', name: 'Camera Angles', icon: '📷' },
  { id: 'styles', name: 'Art Styles', icon: '🎨' }
]

export const NANO_BANANA_PROMPTS: PromptPreset[] = [
  // Cinematic Shots
  {
    id: 'cin-001',
    title: 'Epic Wide Shot',
    prompt: 'cinematic wide shot, epic scale, dramatic lighting, anamorphic lens flare, film grain, 70mm IMAX, professional cinematography',
    categoryId: 'cinematic',
    tags: ['wide', 'epic', 'dramatic'],
    isQuickAccess: true,
    reference: 'Dune, Lawrence of Arabia style cinematography'
  },
  {
    id: 'cin-002',
    title: 'Intimate Close-Up',
    prompt: 'extreme close-up shot, shallow depth of field, bokeh, intimate lighting, emotional portrait, cinematic color grading',
    categoryId: 'cinematic',
    tags: ['closeup', 'portrait', 'intimate'],
    isQuickAccess: true
  },
  {
    id: 'cin-003',
    title: 'Action Sequence',
    prompt: 'dynamic action shot, motion blur, high speed cinematography, dramatic angles, intense movement, cinematic tension',
    categoryId: 'cinematic',
    tags: ['action', 'dynamic', 'motion']
  },
  {
    id: 'cin-004',
    title: 'Establishing Shot',
    prompt: 'establishing shot, wide angle lens, deep focus, location reveal, environmental storytelling, cinematic composition',
    categoryId: 'cinematic',
    tags: ['establishing', 'wide', 'location']
  },
  {
    id: 'cin-005',
    title: 'Dutch Angle Drama',
    prompt: 'dutch angle shot, tilted camera, psychological tension, dramatic composition, film noir influence, unsettling perspective',
    categoryId: 'cinematic',
    tags: ['dutch', 'angle', 'dramatic']
  },
  {
    id: 'cin-006',
    title: 'Tracking Shot',
    prompt: 'smooth tracking shot, steadicam movement, following subject, dynamic camera motion, cinematic flow, professional dolly work',
    categoryId: 'cinematic',
    tags: ['tracking', 'movement', 'dolly']
  },

  // Character Styles
  {
    id: 'char-001',
    title: 'Hero Portrait',
    prompt: '@character heroic pose, confident expression, dramatic backlighting, superhero aesthetic, powerful stance, cinematic portrait',
    categoryId: 'characters',
    tags: ['hero', 'portrait', 'powerful'],
    isQuickAccess: true
  },
  {
    id: 'char-002',
    title: 'Villain Reveal',
    prompt: '@character sinister expression, dramatic shadows, low key lighting, menacing presence, dark atmosphere, villain aesthetic',
    categoryId: 'characters',
    tags: ['villain', 'dark', 'menacing']
  },
  {
    id: 'char-003',
    title: 'Emotional Character',
    prompt: '@character emotional expression, tears, vulnerable moment, soft lighting, intimate framing, raw emotion',
    categoryId: 'characters',
    tags: ['emotional', 'vulnerable', 'intimate']
  },
  {
    id: 'char-004',
    title: 'Character in Action',
    prompt: '@character mid-action pose, dynamic movement, motion blur, athletic form, intense concentration, action hero shot',
    categoryId: 'characters',
    tags: ['action', 'dynamic', 'athletic']
  },
  {
    id: 'char-005',
    title: 'Period Character',
    prompt: '@character period costume, historical accuracy, vintage aesthetic, classical portrait style, authentic details',
    categoryId: 'characters',
    tags: ['period', 'historical', 'vintage']
  },
  {
    id: 'char-006',
    title: 'Sci-Fi Character',
    prompt: '@character futuristic outfit, sci-fi aesthetic, holographic elements, cyberpunk style, neon accents, tech wear',
    categoryId: 'characters',
    tags: ['scifi', 'futuristic', 'cyberpunk']
  },

  // Lighting Setups
  {
    id: 'light-001',
    title: 'Golden Hour Magic',
    prompt: 'golden hour lighting, warm tones, long shadows, sun flare, magic hour cinematography, soft warm light',
    categoryId: 'lighting',
    tags: ['golden', 'warm', 'sunset'],
    isQuickAccess: true
  },
  {
    id: 'light-002',
    title: 'Film Noir Lighting',
    prompt: 'film noir lighting, high contrast, venetian blind shadows, black and white aesthetic, dramatic shadows',
    categoryId: 'lighting',
    tags: ['noir', 'contrast', 'shadows']
  },
  {
    id: 'light-003',
    title: 'Rembrandt Lighting',
    prompt: 'Rembrandt lighting, triangle light on face, classical portrait lighting, chiaroscuro, dramatic single source',
    categoryId: 'lighting',
    tags: ['rembrandt', 'portrait', 'classical']
  },
  {
    id: 'light-004',
    title: 'Neon Cyberpunk',
    prompt: 'neon lighting, cyberpunk aesthetic, colorful glow, urban night scene, LED reflections, futuristic atmosphere',
    categoryId: 'lighting',
    tags: ['neon', 'cyberpunk', 'colorful']
  },
  {
    id: 'light-005',
    title: 'Soft Box Studio',
    prompt: 'studio lighting, soft box setup, even illumination, professional photography, clean shadows, commercial quality',
    categoryId: 'lighting',
    tags: ['studio', 'soft', 'professional']
  },
  {
    id: 'light-006',
    title: 'Moonlight Scene',
    prompt: 'moonlight illumination, blue tones, night scene, soft shadows, ethereal glow, nocturnal atmosphere',
    categoryId: 'lighting',
    tags: ['moon', 'night', 'blue']
  },

  // Environments
  {
    id: 'env-001',
    title: 'Post-Apocalyptic City',
    prompt: 'abandoned cityscape, post-apocalyptic environment, overgrown vegetation, destroyed buildings, atmospheric fog',
    categoryId: 'environments',
    tags: ['apocalyptic', 'city', 'abandoned']
  },
  {
    id: 'env-002',
    title: 'Fantasy Forest',
    prompt: 'enchanted forest, magical atmosphere, bioluminescent plants, mystical fog, fantasy environment, ethereal lighting',
    categoryId: 'environments',
    tags: ['fantasy', 'forest', 'magical'],
    isQuickAccess: true
  },
  {
    id: 'env-003',
    title: 'Futuristic Metropolis',
    prompt: 'futuristic city skyline, flying vehicles, holographic billboards, neon lights, cyberpunk architecture, sci-fi urban',
    categoryId: 'environments',
    tags: ['futuristic', 'city', 'scifi']
  },
  {
    id: 'env-004',
    title: 'Victorian London',
    prompt: 'Victorian era London, gaslight streets, fog, cobblestones, period architecture, industrial revolution atmosphere',
    categoryId: 'environments',
    tags: ['victorian', 'london', 'period']
  },
  {
    id: 'env-005',
    title: 'Alien Landscape',
    prompt: 'alien planet surface, otherworldly terrain, strange rock formations, multiple moons, exotic atmosphere',
    categoryId: 'environments',
    tags: ['alien', 'planet', 'scifi']
  },
  {
    id: 'env-006',
    title: 'Underwater Scene',
    prompt: 'underwater environment, coral reef, caustic light patterns, marine life, deep sea atmosphere, aquatic lighting',
    categoryId: 'environments',
    tags: ['underwater', 'ocean', 'aquatic']
  },

  // Special Effects
  {
    id: 'fx-001',
    title: 'Particle Explosion',
    prompt: 'particle effects, explosive debris, dynamic destruction, slow motion explosion, cinematic VFX, dramatic impact',
    categoryId: 'effects',
    tags: ['explosion', 'particles', 'vfx']
  },
  {
    id: 'fx-002',
    title: 'Magic Spell Effect',
    prompt: 'magical energy effect, glowing particles, spell casting, mystical aura, fantasy VFX, ethereal light trails',
    categoryId: 'effects',
    tags: ['magic', 'spell', 'fantasy']
  },
  {
    id: 'fx-003',
    title: 'Holographic Display',
    prompt: 'holographic projection, futuristic interface, sci-fi technology, translucent display, digital effects',
    categoryId: 'effects',
    tags: ['hologram', 'scifi', 'tech']
  },
  {
    id: 'fx-004',
    title: 'Weather Effects',
    prompt: 'heavy rain effect, lightning strike, storm atmosphere, weather dynamics, atmospheric conditions',
    categoryId: 'effects',
    tags: ['weather', 'rain', 'storm']
  },
  {
    id: 'fx-005',
    title: 'Time Distortion',
    prompt: 'time manipulation effect, motion trails, temporal distortion, clock elements, surreal time bending',
    categoryId: 'effects',
    tags: ['time', 'distortion', 'surreal']
  },

  // Moods & Atmosphere
  {
    id: 'mood-001',
    title: 'Dark & Moody',
    prompt: 'dark atmosphere, moody lighting, psychological thriller mood, tension, shadowy environment, noir aesthetic',
    categoryId: 'moods',
    tags: ['dark', 'moody', 'thriller']
  },
  {
    id: 'mood-002',
    title: 'Dreamlike Surreal',
    prompt: 'dreamlike quality, surreal atmosphere, soft focus, ethereal mood, fantasy elements, otherworldly feeling',
    categoryId: 'moods',
    tags: ['dream', 'surreal', 'ethereal']
  },
  {
    id: 'mood-003',
    title: 'Romantic Atmosphere',
    prompt: 'romantic mood, soft lighting, warm colors, intimate atmosphere, gentle bokeh, love story aesthetic',
    categoryId: 'moods',
    tags: ['romantic', 'soft', 'warm']
  },
  {
    id: 'mood-004',
    title: 'Horror Tension',
    prompt: 'horror atmosphere, creepy environment, unsettling mood, dark corners, psychological fear, suspenseful lighting',
    categoryId: 'moods',
    tags: ['horror', 'creepy', 'suspense']
  },
  {
    id: 'mood-005',
    title: 'Epic Adventure',
    prompt: 'adventure mood, epic scale, heroic atmosphere, grand landscapes, journey feeling, inspirational tone',
    categoryId: 'moods',
    tags: ['epic', 'adventure', 'heroic']
  },

  // Camera Angles
  {
    id: 'cam-001',
    title: 'Low Angle Power',
    prompt: 'low angle shot, looking up, powerful perspective, heroic framing, dramatic sky background, imposing presence',
    categoryId: 'camera',
    tags: ['low', 'angle', 'power']
  },
  {
    id: 'cam-002',
    title: 'High Angle Overview',
    prompt: 'high angle shot, looking down, bird\'s eye perspective, overview composition, vulnerable subject position',
    categoryId: 'camera',
    tags: ['high', 'angle', 'overview']
  },
  {
    id: 'cam-003',
    title: 'Over the Shoulder',
    prompt: 'over the shoulder shot, POV perspective, conversation framing, intimate dialogue, character interaction',
    categoryId: 'camera',
    tags: ['ots', 'pov', 'dialogue']
  },
  {
    id: 'cam-004',
    title: 'Aerial Drone Shot',
    prompt: 'aerial drone shot, sweeping landscape, bird\'s eye view, cinematic overhead, dynamic height perspective',
    categoryId: 'camera',
    tags: ['aerial', 'drone', 'landscape']
  },
  {
    id: 'cam-005',
    title: 'Handheld Documentary',
    prompt: 'handheld camera style, documentary feel, raw authentic movement, cinema verite, realistic camera shake',
    categoryId: 'camera',
    tags: ['handheld', 'documentary', 'authentic']
  },

  // Art Styles
  {
    id: 'style-001',
    title: 'Cinematic Realism',
    prompt: 'photorealistic rendering, cinematic quality, high detail, professional color grading, filmic look',
    categoryId: 'styles',
    tags: ['realistic', 'cinematic', 'detailed']
  },
  {
    id: 'style-002',
    title: 'Stylized Animation',
    prompt: 'stylized 3D animation, Pixar quality, expressive characters, vibrant colors, animated film aesthetic',
    categoryId: 'styles',
    tags: ['animated', 'stylized', 'pixar']
  },
  {
    id: 'style-003',
    title: 'Graphic Novel',
    prompt: 'graphic novel style, comic book aesthetic, bold lines, dramatic shading, illustrated look',
    categoryId: 'styles',
    tags: ['comic', 'graphic', 'illustrated']
  },
  {
    id: 'style-004',
    title: 'Watercolor Dream',
    prompt: 'watercolor painting style, soft edges, artistic brushstrokes, dreamy quality, painterly aesthetic',
    categoryId: 'styles',
    tags: ['watercolor', 'painterly', 'artistic']
  },
  {
    id: 'style-005',
    title: 'Retro 80s',
    prompt: '80s retro style, synthwave aesthetic, neon colors, vintage film look, nostalgic atmosphere',
    categoryId: 'styles',
    tags: ['retro', '80s', 'synthwave']
  }
]

// Function to get prompts by category
export function getPromptsByCategory(categoryId: string): PromptPreset[] {
  return NANO_BANANA_PROMPTS.filter(prompt => prompt.categoryId === categoryId)
}

// Function to get quick access prompts
export function getQuickAccessPrompts(): PromptPreset[] {
  return NANO_BANANA_PROMPTS.filter(prompt => prompt.isQuickAccess)
}

// Function to search prompts
export function searchPrompts(query: string): PromptPreset[] {
  const lowerQuery = query.toLowerCase()
  return NANO_BANANA_PROMPTS.filter(prompt =>
    prompt.title.toLowerCase().includes(lowerQuery) ||
    prompt.prompt.toLowerCase().includes(lowerQuery) ||
    prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}