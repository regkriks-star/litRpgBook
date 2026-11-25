import paragraphs from './chapter-one.json';

const paragraph = (index: number) => paragraphs[index].map(run => run.text).join('');
export const cards = {
  alchemist: {
    title: 'Боевой алхимик', frame: 0,
    description: paragraph(27).slice('— «Боевой алхимик» — '.length),
  },
  blood: {
    title: 'Рыцарь крови', frame: 1,
    description: 'Бессмертные, восстанавливающиеся за счет похищенной крови, способные порабощать невинных смертных одним взглядом! Они могут изучить великие заклинания тьмы, очень сильны в ближнем бою, могут призывать прислужников, порабощать врагов, поднимать мертвых!',
  },
  lady: {
    title: 'Рыцарь Прекрасной Дамы', frame: 2,
    // Verbatim class description from chapter 3; no invented stats.
    description: 'Он действует по зову сердца, готовый посвятить свои дела и помыслы своей избраннице. Защитник, кавалер, герой… он не отходит от идеалов рыцарства и куртуазности, совершая подвиги во имя любви.',
  },
  ocean: { title: 'Океан опыта', frame: 3, description: paragraph(85).split('» — ')[1] },
  genius: { title: 'Гений', frame: 4, description: paragraph(86).split('» — ')[1] },
  victories: { title: 'Череда побед', frame: 5, description: paragraph(87).split('» — ')[1] },
};
export type CardId = keyof typeof cards;
export const gifts = ['ocean', 'genius', 'victories'] as const;
export const giftReplies = {
  ocean: 'Двести процентов — заманчиво. Но мне нужен дар, который вознаграждает упорство.',
  genius: 'Стать гением одним нажатием? Звучит неплохо. Всё-таки у меня другой план.',
  victories: 'Вот оно. Одно дело, снова и снова — это по мне.',
};

const goddessLines = new Set([0, 4, 6, 7, 9, 12, 15, 17, 19, 25, 30, 32, 35, 41, 43, 45, 47, 49, 52, 55, 57, 59, 63, 65, 67, 70, 72, 74, 76, 82, 90, 97, 99, 100, 103, 105, 107]);
export function chapterSpeaker(page: number) {
  if (goddessLines.has(page)) return 'goddess';
  if (paragraph(page).startsWith('—') && page !== 27) return 'soul';
  return 'narrator';
}

export function cardForPage(page: number): CardId | null {
  if (page >= 26 && page <= 28) return 'alchemist';
  if (page >= 38 && page <= 48) return 'blood';
  if (page >= 60 && page <= 81) return 'lady';
  return null;
}

export function cardCount(page: number) {
  if (page >= 25 && page < 36) return 72;
  if (page >= 36 && page < 38) return 12;
  if (page >= 38 && page < 48) return 1;
  if (page >= 82 && page < 84) return 72;
  return 0;
}

export function goddessPose(page: number) {
  if (page >= 111) return 'dismiss';
  if (page >= 107) return 'covered';
  if (page >= 99 && page <= 100) return 'casting';
  if (page >= 92 && page <= 98) return 'casting';
  if (page === 90) return 'puzzled';
  if (page >= 82 && page <= 83) return 'cards';
  if (page === 81) return 'voice';
  if (page >= 76 && page <= 80) return 'shy';
  if (page >= 70 && page <= 75) return 'clap';
  if (page === 69) return 'casting';
  if (page >= 65 && page <= 68) return 'resolve';
  if (page === 63) return 'clap';
  if (page >= 59 && page <= 62) return 'cards';
  if (page >= 51 && page <= 58) return 'resolve';
  if (page >= 49 && page <= 50) return 'shy';
  if (page === 47) return 'clap';
  if (page >= 41 && page <= 46) return 'resolve';
  if (page >= 36 && page <= 38) return 'cards';
  if (page >= 28 && page <= 33) return 'reading';
  if (page >= 25 && page <= 27) return 'cards';
  if (page >= 20) return 'regal';
  if (page === 19) return 'resolve';
  if (page >= 15) return 'alarmed';
  if (page >= 12) return 'puzzled';
  if (page >= 7 && page <= 9) return 'voice';
  return 'regal';
}

export function chapterCue(page: number) {
  const cues: Record<number, string> = { 0: 'arrival', 2: 'world', 9: 'grant', 11: 'silence', 12: 'puzzled', 15: 'alarm', 19: 'resolve', 21: 'shadow', 22: 'shadow', 25: 'cards', 36: 'filter', 38: 'blood', 48: 'dissolve', 51: 'warning', 52: 'warning', 57: 'strike', 60: 'gold', 63: 'clap', 69: 'rewrite', 70: 'rewritten', 78: 'choke', 82: 'gifts', 92: 'creation', 93: 'appearance', 98: 'name', 99: 'summon', 100: 'summon', 101: 'rebirth', 104: 'kneel', 106: 'stand', 107: 'cover', 109: 'approach', 111: 'banish', 112: 'fall' };
  return cues[page] ?? '';
}
