import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

/**
 * Validation middleware factory
 * Creates a middleware that validates request body/params/query against a Joi schema
 */
export const validate = (
  schema: Joi.ObjectSchema,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Report all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace the original data with the validated/sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Enhanced validation middleware that supports validating multiple sources
 */
export const validateRequest = (schemas: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{ source: string; field: string; message: string }> = [];

    // Validate body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            source: 'body',
            field: detail.path.join('.'),
            message: detail.message,
          }))
        );
      } else {
        req.body = value;
      }
    }

    // Validate params
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            source: 'params',
            field: detail.path.join('.'),
            message: detail.message,
          }))
        );
      } else {
        req.params = value;
      }
    }

    // Validate query
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            source: 'query',
            field: detail.path.join('.'),
            message: detail.message,
          }))
        );
      } else {
        req.query = value;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

/**
 * Common Joi validation schemas
 */

// ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be positive',
    'any.required': 'ID is required',
  }),
});

// UUID parameter validation
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID must be a valid UUID',
    'any.required': 'ID is required',
  }),
}).unknown(true); // Allow other params to pass through

// Nested resource UUID validation schemas
export const addressIdParamSchema = Joi.object({
  id: Joi.string().uuid().messages({
    'string.guid': 'Profile ID must be a valid UUID',
  }),
  addressId: Joi.string().uuid().required().messages({
    'string.guid': 'Address ID must be a valid UUID',
    'any.required': 'Address ID is required',
  }),
});

export const skillIdParamSchema = Joi.object({
  id: Joi.string().uuid().messages({
    'string.guid': 'Profile ID must be a valid UUID',
  }),
  skillId: Joi.string().uuid().required().messages({
    'string.guid': 'Skill ID must be a valid UUID',
    'any.required': 'Skill ID is required',
  }),
});

export const qualificationIdParamSchema = Joi.object({
  id: Joi.string().uuid().messages({
    'string.guid': 'Profile ID must be a valid UUID',
  }),
  qualificationId: Joi.string().uuid().required().messages({
    'string.guid': 'Qualification ID must be a valid UUID',
    'any.required': 'Qualification ID is required',
  }),
});

export const documentIdParamSchema = Joi.object({
  id: Joi.string().uuid().messages({
    'string.guid': 'Profile ID must be a valid UUID',
  }),
  documentId: Joi.string().uuid().required().messages({
    'string.guid': 'Document ID must be a valid UUID',
    'any.required': 'Document ID is required',
  }),
});

export const accountIdParamSchema = Joi.object({
  id: Joi.string().uuid().messages({
    'string.guid': 'Profile ID must be a valid UUID',
  }),
  accountId: Joi.string().uuid().required().messages({
    'string.guid': 'Account ID must be a valid UUID',
    'any.required': 'Account ID is required',
  }),
});

export const interactionIdParamSchema = Joi.object({
  id: Joi.string().uuid().messages({
    'string.guid': 'Profile ID must be a valid UUID',
  }),
  interactionId: Joi.string().uuid().required().messages({
    'string.guid': 'Interaction ID must be a valid UUID',
    'any.required': 'Interaction ID is required',
  }),
});

export const blacklistIdParamSchema = Joi.object({
  id: Joi.string().uuid().messages({
    'string.guid': 'Profile ID must be a valid UUID',
  }),
  blacklistId: Joi.string().uuid().required().messages({
    'string.guid': 'Blacklist ID must be a valid UUID',
    'any.required': 'Blacklist ID is required',
  }),
});

// Profile validation schemas
export const createProfileSchema = Joi.object({
  candidate_code: Joi.string().max(50).optional(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian number',
      'any.required': 'Phone number is required',
    }),
  alt_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Alt phone number must be a valid 10-digit Indian number',
    }),
  email: Joi.string().email().max(255).optional().allow(null),
  first_name: Joi.string().min(1).max(255).required(),
  middle_name: Joi.string().max(255).optional().allow(null),
  last_name: Joi.string().max(255).optional().allow(null),
  fathers_name: Joi.string().max(255).optional().allow(null),
  gender: Joi.string().max(20).optional().allow(null),
  date_of_birth: Joi.date().iso().max('now').optional().allow(null).messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  profile_photo_url: Joi.string().uri().max(500).optional().allow(null),
  is_active: Joi.boolean().optional(),
});

export const updateProfileSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian number',
    }),
  alt_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Alt phone number must be a valid 10-digit Indian number',
    }),
  email: Joi.string().email().max(255).optional().allow(null),
  first_name: Joi.string().min(1).max(255).optional(),
  middle_name: Joi.string().max(255).optional().allow(null),
  last_name: Joi.string().max(255).optional().allow(null),
  fathers_name: Joi.string().max(255).optional().allow(null),
  gender: Joi.string().max(20).optional().allow(null),
  date_of_birth: Joi.date().iso().max('now').optional().allow(null),
  profile_photo_url: Joi.string().uri().max(500).optional().allow(null),
  is_active: Joi.boolean().optional(),
  primary_skill_id: Joi.string().uuid().optional().allow(null),
}).min(1); // At least one field must be provided

// Training Batch validation schemas
export const createTrainingBatchSchema = Joi.object({
  code: Joi.string().max(50).optional(),
  name: Joi.string().min(1).max(255).required(),
  program_name: Joi.string().min(1).max(255).required(),
  provider: Joi.string().max(255).optional().allow(null),
  trainer_name: Joi.string().max(255).optional().allow(null),
  start_date: Joi.date().iso().optional().allow(null),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).optional().allow(null).messages({
    'date.greater': 'End date must be after start date',
  }),
  duration_days: Joi.number().integer().min(1).optional().allow(null),
  max_capacity: Joi.number().integer().min(1).optional().allow(null),
  status: Joi.string().max(50).optional().allow(null),
  location: Joi.string().max(255).optional().allow(null),
  description: Joi.string().optional().allow(null),
  skill_category_id: Joi.string().uuid().optional().allow(null),
  created_by_user_id: Joi.string().uuid().optional().allow(null),
});

export const updateTrainingBatchSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  program_name: Joi.string().min(1).max(255).optional(),
  provider: Joi.string().max(255).optional().allow(null),
  trainer_name: Joi.string().max(255).optional().allow(null),
  start_date: Joi.date().iso().optional().allow(null),
  end_date: Joi.date().iso().optional().allow(null),
  duration_days: Joi.number().integer().min(1).optional().allow(null),
  max_capacity: Joi.number().integer().min(1).optional().allow(null),
  status: Joi.string().max(50).optional().allow(null),
  location: Joi.string().max(255).optional().allow(null),
  description: Joi.string().optional().allow(null),
  skill_category_id: Joi.string().uuid().optional().allow(null),
}).min(1);

// Batch Enrollment validation schemas
export const createBatchEnrollmentSchema = Joi.object({
  profile_id: Joi.string().uuid().required(),
  batch_id: Joi.string().uuid().required(),
  enrolled_by_user_id: Joi.string().uuid().optional().allow(null),
  enrollment_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().max(50).optional().allow(null),
  notes: Joi.string().optional().allow(null),
});

export const updateBatchEnrollmentSchema = Joi.object({
  completion_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().max(50).optional().allow(null),
  attendance_percentage: Joi.number().min(0).max(100).precision(2).optional().allow(null),
  score: Joi.number().min(0).max(100).precision(2).optional().allow(null),
  notes: Joi.string().optional().allow(null),
}).min(1);

// Project validation schemas
export const createProjectSchema = Joi.object({
  project_code: Joi.string().max(50).optional(),
  project_name: Joi.string().min(1).max(255).required(),
  project_number: Joi.string().max(100).optional().allow(null),
  employer_id: Joi.string().uuid().required(),
  location: Joi.string().max(255).optional().allow(null),
  contact_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Contact phone must be a valid 10-digit Indian number',
    }),
  deployment_date: Joi.date().iso().optional().allow(null),
  award_date: Joi.date().iso().optional().allow(null),
  start_date: Joi.date().iso().optional().allow(null),
  end_date: Joi.date().iso().optional().allow(null),
  revised_completion_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().max(50).optional().allow(null),
  required_workers: Joi.number().integer().min(0).optional().allow(null),
  project_manager: Joi.string().max(255).optional().allow(null),
  description: Joi.string().optional().allow(null),
  po_co_number: Joi.string().max(100).optional().allow(null),
  is_active: Joi.boolean().optional(),
  is_accommodation_provided: Joi.boolean().optional(),
  created_by_user_id: Joi.string().uuid().optional().allow(null),
});

export const updateProjectSchema = Joi.object({
  project_name: Joi.string().min(1).max(255).optional(),
  project_number: Joi.string().max(100).optional().allow(null),
  location: Joi.string().max(255).optional().allow(null),
  contact_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow(null),
  deployment_date: Joi.date().iso().optional().allow(null),
  award_date: Joi.date().iso().optional().allow(null),
  start_date: Joi.date().iso().optional().allow(null),
  end_date: Joi.date().iso().optional().allow(null),
  revised_completion_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().max(50).optional().allow(null),
  required_workers: Joi.number().integer().min(0).optional().allow(null),
  project_manager: Joi.string().max(255).optional().allow(null),
  description: Joi.string().optional().allow(null),
  po_co_number: Joi.string().max(100).optional().allow(null),
  is_active: Joi.boolean().optional(),
  is_accommodation_provided: Joi.boolean().optional(),
  approval_notes: Joi.string().optional().allow(null),
  rejection_reason: Joi.string().optional().allow(null),
}).min(1);

// Deployment validation schemas
export const createDeploymentSchema = Joi.object({
  project_id: Joi.string().uuid().required(),
  profile_id: Joi.string().uuid().required(),
  deployment_date: Joi.date().iso().required(),
  expected_end_date: Joi.date()
    .iso()
    .greater(Joi.ref('deployment_date'))
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'Expected end date must be after deployment date',
    }),
  actual_end_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().max(50).optional().allow(null),
  performance_rating: Joi.number().integer().min(1).max(5).optional().allow(null),
  deployed_by_user_id: Joi.string().uuid().optional().allow(null),
});

export const updateDeploymentSchema = Joi.object({
  deployment_date: Joi.date().iso().optional(),
  expected_end_date: Joi.date().iso().optional().allow(null),
  actual_end_date: Joi.date().iso().optional().allow(null),
  status: Joi.string().max(50).optional().allow(null),
  performance_rating: Joi.number().integer().min(1).max(5).optional().allow(null),
}).min(1);

// Employer validation schemas
export const createEmployerSchema = Joi.object({
  employer_code: Joi.string().max(50).required(),
  company_name: Joi.string().min(1).max(255).required(),
  client_name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().max(255).required(),
  password_hash: Joi.string().max(255).required(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be a valid 10-digit Indian number',
    }),
  alt_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Alt phone must be a valid 10-digit Indian number',
    }),
  registered_address: Joi.string().optional().allow(null),
  company_registration_number: Joi.string().max(100).optional().allow(null),
  gst_number: Joi.string().max(20).optional().allow(null),
  is_active: Joi.boolean().optional(),
  is_verified: Joi.boolean().optional(),
});

export const updateEmployerSchema = Joi.object({
  company_name: Joi.string().min(1).max(255).optional(),
  client_name: Joi.string().min(1).max(255).optional(),
  email: Joi.string().email().max(255).optional(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Phone must be a valid 10-digit Indian number',
    }),
  alt_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow(null),
  registered_address: Joi.string().optional().allow(null),
  company_registration_number: Joi.string().max(100).optional().allow(null),
  gst_number: Joi.string().max(20).optional().allow(null),
  is_active: Joi.boolean().optional(),
  is_verified: Joi.boolean().optional(),
}).min(1);

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(1000).default(20).optional(),
}).unknown(true); // Allow other query parameters

// Address validation schemas
export const createAddressSchema = Joi.object({
  address_type: Joi.string().max(50).optional().allow(null),
  house_number: Joi.string().max(100).optional().allow(null),
  village_or_city: Joi.string().max(255).optional().allow(null),
  district: Joi.string().max(255).optional().allow(null),
  state: Joi.string().max(255).optional().allow(null),
  postal_code: Joi.string().max(10).optional().allow(null),
  landmark: Joi.string().max(255).optional().allow(null),
  police_station: Joi.string().max(255).optional().allow(null),
  post_office: Joi.string().max(255).optional().allow(null),
  is_current: Joi.boolean().optional(),
});

export const updateAddressSchema = Joi.object({
  address_type: Joi.string().max(50).optional().allow(null),
  house_number: Joi.string().max(100).optional().allow(null),
  village_or_city: Joi.string().max(255).optional().allow(null),
  district: Joi.string().max(255).optional().allow(null),
  state: Joi.string().max(255).optional().allow(null),
  postal_code: Joi.string().max(10).optional().allow(null),
  landmark: Joi.string().max(255).optional().allow(null),
  police_station: Joi.string().max(255).optional().allow(null),
  post_office: Joi.string().max(255).optional().allow(null),
  is_current: Joi.boolean().optional(),
}).min(1);

// Profile Skill validation schemas
export const createProfileSkillSchema = Joi.object({
  skill_category_id: Joi.string().uuid().required(),
  years_of_experience: Joi.number().integer().min(0).optional().allow(null),
  is_primary: Joi.boolean().optional(),
});

export const updateProfileSkillSchema = Joi.object({
  years_of_experience: Joi.number().integer().min(0).optional().allow(null),
  is_primary: Joi.boolean().optional(),
}).min(1);

// Qualification validation schemas
export const createQualificationSchema = Joi.object({
  qualification_type_id: Joi.string().uuid().optional().allow(null),
  institution_name: Joi.string().max(255).optional().allow(null),
  field_of_study: Joi.string().max(255).optional().allow(null),
  year_of_completion: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional()
    .allow(null),
  percentage_or_grade: Joi.string().max(50).optional().allow(null),
});

export const updateQualificationSchema = Joi.object({
  qualification_type_id: Joi.string().uuid().optional().allow(null),
  institution_name: Joi.string().max(255).optional().allow(null),
  field_of_study: Joi.string().max(255).optional().allow(null),
  year_of_completion: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional()
    .allow(null),
  percentage_or_grade: Joi.string().max(50).optional().allow(null),
}).min(1);

// Interaction validation schemas
export const createInteractionSchema = Joi.object({
  interaction_type_id: Joi.string().uuid().optional().allow(null),
  subject: Joi.string().max(255).optional().allow(null),
  description: Joi.string().optional().allow(null),
  outcome: Joi.string().max(100).optional().allow(null),
  next_follow_up_date: Joi.date().iso().optional().allow(null),
  interaction_date: Joi.date().iso().optional().allow(null),
});

export const updateInteractionSchema = Joi.object({
  interaction_type_id: Joi.string().uuid().optional().allow(null),
  subject: Joi.string().max(255).optional().allow(null),
  description: Joi.string().optional().allow(null),
  outcome: Joi.string().max(100).optional().allow(null),
  next_follow_up_date: Joi.date().iso().optional().allow(null),
  interaction_date: Joi.date().iso().optional().allow(null),
}).min(1);

// Document validation schemas
export const createDocumentSchema = Joi.object({
  document_category_id: Joi.string().uuid().optional().allow(null),
  document_number: Joi.string().max(100).optional().allow(null),
  file_name: Joi.string().max(255).required(),
  file_url: Joi.string().max(500).required(),
  file_size: Joi.number().integer().min(0).optional().allow(null),
  expiry_date: Joi.date().iso().optional().allow(null),
  qualification_id: Joi.string().uuid().optional().allow(null),
  batch_enrollment_id: Joi.string().uuid().optional().allow(null),
});

export const updateDocumentSchema = Joi.object({
  document_category_id: Joi.string().uuid().optional().allow(null),
  document_number: Joi.string().max(100).optional().allow(null),
  file_name: Joi.string().max(255).optional(),
  file_url: Joi.string().max(500).optional(),
  file_size: Joi.number().integer().min(0).optional().allow(null),
  verification_status: Joi.string().max(50).optional().allow(null),
  expiry_date: Joi.date().iso().optional().allow(null),
}).min(1);

// Bank Account validation schemas
export const createBankAccountSchema = Joi.object({
  account_holder_name: Joi.string().max(255).required(),
  account_number: Joi.string().max(50).required(),
  ifsc_code: Joi.string()
    .max(20)
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'IFSC code must be in valid format (e.g., SBIN0001234)',
    }),
  bank_name: Joi.string().max(255).optional().allow(null),
  branch_name: Joi.string().max(255).optional().allow(null),
  account_type: Joi.string().max(50).optional().allow(null),
  is_primary: Joi.boolean().optional(),
});

export const updateBankAccountSchema = Joi.object({
  account_holder_name: Joi.string().max(255).optional(),
  account_number: Joi.string().max(50).optional(),
  ifsc_code: Joi.string()
    .max(20)
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .optional()
    .messages({
      'string.pattern.base': 'IFSC code must be in valid format (e.g., SBIN0001234)',
    }),
  bank_name: Joi.string().max(255).optional().allow(null),
  branch_name: Joi.string().max(255).optional().allow(null),
  account_type: Joi.string().max(50).optional().allow(null),
  is_primary: Joi.boolean().optional(),
  verification_status: Joi.string().max(50).optional().allow(null),
}).min(1);

// Profile Blacklist validation schemas
export const createProfileBlacklistSchema = Joi.object({
  reason: Joi.string().required().messages({
    'any.required': 'Reason for blacklisting is required',
  }),
});

export const updateProfileBlacklistSchema = Joi.object({
  is_active: Joi.boolean().required(),
  reason: Joi.string().optional().allow(null),
});
