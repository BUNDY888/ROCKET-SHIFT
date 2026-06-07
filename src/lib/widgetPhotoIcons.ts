import type { WidgetIconOption } from './widgetIcons';
import arnoldPose from '../assets/widget-arnold.png';
import arnoldClassic from '../assets/widget-arnold-classic.png';
import arnoldCigar from '../assets/widget-arnold-cigar.png';
import billyPose from '../assets/widget-billy.png';
import billyBar from '../assets/widget-billy-bar.png';
import brad from '../assets/widget-brad.png';
import bradFightclub from '../assets/widget-brad-fightclub.png';
import batemanBlood from '../assets/widget-bateman-blood.png';
import batemanPhone from '../assets/widget-bateman-phone.png';
import fearLoathing from '../assets/widget-fear-loathing.png';
import godfather from '../assets/widget-godfather.png';
import gta from '../assets/widget-gta.png';
import hammerMan from '../assets/widget-hammer-man.png';
import hannibal from '../assets/widget-hannibal.png';
import ironman from '../assets/widget-ironman.png';
import jeanette from '../assets/widget-jeanette.png';
import joker from '../assets/widget-joker.png';
import johnny from '../assets/widget-johnny.png';
import monkeyBrain from '../assets/widget-monkey-brain.png';
import monkeyCoast from '../assets/widget-monkey-coast.png';
import monkeyOffice from '../assets/widget-monkey-office.png';
import newRocket from '../assets/widget-new-rocket.png';
import putin from '../assets/widget-putin.png';
import ryan from '../assets/widget-ryan.png';
import scarfaceDesk from '../assets/widget-scarface-desk.png';
import scarfaceGun from '../assets/widget-scarface-gun.png';
import snoop from '../assets/widget-snoop.png';
import tyson from '../assets/widget-tyson.png';
import zhirinovsky from '../assets/widget-zhirinovsky.png';

/** Фото-значки виджета (эмодзи в списке — для подписи в настройках). */
export const WIDGET_PHOTO_ICON_OPTIONS: WidgetIconOption[] = [
  { id: 'photo:arnold', emoji: '💪', label: 'Шварценеггер', imageSrc: arnoldPose },
  { id: 'photo:arnold-classic', emoji: '🏋️', label: 'Арнольд (классика)', imageSrc: arnoldClassic },
  { id: 'photo:billy', emoji: '💜', label: 'Гачимучи', imageSrc: billyPose },
  { id: 'photo:billy-bar', emoji: '🥃', label: 'Бар', imageSrc: billyBar },
  { id: 'photo:scarface-desk', emoji: '🎬', label: 'Скарфейс (стол)', imageSrc: scarfaceDesk },
  { id: 'photo:godfather', emoji: '🌹', label: 'Крёстный отец', imageSrc: godfather },
  { id: 'photo:scarface-gun', emoji: '🔫', label: 'Скарфейс', imageSrc: scarfaceGun },
  { id: 'photo:jeanette', emoji: '🧛', label: 'Джанет', imageSrc: jeanette },
  { id: 'photo:ironman', emoji: '⚡', label: 'Железный человек', imageSrc: ironman },
  { id: 'photo:new-rocket', emoji: '🚀', label: 'Ракета (контур)', imageSrc: newRocket },
  { id: 'photo:new-monkey-office', emoji: '🐒', label: 'Обезьяна за ПК', imageSrc: monkeyOffice },
  { id: 'photo:new-zhirinovsky', emoji: '🍷', label: 'Жириновский', imageSrc: zhirinovsky },
  { id: 'photo:new-brad', emoji: '😎', label: 'Брэд Питт', imageSrc: brad },
  { id: 'photo:new-hammer-man', emoji: '🔨', label: 'Мужик с молотом', imageSrc: hammerMan },
  { id: 'photo:new-hannibal', emoji: '🎧', label: 'Ганнибал', imageSrc: hannibal },
  { id: 'photo:new-snoop', emoji: '🎵', label: 'Snoop Dogg', imageSrc: snoop },
  { id: 'photo:new-ryan', emoji: '🏖️', label: 'Райан Гослинг', imageSrc: ryan },
  { id: 'photo:new-bateman-phone', emoji: '📞', label: 'Бейтман с телефоном', imageSrc: batemanPhone },
  { id: 'photo:new-tyson', emoji: '🥊', label: 'Майк Тайсон', imageSrc: tyson },
  { id: 'photo:new-bateman-blood', emoji: '🩸', label: 'Бейтман (кровь)', imageSrc: batemanBlood },
  { id: 'photo:new-arnold-cigar', emoji: '🚬', label: 'Арнольд с сигарой', imageSrc: arnoldCigar },
  { id: 'photo:new-johnny', emoji: '🥤', label: 'Johnny с кокой', imageSrc: johnny },
  { id: 'photo:new-joker', emoji: '🃏', label: 'Джокер', imageSrc: joker },
  { id: 'photo:new-monkey-coast', emoji: '🌊', label: 'Обезьяна у моря', imageSrc: monkeyCoast },
  { id: 'photo:new-fear-loathing', emoji: '🕶️', label: 'Hunter S. Thompson', imageSrc: fearLoathing },
  { id: 'photo:new-brad-fightclub', emoji: '👊', label: 'Брэд (Fight Club)', imageSrc: bradFightclub },
  { id: 'photo:new-gta', emoji: '🎮', label: 'GTA NPC', imageSrc: gta },
  { id: 'photo:new-monkey-brain', emoji: '🧠', label: 'Обезьяна-стикер', imageSrc: monkeyBrain },
  { id: 'photo:new-putin', emoji: '🧊', label: 'Путин', imageSrc: putin },
];
