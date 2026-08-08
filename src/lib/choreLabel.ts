import type { TFunction } from 'i18next';
import type { ChoreTemplate } from '../types/models';

// Icons used by the default templates seeded at family signup (see
// DEFAULT_CHORE_TEMPLATES in AuthContext.tsx). Their `label` field is baked
// in at whatever language the parent was using during signup, so templates
// still on a default icon are re-translated live instead of using the
// stored text — custom templates the parent typed themselves keep their
// literal stored label.
const DEFAULT_ICON_TO_KEY: Record<string, string> = {
  bed: 'make_bed',
  dishes: 'dishes',
  toybox: 'tidy_room',
  trash: 'take_out_rubbish',
  pet: 'feed_pet',
};

export const resolveTemplateLabel = (template: ChoreTemplate, t: TFunction): string => {
  const key = DEFAULT_ICON_TO_KEY[template.icon];
  return key ? t(`default_chores.${key}`) : template.label;
};
