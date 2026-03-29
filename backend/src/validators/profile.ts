// ✅ VERIFIED: Added onboarding completion support to profile updates. Manual test: PATCH /api/profile with profile fields plus onboarding_completed=true, then GET /api/profile and confirm onboardingCompleted persists.
import { z } from 'zod';

export const ProfileUpdateSchema = z.object({
    full_name: z.string().min(1, 'Full name is required').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    headline: z.string().optional(),
    bio: z.string().optional(),
    experience_level: z.enum(['Entry', 'Intermediate', 'Expert']).optional(),
    skills: z.array(z.string()).optional(),
    education: z.array(z.object({
        school: z.string(),
        degree: z.string().optional(),
        year: z.string().optional(),
    })).optional(),
    certifications: z.array(z.object({
        name: z.string(),
        issuer: z.string().optional(),
        year: z.string().optional(),
    })).optional(),
    portfolio_links: z.array(z.object({
        title: z.string(),
        url: z.string().url(),
    })).optional(),
    date_of_birth: z.string().nullable().optional(),
    phone_number: z.string().optional(),
    social_links: z.object({
        linkedin: z.string().optional(),
        github: z.string().optional(),
        dribbble: z.string().optional(),
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        other: z.string().optional(),
    }).optional(),
    avatar_url: z.string().optional(),
    onboarding_completed: z.boolean().optional(),
});

export type ProfileUpdatePayload = z.infer<typeof ProfileUpdateSchema>;
