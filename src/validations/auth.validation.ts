import Joi from 'joi';

// Common fields for both user types
const commonFields = {
  userType: Joi.string().valid('candidate', 'employer').required().messages({
    'any.only': 'userType must be either "candidate" or "employer"',
    'any.required': 'userType is required',
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian number',
      'any.required': 'Phone number is required',
    }),
  password: Joi.string().min(8).max(100).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 100 characters',
    'any.required': 'Password is required',
  }),
  altPhone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Alt phone number must be a valid 10-digit Indian number',
    }),
};

// Candidate-specific fields
const candidateFields = {
  firstName: Joi.string().min(1).max(255).required().messages({
    'string.min': 'First name is required',
    'string.max': 'First name must not exceed 255 characters',
    'any.required': 'First name is required for candidate signup',
  }),
  middleName: Joi.string().max(255).optional().allow(null, ''),
  lastName: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Last name is required',
    'string.max': 'Last name must not exceed 255 characters',
    'any.required': 'Last name is required for candidate signup',
  }),
  fathersName: Joi.string().max(255).optional().allow(null, ''),
  email: Joi.string().email().optional().allow(null, '').messages({
    'string.email': 'Email must be a valid email address',
  }),
  gender: Joi.string().optional().allow(null, ''),
  dateOfBirth: Joi.date().iso().max('now').optional().allow(null).messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  state: Joi.string().optional().allow(null, ''),
  district: Joi.string().optional().allow(null, ''),
  villageOrCity: Joi.string().optional().allow(null, ''),
  pincode: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'Pincode must be a number',
  }),
  emergencyContactName: Joi.string().optional().allow(null, ''),
  emergencyContactNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Emergency contact number must be a valid 10-digit Indian number',
    }),
  metadata: Joi.object().optional().allow(null),
};

// Employer-specific fields
const employerFields = {
  companyName: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Company name is required',
    'string.max': 'Company name must not exceed 255 characters',
    'any.required': 'Company name is required for employer signup',
  }),
  clientName: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Client name is required',
    'string.max': 'Client name must not exceed 255 characters',
    'any.required': 'Client name is required for employer signup',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required for employer signup',
  }),
  registeredAddress: Joi.string().optional().allow(null, ''),
  companyRegistrationNumber: Joi.string().optional().allow(null, ''),
  gstNumber: Joi.string().optional().allow(null, ''),
  city: Joi.string().required().messages({
    'any.required': 'City is required for employer signup',
  }),
  district: Joi.string().required().messages({
    'any.required': 'District is required for employer signup',
  }),
  state: Joi.string().required().messages({
    'any.required': 'State is required for employer signup',
  }),
  landmark: Joi.string().optional().allow(null, ''),
  postalCode: Joi.string().required().messages({
    'any.required': 'Postal code is required for employer signup',
  }),
  authorizedPersonName: Joi.string().required().messages({
    'any.required': 'Authorized person name is required for employer signup',
  }),
  authorizedPersonDesignation: Joi.string().required().messages({
    'any.required': 'Authorized person designation is required for employer signup',
  }),
  authorizedPersonEmail: Joi.string().email().required().messages({
    'string.email': 'Authorized person email must be a valid email address',
    'any.required': 'Authorized person email is required for employer signup',
  }),
  authorizedPersonContact: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Authorized person contact must be a valid 10-digit Indian number',
      'any.required': 'Authorized person contact is required for employer signup',
    }),
  authorizedPersonAddress: Joi.string().required().messages({
    'any.required': 'Authorized person address is required for employer signup',
  }),
  projectName: Joi.string().required().messages({
    'any.required': 'Project name is required for employer signup',
  }),
  projectDescription: Joi.string().required().messages({
    'any.required': 'Project description is required for employer signup',
  }),
  siteAddress: Joi.string().required().messages({
    'any.required': 'Site address is required for employer signup',
  }),
  projectType: Joi.string().optional().allow(null, ''),
  durationMonths: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.base': 'Duration months must be a number',
    'number.min': 'Duration months must be at least 1',
  }),
  workerRequirements: Joi.array()
    .items(
      Joi.object({
        category: Joi.string().required().messages({
          'any.required': 'Worker requirement category is required',
        }),
        count: Joi.number().integer().min(1).required().messages({
          'number.base': 'Worker count must be a number',
          'number.min': 'Worker count must be at least 1',
          'any.required': 'Worker count is required',
        }),
      })
    )
    .optional()
    .allow(null),
};

// Unified schema with conditional validation
export const unifiedSignupSchema = Joi.object({
  ...commonFields,
}).when('.userType', {
  is: 'candidate',
  then: Joi.object(candidateFields),
  otherwise: Joi.object(employerFields),
});
