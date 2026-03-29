import { z } from 'zod';

export const createFileMetadataSchema = z.object({
    name: z.string().min(1),
    type: z.string().optional(),
    size: z.string().optional(),
    storagePath: z.string().optional(),
});
