// ✅ VERIFIED: Mapped validated profile payload keys into the Drizzle profile columns so onboarding/profile saves persist correctly. Manual test: PATCH /api/profile, reload /api/profile, and confirm fullName/username/onboardingCompleted update.
import * as profileDb from '@/db/profileDb';
import type { ProfileUpdatePayload } from '@/validators/profile';

function mapProfilePayload(payload: ProfileUpdatePayload) {
  return {
    ...(payload.full_name !== undefined ? { fullName: payload.full_name } : {}),
    ...(payload.username !== undefined ? { username: payload.username } : {}),
    ...(payload.headline !== undefined ? { headline: payload.headline } : {}),
    ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
    ...(payload.experience_level !== undefined
      ? { experienceLevel: payload.experience_level }
      : {}),
    ...(payload.skills !== undefined ? { skills: payload.skills } : {}),
    ...(payload.education !== undefined ? { education: payload.education } : {}),
    ...(payload.certifications !== undefined
      ? { certifications: payload.certifications }
      : {}),
    ...(payload.portfolio_links !== undefined
      ? { portfolioLinks: payload.portfolio_links }
      : {}),
    ...(payload.date_of_birth !== undefined
      ? { dateOfBirth: payload.date_of_birth }
      : {}),
    ...(payload.phone_number !== undefined
      ? { phoneNumber: payload.phone_number }
      : {}),
    ...(payload.social_links !== undefined
      ? { socialLinks: payload.social_links }
      : {}),
    ...(payload.avatar_url !== undefined ? { avatarUrl: payload.avatar_url } : {}),
    ...(payload.onboarding_completed !== undefined
      ? { onboardingCompleted: payload.onboarding_completed }
      : {}),
  };
}

export async function getMyProfile(userId: string) {
  return profileDb.getProfileByUserId(userId);
}

export async function updateMyProfile(userId: string, payload: ProfileUpdatePayload) {
  if (payload.username) {
    const isAvailable = await profileDb.checkUsernameAvailability(payload.username, userId);
    if (!isAvailable) {
      throw new Error('Username is already taken');
    }
  }

  return profileDb.updateProfile(userId, mapProfilePayload(payload));
}

export async function checkUsername(username: string, excludeUserId?: string) {
  return profileDb.checkUsernameAvailability(username, excludeUserId);
}
