import type { EventFieldProfile, TemplateFieldDef } from './manifest-types';



/** Manifest-driven field profiles — NOT hardcoded in create UI. */

export const EVENT_FIELD_PROFILES: Record<string, EventFieldProfile> = {

  wedding: {

    eventType: 'wedding',

    nameFields: ['groomName', 'brideName'],

  },

  uzatu: {

    eventType: 'uzatu',

    nameFields: ['honoreeName'],

    extraFieldKeys: ['honoreeName'],

  },

  generic: {

    eventType: 'generic',

    nameFields: ['groomName', 'brideName'],

  },

};



export function getEventFieldProfile(

  profileKey: string | undefined,

): EventFieldProfile {

  if (profileKey && EVENT_FIELD_PROFILES[profileKey]) {

    return EVENT_FIELD_PROFILES[profileKey];

  }

  return EVENT_FIELD_PROFILES.generic;

}



/** Filter manifest fields by event profile. */

export function fieldsForProfile(
  fields: TemplateFieldDef[],
  profile: EventFieldProfile,
): TemplateFieldDef[] {
  return fields.filter((f) => {
    if (!f.profiles || f.profiles.length === 0) return true;
    return f.profiles.includes(profile.eventType);
  });
}


