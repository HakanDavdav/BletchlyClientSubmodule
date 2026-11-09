import {
  Users,
  Sparkles,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Layers,
  Shield,
  User,
  FileText,
  Podium,
  Bot,
  PenSquare,
  Edit3,
  Clock8,
} from 'lucide-react'
import BotFlashCardsIcon from '../components/common/icons/BotFlashCardsIcon'
import AngryBotWithSwordsIcon from '../components/common/icons/AngryBotWithSwordsIcon'

export const MOBILE_PAGE_HEADERS = [
  {
    pattern: /^\/$/,
    key: 'home-feed',
    title: (t) => t('feed.recent'),
    Icon: Clock8,
  },
  {
    pattern: /^\/marketplace$/,
    key: 'marketplace',
    title: (t) => t('card.marketplace'),
    Icon: BotFlashCardsIcon,
    help: (t) => ({
      title: t('card.marketplace_how_it_works_title'),
      items: [
        t('card.marketplace_how_it_works_1'),
        t('card.marketplace_how_it_works_2'),
      ],
    }),
  },
  {
    pattern: /^\/explore$/,
    key: 'explore',
    title: (t) => t('tribes_page.explore_title'),
    Icon: Users,
  },
  {
    pattern: /^\/tribes$/,
    key: 'tribes',
    title: (t) => t('tribes_page.explore_title'),
    Icon: Users,
  },
  {
    pattern: /^\/leaderboard$/,
    key: 'leaderboard',
    title: (t) => t('leaderboard.leaderboard', 'Liderlik Tablosu'),
    Icon: Podium,
  },
  {
    pattern: /^\/active-debates$/,
    key: 'active-debates',
    title: (t) => t('active_debates.title'),
    Icon: AngryBotWithSwordsIcon,
    help: (t) => ({
      title: t('active_debates.how_it_works_title'),
      items: [
        t('active_debates.how_it_works_1'),
        t('active_debates.how_it_works_2'),
      ],
    }),
  },
  {
    pattern: /^\/cards$/,
    key: 'cards',
    title: (t) => t('card.my_cards'),
    Icon: BotFlashCardsIcon,
    help: (t) => ({
      title: t('card.how_it_works_title'),
      items: [
        t('card.how_it_works_1'),
        t('card.how_it_works_2'),
        t('card.how_it_works_3'),
      ],
    }),
  },
  {
    pattern: /^\/feed\/([^/]+)/,
    key: 'feed',
    resolve: (pathname, t) => {
      const match = pathname.match(/^\/feed\/([^/]+)/)
      const feedType = match ? match[1] : ''
      if (feedType === 'recent') {
        return {
          key: 'feed-recent',
          title: t('sort.recent'),
          Icon: Sparkles,
        }
      }
      if (feedType === 'trending') {
        return {
          key: 'feed-trending',
          title: t('sort.popular'),
          Icon: Flame,
        }
      }
      if (feedType === 'mostLiked') {
        return {
          key: 'feed-mostLiked',
          title: t('sort.best'),
          Icon: ThumbsUp,
        }
      }
      if (feedType === 'mostDisliked') {
        return {
          key: 'feed-mostDisliked',
          title: t('sort.worst'),
          Icon: ThumbsDown,
        }
      }
      return {
        key: `feed-${feedType}`,
        title: t('topbar.feed', 'Feed'),
        Icon: Sparkles,
      }
    },
  },
  {
    pattern: /^\/enrich-news$/,
    key: 'enrich-news',
    title: (t) => t('news.enrich_news_title'),
    Icon: Sparkles,
    help: (t) => ({
      title: t('news.enrich_news_title'),
      items: [
        t('news.enrich_how_it_works_1', 'AI-assisted news aggregation and summarization pool.'),
      ],
    }),
  },
  {
    pattern: /^\/create-tribe$/,
    key: 'create-tribe',
    title: (t) => t('tribe_settings.create_tribe'),
    Icon: Users,
    help: (t) => ({
      title: t('tribe.how_it_works'),
      items: [
        t('tribe.how_it_works_1'),
        t('tribe.how_it_works_2'),
        t('tribe.how_it_works_3'),
        t('tribe.how_it_works_4'),
      ],
    }),
  },
  {
    pattern: /^\/tribe-settings/,
    key: 'tribe-settings',
    title: (t) => t('tribe_settings.title'),
    Icon: Settings,
  },
  {
    pattern: /^\/create-bot$/,
    key: 'create-bot',
    title: (t) => t('bot.create_bot'),
    Icon: Bot,
  },
  {
    pattern: /^\/edit-bot/,
    key: 'edit-bot',
    title: (t) => t('bot.bot_settings'),
    Icon: Bot,
  },
  {
    pattern: /^\/new-topic$/,
    key: 'new-topic',
    title: (t) => t('post.start_new_topic'),
    Icon: PenSquare,
  },
  {
    pattern: /^\/edit-post/,
    key: 'edit-post',
    title: (t) => t('post.edit_title'),
    Icon: Edit3,
  },
  {
    pattern: /^\/account-settings$/,
    key: 'account-settings',
    title: (t) => t('settings.account_settings'),
    Icon: Settings,
  },
  {
    pattern: /^\/basic-concepts$/,
    key: 'basic-concepts',
    title: (t) => t('hierarchy_info.title'),
    Icon: Layers,
  },
  {
    pattern: /^\/admin/,
    key: 'admin',
    title: (t) => t('admin.title'),
    Icon: Shield,
  },
  {
    pattern: /^\/init-profile$/,
    key: 'init-profile',
    title: (t) => t('auth.complete_profile'),
    Icon: User,
  },
  {
    pattern: /^\/about$/,
    key: 'about',
    title: (t) => t('about_page.title'),
    Icon: FileText,
  },
  {
    pattern: /^\/contact$/,
    key: 'contact',
    title: (t) => t('footer.contact'),
    Icon: FileText,
  },
  {
    pattern: /^\/terms$/,
    key: 'terms',
    title: () => 'Terms of Service',
    Icon: FileText,
  },
  {
    pattern: /^\/privacy$/,
    key: 'privacy',
    title: () => 'Privacy Policy',
    Icon: FileText,
  },
  {
    pattern: /^\/cookie-policy$/,
    key: 'cookie-policy',
    title: () => 'Cookie Policy',
    Icon: FileText,
  },
]

export function resolveMobilePageHeader(pathname, t) {
  for (const entry of MOBILE_PAGE_HEADERS) {
    if (entry.pattern.test(pathname)) {
      if (entry.resolve) {
        return entry.resolve(pathname, t)
      }
      return {
        key: entry.key,
        title: typeof entry.title === 'function' ? entry.title(t) : entry.title,
        Icon: entry.Icon,
        help: typeof entry.help === 'function' ? entry.help(t) : null,
      }
    }
  }
  return null
}
