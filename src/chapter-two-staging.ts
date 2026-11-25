// Paragraph numbers are stable save locations in the complete FB2 chapter (zero-based).
export function chapterTwoScene(page: number) {
  if (page >= 89 && page <= 91) return { id: 'river', art: 'tantrumHill', label: 'Сухой травянистый подъём на большой холм; речка скрыта за гребнем' } as const;
  if (page >= 89) return { id: 'river', art: 'tantrumRiver', label: 'Травянистый склон над узкой речкой' } as const;
  if (page >= 33 && page <= 42 || page >= 85) return { id: 'gates', art: 'tantrumGates', label: 'Каменные ворота Тантрума, открытые створки и площадь перед входом' } as const;
  if (page >= 11 && page <= 32) return { id: 'road', art: 'tantrumRoad', label: 'Мощёная дорога между зелёными холмами по пути в Тантрум' } as const;
  return { id: 'meadow', art: 'tantrum', label: 'Луга у Тантрума, рощицы и петляющая речушка' } as const;
}

export const isStatusListing = (page: number) => page >= 45 && page <= 63;

// The current book line is rendered inside its actual interface field, never duplicated below.
export const statusGroups = [
  { name: 'Герой', pages: [46, 47, 48, 49, 50, 51] },
  { name: 'Характеристики', pages: [52, 53, 54, 55, 56, 57, 58] },
  { name: 'Дары и умения', pages: [59, 60, 61, 62, 63] },
] as const;
