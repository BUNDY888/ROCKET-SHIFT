import { WIDGET_PHOTO_ICON_OPTIONS } from './widgetPhotoIcons';

/** id сохраняется в настройках при загрузке своего фото */
export const WIDGET_ICON_CUSTOM = 'photo:custom';

export interface WidgetIconOption {
  id: string;
  emoji: string;
  label: string;
  /** PNG/WebP для виджета и превью в настройках */
  imageSrc?: string;
}

const WIDGET_EMOJI_ICON_OPTIONS: WidgetIconOption[] = [

  // Вера
  { id: '✝️', emoji: '✝️', label: 'Крест' },
  { id: '☦️', emoji: '☦️', label: 'Православие' },
  { id: '☪️', emoji: '☪️', label: 'Ислам' },
  { id: '✡️', emoji: '✡️', label: 'Иудаизм' },
  { id: '☸️', emoji: '☸️', label: 'Буддизм' },
  { id: '🕉️', emoji: '🕉️', label: 'Индуизм' },
  { id: '☯️', emoji: '☯️', label: 'Даосизм' },
  { id: '🛐', emoji: '🛐', label: 'Молитва' },
  { id: '🙏', emoji: '🙏', label: 'Благодарность' },
  { id: '👼', emoji: '👼', label: 'Ангел' },
  { id: '☮️', emoji: '☮️', label: 'Мир' },
  { id: '🕯️', emoji: '🕯️', label: 'Свеча' },
  { id: '📿', emoji: '📿', label: 'Чётки' },
  { id: '🕌', emoji: '🕌', label: 'Мечеть' },
  { id: '⛪', emoji: '⛪', label: 'Церковь' },
  { id: '🕍', emoji: '🕍', label: 'Синагога' },
  { id: '⛩️', emoji: '⛩️', label: 'Синто' },

  // Бренды (emoji-ассоциации, не официальные логотипы)
  { id: 'brand:apple', emoji: '🍎', label: 'Apple' },
  { id: 'brand:google', emoji: '🔎', label: 'Google' },
  { id: 'brand:microsoft', emoji: '🪟', label: 'Microsoft' },
  { id: 'brand:amazon', emoji: '📦', label: 'Amazon' },
  { id: 'brand:meta', emoji: '👍', label: 'Meta' },
  { id: 'brand:instagram', emoji: '📸', label: 'Instagram' },
  { id: 'brand:tiktok', emoji: '🎵', label: 'TikTok' },
  { id: 'brand:youtube', emoji: '▶️', label: 'YouTube' },
  { id: 'brand:netflix', emoji: '🍿', label: 'Netflix' },
  { id: 'brand:spotify', emoji: '🎶', label: 'Spotify' },
  { id: 'brand:nike', emoji: '👟', label: 'Nike' },
  { id: 'brand:adidas', emoji: '👕', label: 'Adidas' },
  { id: 'brand:tesla', emoji: '🔋', label: 'Tesla' },
  { id: 'brand:starbucks', emoji: '☕', label: 'Starbucks' },
  { id: 'brand:mcdonalds', emoji: '🍟', label: "McDonald's" },
  { id: 'brand:cocacola', emoji: '🥤', label: 'Coca-Cola' },
  { id: 'brand:pepsi', emoji: '🧊', label: 'Pepsi' },
  { id: 'brand:redbull', emoji: '🐂', label: 'Red Bull' },
  { id: 'brand:disney', emoji: '🏰', label: 'Disney' },
  { id: 'brand:playstation', emoji: '🎮', label: 'PlayStation' },
  { id: 'brand:nintendo', emoji: '🍄', label: 'Nintendo' },
  { id: 'brand:telegram', emoji: '✈️', label: 'Telegram' },
  { id: 'brand:whatsapp', emoji: '💬', label: 'WhatsApp' },
  { id: 'brand:twitter', emoji: '🐦', label: 'X / Twitter' },
  { id: 'brand:discord', emoji: '💜', label: 'Discord' },
  { id: 'brand:github', emoji: '🐙', label: 'GitHub' },
  { id: 'brand:reddit', emoji: '🤖', label: 'Reddit' },
  { id: 'brand:samsung', emoji: '📱', label: 'Samsung' },
  { id: 'brand:intel', emoji: '💾', label: 'Intel' },
  { id: 'brand:uber', emoji: '🚕', label: 'Uber' },
  { id: 'brand:airbnb', emoji: '🏠', label: 'Airbnb' },
  { id: 'brand:paypal', emoji: '💳', label: 'PayPal' },
  { id: 'brand:bmw', emoji: '🚗', label: 'BMW' },
  { id: 'brand:ferrari', emoji: '🏎️', label: 'Ferrari' },
  { id: 'brand:rolex', emoji: '⌚', label: 'Rolex' },
  { id: 'brand:gucci', emoji: '👜', label: 'Gucci' },
  { id: 'brand:chanel', emoji: '💄', label: 'Chanel' },

  // Характер
  { id: '😈', emoji: '😈', label: 'Дьяволский режим' },
  { id: '🥷', emoji: '🥷', label: 'Ниндзя' },
  { id: '🧛', emoji: '🧛', label: 'Ночной вампир' },
  { id: '☠️', emoji: '☠️', label: 'Без пощады' },
  { id: '🗡️', emoji: '🗡️', label: 'Клинок' },
  { id: '🏴‍☠️', emoji: '🏴‍☠️', label: 'Пират' },
  { id: '🧙', emoji: '🧙', label: 'Маг' },
  { id: '🦸', emoji: '🦸', label: 'Супергерой' },
  { id: '🫡', emoji: '🫡', label: 'Salute' },
  { id: '💅', emoji: '💅', label: 'Main character' },

  // Стиль
  { id: '🔮', emoji: '🔮', label: 'Предсказание' },
  { id: '🌈', emoji: '🌈', label: 'Радуга' },
  { id: '🌙', emoji: '🌙', label: 'Ночная смена' },
  { id: '🌌', emoji: '🌌', label: 'Космос' },
  { id: '🌀', emoji: '🌀', label: 'Вихрь' },
  { id: '⚛️', emoji: '⚛️', label: 'Атом' },
  { id: '🎨', emoji: '🎨', label: 'Творец' },
  { id: '🦋', emoji: '🦋', label: 'Трансформация' },
  { id: '🍄', emoji: '🍄', label: 'Power-up' },
  { id: '🧨', emoji: '🧨', label: 'Фейерверк' },
  { id: '💥', emoji: '💥', label: 'Бум' },

  // Звери
  { id: '🐉', emoji: '🐉', label: 'Дракон' },
  { id: '🦄', emoji: '🦄', label: 'Единорог' },
  { id: '🦊', emoji: '🦊', label: 'Лиса' },
  { id: '🐺', emoji: '🐺', label: 'Волк' },
  { id: '🦉', emoji: '🦉', label: 'Мудрость' },
  { id: '🐙', emoji: '🐙', label: 'Осьминог' },
  { id: '🦈', emoji: '🦈', label: 'Акула' },
  { id: '🐧', emoji: '🐧', label: 'Пингвин' },
  { id: '🦥', emoji: '🦥', label: 'Ленивец' },
  { id: '🦔', emoji: '🦔', label: 'Ёжик' },
  { id: '🐻‍❄️', emoji: '🐻‍❄️', label: 'Полярный медведь' },

  // Безумие
  { id: '🍕', emoji: '🍕', label: 'Пицца-тайм' },
  { id: '🌮', emoji: '🌮', label: 'Тако' },
  { id: '🧋', emoji: '🧋', label: 'Bubble tea' },
  { id: '🌭', emoji: '🌭', label: 'Хот-дог' },
  { id: '🥑', emoji: '🥑', label: 'Avocado' },
  { id: '🧃', emoji: '🧃', label: 'Сок' },
  { id: '🎪', emoji: '🎪', label: 'Цирк' },
  { id: '🎭', emoji: '🎭', label: 'Драма' },
  { id: '🤡', emoji: '🤡', label: 'Клоун' },
  { id: '🎸', emoji: '🎸', label: 'Рок' },
  { id: '🎤', emoji: '🎤', label: 'На сцене' },

  // Игры и ретро
  { id: '🎮', emoji: '🎮', label: 'Геймпад' },
  { id: '👾', emoji: '👾', label: 'Аркада' },
  { id: '🕹️', emoji: '🕹️', label: 'Джойстик' },
  { id: '🏎️', emoji: '🏎️', label: 'Гонки' },
  { id: '🛹', emoji: '🛹', label: 'Скейт' },
  { id: '🎬', emoji: '🎬', label: 'Кино' },
  { id: '🛸', emoji: '🛸', label: 'НЛО' },
  { id: '👽', emoji: '👽', label: 'Пришелец' },

  // Космос
  { id: '⭐', emoji: '⭐', label: 'Звезда' },
  { id: '🎯', emoji: '🎯', label: 'Цель' },
  { id: '🏆', emoji: '🏆', label: 'Кубок' },

  // Энергия
  { id: '⚡', emoji: '⚡', label: 'Молния' },
  { id: '🔥', emoji: '🔥', label: 'Огонь' },
  { id: '💪', emoji: '💪', label: 'Сила' },
  { id: '✨', emoji: '✨', label: 'Искры' },
  { id: '💎', emoji: '💎', label: 'Алмаз' },
  { id: '🥶', emoji: '🥶', label: 'Ice cold' },
  { id: '🫨', emoji: '🫨', label: 'Тряска' },

  // Мемы
  { id: '🧌', emoji: '🧌', label: 'Шрек' },
  { id: '🐸', emoji: '🐸', label: 'Pepe' },
  { id: '🐶', emoji: '🐶', label: 'Doge' },
  { id: '🗿', emoji: '🗿', label: 'Моаи' },
  { id: '🦍', emoji: '🦍', label: 'Монке' },
  { id: '🐱', emoji: '🐱', label: 'Grumpy Cat' },
  { id: '🧟', emoji: '🧟', label: 'Зомби' },
  { id: '🤠', emoji: '🤠', label: 'Ковбой' },
  { id: '💀', emoji: '💀', label: 'Скелет' },
  { id: '👀', emoji: '👀', label: 'Глаза' },
  { id: '😎', emoji: '😎', label: 'Крутой' },
  { id: '📈', emoji: '📈', label: 'Stonks' },
  { id: '📉', emoji: '📉', label: 'Не stonks' },
  { id: '🙃', emoji: '🙃', label: 'Перевёрнутый' },
  { id: '🤯', emoji: '🤯', label: 'Взрыв мозга' },
  { id: '🫠', emoji: '🫠', label: 'Растаял' },
  { id: '🗣️', emoji: '🗣️', label: 'Крик' },
  { id: '🧢', emoji: '🧢', label: 'Cap' },

  // Успех
  { id: '💰', emoji: '💰', label: 'Деньги' },
  { id: '🤑', emoji: '🤑', label: 'Богатство' },
  { id: '👑', emoji: '👑', label: 'Корона' },
  { id: '🥇', emoji: '🥇', label: 'Первое место' },
  { id: '💵', emoji: '💵', label: 'Кэш' },
  { id: '🏦', emoji: '🏦', label: 'Капитал' },
  { id: '🛥️', emoji: '🛥️', label: 'Яхта' },
  { id: '🍾', emoji: '🍾', label: 'Праздник' },
  { id: '🤵', emoji: '🤵', label: 'Босс' },
  { id: '💼', emoji: '💼', label: 'Дело' },

  // Продуктивность
  { id: '✅', emoji: '✅', label: 'Сделано' },
  { id: '📋', emoji: '📋', label: 'Задачи' },
  { id: '⏰', emoji: '⏰', label: 'Время' },
  { id: '📅', emoji: '📅', label: 'Календарь' },
  { id: '🧠', emoji: '🧠', label: 'Фокус' },
  { id: '☕', emoji: '☕', label: 'Режим' },
  { id: '📝', emoji: '📝', label: 'Заметки' },
  { id: '🗂️', emoji: '🗂️', label: 'Порядок' },
  { id: '💡', emoji: '💡', label: 'Идея' },
  { id: '🎧', emoji: '🎧', label: 'Дип-ворк' },
];

/** id сохраняется в настройках (widgetIcon) */
export const WIDGET_ICON_OPTIONS: WidgetIconOption[] = [
  ...WIDGET_PHOTO_ICON_OPTIONS.filter((o) => o.id === 'photo:new-rocket'),
  ...WIDGET_EMOJI_ICON_OPTIONS,
  ...WIDGET_PHOTO_ICON_OPTIONS.filter((o) => o.id !== 'photo:new-rocket'),
];

export const WIDGET_ICONS = WIDGET_ICON_OPTIONS.map((o) => o.id);

export function getWidgetIconOption(iconId: string): WidgetIconOption | undefined {
  return WIDGET_ICON_OPTIONS.find((o) => o.id === iconId);
}

export function getWidgetIconEmoji(iconId: string): string {
  return getWidgetIconOption(iconId)?.emoji ?? '🚀';
}

export function normalizeWidgetIcon(iconId: string): string {
  if (iconId === WIDGET_ICON_CUSTOM) return iconId;
  return WIDGET_ICON_OPTIONS.some((o) => o.id === iconId) ? iconId : 'photo:new-rocket';
}
