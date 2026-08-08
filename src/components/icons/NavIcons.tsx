import gardenIcon from '../../assets/nav-icons/garden.svg';
import choresIcon from '../../assets/nav-icons/chores.svg';
import moneyIcon from '../../assets/nav-icons/money.svg';
import bookIcon from '../../assets/nav-icons/book.svg';
import childrenIcon from '../../assets/nav-icons/children.svg';
import settingsIcon from '../../assets/nav-icons/settings.svg';

const NavIconImg = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} width={24} height={24} style={{ objectFit: 'contain' }} />
);

export const GardenNavIcon = () => <NavIconImg src={gardenIcon} alt="" />;
export const ChoresNavIcon = () => <NavIconImg src={choresIcon} alt="" />;
export const MoneyNavIcon = () => <NavIconImg src={moneyIcon} alt="" />;
export const BookNavIcon = () => <NavIconImg src={bookIcon} alt="" />;
export const ChildrenNavIcon = () => <NavIconImg src={childrenIcon} alt="" />;
export const SettingsNavIcon = () => <NavIconImg src={settingsIcon} alt="" />;
