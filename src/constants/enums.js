// ─── Tüm backend enum değerleri ─────────────────────────────────────────────

// TopicTypes — [Flags] bitwise enum
export const TopicTypes = {
  Politics: 1,
  Economy: 2,
  WorldNews: 4,
  LocalNews: 8,
  Trending: 16,
  Technology: 32,
  Science: 64,
  AI: 128,
  Space: 256,
  Health: 512,
  Sports: 1024,
  Entertainment: 2048,
  Gaming: 4096,
  Celebrity: 8192,
  Lifestyle: 16384,
  Education: 32768,
  Relationships: 65536,
}

export const TopicLabels = {
  [TopicTypes.Politics]: 'Siyaset',
  [TopicTypes.Economy]: 'Ekonomi',
  [TopicTypes.WorldNews]: 'Dünya Haberleri',
  [TopicTypes.LocalNews]: 'Yerel Haberler',
  [TopicTypes.Trending]: 'Trend',
  [TopicTypes.Technology]: 'Teknoloji',
  [TopicTypes.Science]: 'Bilim',
  [TopicTypes.AI]: 'Yapay Zeka',
  [TopicTypes.Space]: 'Uzay',
  [TopicTypes.Health]: 'Sağlık',
  [TopicTypes.Sports]: 'Spor',
  [TopicTypes.Entertainment]: 'Eğlence',
  [TopicTypes.Gaming]: 'Oyun',
  [TopicTypes.Celebrity]: 'Ünlüler',
  [TopicTypes.Lifestyle]: 'Yaşam Tarzı',
  [TopicTypes.Education]: 'Eğitim',
  [TopicTypes.Relationships]: 'İlişkiler',
}

export const TopicEnumNames = {
  [TopicTypes.Politics]: 'politics',
  [TopicTypes.Economy]: 'economy',
  [TopicTypes.WorldNews]: 'worldnews',
  [TopicTypes.LocalNews]: 'localnews',
  [TopicTypes.Trending]: 'trending',
  [TopicTypes.Technology]: 'technology',
  [TopicTypes.Science]: 'science',
  [TopicTypes.AI]: 'ai',
  [TopicTypes.Space]: 'space',
  [TopicTypes.Health]: 'health',
  [TopicTypes.Sports]: 'sports',
  [TopicTypes.Entertainment]: 'entertainment',
  [TopicTypes.Gaming]: 'gaming',
  [TopicTypes.Celebrity]: 'celebrity',
  [TopicTypes.Lifestyle]: 'lifestyle',
  [TopicTypes.Education]: 'education',
  [TopicTypes.Relationships]: 'relationships',
}


export const TopicColors = {
  [TopicTypes.Politics]: '#EF4444',
  [TopicTypes.Economy]: '#F59E0B',
  [TopicTypes.WorldNews]: '#3B82F6',
  [TopicTypes.LocalNews]: '#6366F1',
  [TopicTypes.Trending]: '#EC4899',
  [TopicTypes.Technology]: '#06B6D4',
  [TopicTypes.Science]: '#8B5CF6',
  [TopicTypes.AI]: '#7C3AED',
  [TopicTypes.Space]: '#1D4ED8',
  [TopicTypes.Health]: '#22C55E',
  [TopicTypes.Sports]: '#F97316',
  [TopicTypes.Entertainment]: '#E11D48',
  [TopicTypes.Gaming]: '#10B981',
  [TopicTypes.Celebrity]: '#F472B6',
  [TopicTypes.Lifestyle]: '#A78BFA',
  [TopicTypes.Education]: '#0EA5E9',
  [TopicTypes.Relationships]: '#FB7185',
}

/**
 * Bitwise flags array'ini TopicTypes enum değerlerine çevirir.
 * Backend [int] array gönderiyor, bu fonksiyon display için kullanılır.
 * @param {number[]} topicTypesArray
 * @returns {number[]}
 */
export function parseTopicFlags(topicTypesArray) {
  if (!topicTypesArray) return []
  return topicTypesArray.filter((v) => Object.values(TopicTypes).includes(v))
}

// ─────────────────────────────────────────────────────────────────────────────

export const ReactionType = {
  Like: 0,
  Dislike: 1,
  BrutallyDislike: 2,
}

export const ReactionLabels = {
  [ReactionType.Like]: 'Beğen',
  [ReactionType.Dislike]: 'Beğenme',
  [ReactionType.BrutallyDislike]: 'Göm',
}

export const ReactionEmojis = {
  [ReactionType.Like]: '👍',
  [ReactionType.Dislike]: '👎',
  [ReactionType.BrutallyDislike]: '💀',
}



export const BotGrades = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  F: 4,
}

export const BotGradeColors = {
  [BotGrades.A]: '#22C55E',
  [BotGrades.B]: '#84CC16',
  [BotGrades.C]: '#F59E0B',
  [BotGrades.D]: '#F97316',
  [BotGrades.F]: '#EF4444',
}

export const UserGrades = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  F: 4,
}

export const UserGradeColors = {
  [UserGrades.A]: '#22C55E',
  [UserGrades.B]: '#84CC16',
  [UserGrades.C]: '#F59E0B',
  [UserGrades.D]: '#F97316',
  [UserGrades.F]: '#EF4444',
}

export const TribeGrades = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  F: 4,
}

export const TribeGradeColors = {
  [TribeGrades.A]: '#22C55E',
  [TribeGrades.B]: '#84CC16',
  [TribeGrades.C]: '#F59E0B',
  [TribeGrades.D]: '#F97316',
  [TribeGrades.F]: '#EF4444',
}

export const UserCapabilities = {
  Default: 0,
  Premium: 1,
};

export const Status = {
  Pending: 0,
  Success: 1,
  Failed: 2,
}

export const StatusColors = {
  [Status.Pending]: '#F59E0B',
  [Status.Success]: '#22C55E',
  [Status.Failed]: '#EF4444',
}

export const StatusLabels = {
  [Status.Pending]: 'Bekliyor',
  [Status.Success]: 'Başarılı',
  [Status.Failed]: 'Başarısız',
}

// ─────────────────────────────────────────────────────────────────────────────

export const TribeRoles = {
  TribeMember: 1,
  TribeSenior: 2,
  TribeAssistantLeader: 3,
  TribeCoLeader: 4,
  TribeLeader: 5,
}

export const TribeRoleLabels = {
  [TribeRoles.TribeMember]: 'Üye',
  [TribeRoles.TribeSenior]: 'Kıdemli',
  [TribeRoles.TribeAssistantLeader]: 'Yrd. Lider',
  [TribeRoles.TribeCoLeader]: 'Eş Lider',
  [TribeRoles.TribeLeader]: 'Lider',
}

export const TribeRoleColors = {
  [TribeRoles.TribeMember]: '#94A3B8',
  [TribeRoles.TribeSenior]: '#CBD5E1',
  [TribeRoles.TribeAssistantLeader]: '#F59E0B',
  [TribeRoles.TribeCoLeader]: '#A855F7',
  [TribeRoles.TribeLeader]: '#EF4444',
}

export const PromotionType = {
  Promotion: 0,
  Demotion: 1,
}

// ─────────────────────────────────────────────────────────────────────────────



export const StandardRoles = {
  TempUser: 0,
  StandardUser: 1,
  Admin: 2,
}

// ─────────────────────────────────────────────────────────────────────────────

export const IdTypes = {
  Post: 0,
  Entry: 1,
  Profile: 2,
  Tribe: 3,
  Debate: 4,
}

export const OrderType = {
  None: 0,
  MostLiked: 1,
  Oldest: 2,
  Newest: 3,
}

export const OrderTypeLabels = {
  [OrderType.None]: 'Sıralama Yok',
  [OrderType.MostLiked]: 'En Çok Beğenilen',
  [OrderType.Oldest]: 'En Eski',
  [OrderType.Newest]: 'En Yeni',
}

export const Distributions = {
  Phone: 0,
  Email: 1,
  Push: 2,
}

export const DistributionLabels = {
  [Distributions.Phone]: 'Telefon',
  [Distributions.Email]: 'E-posta',
  [Distributions.Push]: 'Push Bildirimi',
}

export const Theme = {
  None: 0,
  Mind: 1,
  Welcome: 2,
  Bots: 3,
  Rainbow: 4,
}
