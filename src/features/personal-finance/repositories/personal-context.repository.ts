import { getFirst } from '@/src/database/queries';

type AppSettingRecord = {
  setting_value: string | null;
};

export interface PersonalContext {
  owner_type: 'personal';
  owner_local_id: string;
  user_local_id: string;
}

export async function getPersonalContext() {
  const [userSetting, profileSetting] = await Promise.all([
    getFirst<AppSettingRecord>(
      `
        SELECT setting_value
        FROM app_settings
        WHERE setting_key = ?
        LIMIT 1
      `,
      ['active_user_local_id'],
    ),
    getFirst<AppSettingRecord>(
      `
        SELECT setting_value
        FROM app_settings
        WHERE setting_key = ?
        LIMIT 1
      `,
      ['active_personal_profile_local_id'],
    ),
  ]);

  if (!userSetting?.setting_value || !profileSetting?.setting_value) {
    throw new Error('Personal context is not available. Initial data may be missing.');
  }

  return {
    owner_type: 'personal',
    owner_local_id: profileSetting.setting_value,
    user_local_id: userSetting.setting_value,
  } satisfies PersonalContext;
}
