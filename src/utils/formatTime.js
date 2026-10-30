import { formatDistanceToNow } from 'date-fns'
import { tr, enUS, de, fr, ar, hi, ja } from 'date-fns/locale'
import i18n from '../i18n'

const LOCALE_MAP = {
  tr,
  en: enUS,
  de,
  fr,
  ar,
  hi,
  ja,
}

export function getShortTimeAgo(date) {
  if (!date) return ''

  const rawLang = i18n.language || 'en'
  const lang = rawLang.split('-')[0].toLowerCase()
  const locale = LOCALE_MAP[lang] || enUS

  let timeAgo = formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale,
  })

  if (lang === 'tr') {
    timeAgo = timeAgo.replace('yaklaşık ', '')
    timeAgo = timeAgo.replace('neredeyse ', '')
    timeAgo = timeAgo.replace('birkaç saniyeden az önce', 'az önce')
    timeAgo = timeAgo.replace('bir dakikadan az önce', 'az önce')
    timeAgo = timeAgo.replace('yarım dakika önce', 'az önce')
    timeAgo = timeAgo.replace(' saniyeden az önce', ' saniye önce')
    timeAgo = timeAgo.replace(' dakikadan az önce', ' dakika önce')
    timeAgo = timeAgo.replace(' yıldan fazla', ' yıl')
    timeAgo = timeAgo.replace('birkaç saniyeden az sonra', 'az önce')
    timeAgo = timeAgo.replace('bir dakikadan az sonra', 'az önce')
    timeAgo = timeAgo.replace('yarım dakika sonra', 'az önce')
    timeAgo = timeAgo.replace(' saniyeden az sonra', ' saniye sonra')
    timeAgo = timeAgo.replace(' dakikadan az sonra', ' dakika sonra')
  } else if (lang === 'en') {
    timeAgo = timeAgo.replace('about ', '')
    timeAgo = timeAgo.replace('almost ', '')
    timeAgo = timeAgo.replace('less than a minute ago', 'just now')
    timeAgo = timeAgo.replace('less than a second ago', 'just now')
    timeAgo = timeAgo.replace('half a minute ago', 'just now')
    timeAgo = timeAgo.replace('in less than a minute', 'just now')
    timeAgo = timeAgo.replace('in less than a second', 'just now')
    timeAgo = timeAgo.replace('in half a minute', 'just now')
    timeAgo = timeAgo.replace('over ', '')
  } else if (lang === 'de') {
    timeAgo = timeAgo.replace('etwa ', '')
    timeAgo = timeAgo.replace('fast ', '')
    timeAgo = timeAgo.replace('weniger als eine Minute zuvor', 'gerade eben')
    timeAgo = timeAgo.replace('weniger als eine Minute', 'gerade eben')
    timeAgo = timeAgo.replace('mehr als ', '')
  } else if (lang === 'fr') {
    timeAgo = timeAgo.replace('environ ', '')
    timeAgo = timeAgo.replace('presque ', '')
    timeAgo = timeAgo.replace('moins d’une minute', 'à l’instant')
    timeAgo = timeAgo.replace('moins d\'une minute', 'à l’instant')
    timeAgo = timeAgo.replace('plus de ', '')
  } else if (lang === 'ja') {
    timeAgo = timeAgo.replace('約', '')
    timeAgo = timeAgo.replace('1分未満前', 'たった今')
    timeAgo = timeAgo.replace('1分未満後', 'たった今')
  } else if (lang === 'ar') {
    timeAgo = timeAgo.replace('حوالي ', '')
    timeAgo = timeAgo.replace('أقل من دقيقة', 'الآن')
  } else if (lang === 'hi') {
    timeAgo = timeAgo.replace('लगभग ', '')
    timeAgo = timeAgo.replace('1 मिनट से भी कम', 'अभी')
  }

  return timeAgo
}
