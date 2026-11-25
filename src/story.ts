import book from './book.json' with { type: 'json' };

export type Speaker = 'mach' | 'sayaka' | 'narrator' | 'clerk';
export type Line = { id: string; paragraph: number; speaker: Speaker; text: string };
export const lines = book as Line[];
export const speakers: Record<Speaker, string> = {
  mach: 'Мач Крайм', sayaka: 'Саяка Такамацури', narrator: 'Мач · мысли', clerk: 'Регистраторша',
};
export const passage = (from: number, to = from) => lines.filter(line => line.paragraph >= from && line.paragraph <= to).map(line => line.id);
export const findLine = (id: string) => lines.find(line => line.id === id)!;
export const endings = passage(13, 25);
export const bookRoute = [
  'Первый бой: электрический болт Саяки и укол скорпиона происходят в начале сцены.',
  'Атака топором → Атака топором → Атака топором. Прочитайте реплики между действиями.',
  'Второй скорпион появляется сам и жалит Саяку.',
  'Выждать → Прикрыть Саяку → Атака топором → Атака топором → Атака топором.',
  'Нажмите «После боя» и дочитайте сцену до разговора в Гильдии.',
];
