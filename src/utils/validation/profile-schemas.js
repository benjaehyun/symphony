import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const profileValidation = {
  basicInfo: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    age: z
      .number()
      .min(18, "You must be at least 18 years old")
      .max(100, "Please enter a valid age"),
    gender: z
      .string()
      .refine((val) => ["man", "woman", "non-binary", "other"].includes(val), {
        message: "Please select a valid gender",
      }),
    bio: z
      .string()
      .min(10, "Bio must be at least 10 characters")
      .max(500, "Bio must be less than 500 characters")
      .trim(),
  }),

  photos: z.object({
    photos: z
      .array(
        z.object({
          url: z.string().url(),
          key: z.string(),
          order: z.number(),
        })
      )
      .min(1, "Please upload at least one photo")
      .max(6, "Maximum 6 photos allowed"),
  }),

  preferences: z.object({
    genderPreference: z
      .array(z.string())
      .min(1, "Please select at least one gender preference"),
    ageRange: z.object({
      min: z.number().min(18).max(100),
      max: z.number().min(18).max(100),
    })
    .refine((data) => data.max >= data.min, {
      message: "Maximum age must be greater than minimum age",
      path: ["max"],
    }),
    maxDistance: z
      .number()
      .min(1, "Distance must be at least 1km")
      .max(150, "Maximum distance is 150km"),
  }),

  musicTaste: z.object({
    sourceType: z
      .enum(["playlist", "top_tracks"])
      .refine((val) => ["playlist", "top_tracks"].includes(val), {
        message: "Please select a valid music source",
      }),
    sourceId: z.string().optional(),
  }),
};

// Validation helper functions
export const validateBasicInfo = async (data) => {
  try {
    await profileValidation.basicInfo.parseAsync(data);
    return { isValid: true, errors: null };
  } catch (error) {
    return {
      isValid: false,
      errors: error.errors.reduce((acc, curr) => ({
        ...acc,
        [curr.path[0]]: curr.message
      }), {})
    };
  }
};

export const validatePhotoUpload = async (data) => {
  try {
    await profileValidation.photos.parseAsync(data);
    return { isValid: true, errors: null };
  } catch (error) {
    return {
      isValid: false,
      errors: error.errors.reduce((acc, curr) => ({
        ...acc,
        [curr.path[0]]: curr.message
      }), {})
    };
  }
};

export const validatePreferences = async (data) => {
  try {
    await profileValidation.preferences.parseAsync(data);
    return { isValid: true, errors: null };
  } catch (error) {
    return {
      isValid: false,
      errors: error.errors.reduce((acc, curr) => ({
        ...acc,
        [curr.path[0]]: curr.message
      }), {})
    };
  }
};

export const validateMusicTaste = async (data) => {
  try {
    await profileValidation.musicTaste.parseAsync(data);
    return { isValid: true, errors: null };
  } catch (error) {
    return {
      isValid: false,
      errors: error.errors.reduce((acc, curr) => ({
        ...acc,
        [curr.path[0]]: curr.message
      }), {})
    };
  }
};