import Joi from 'joi';

export const efccSchemas = {
  // EFCC record validation
  createOrUpdate: Joi.object({
    body: Joi.object({
      todayRemittance: Joi.number().min(0).required()
        .messages({
          'number.base': 'Today remittance must be a number',
          'number.min': 'Today remittance must be a positive number',
          'any.required': 'Today remittance is required'
        }),
      
      amtRemittingNow: Joi.number().min(0).required()
        .messages({
          'number.base': 'Amount remitting now must be a number',
          'number.min': 'Amount remitting now must be a positive number',
          'any.required': 'Amount remitting now is required'
        }),
      
      previousAmountOwing: Joi.number().min(0).optional()
        .messages({
          'number.base': 'Previous amount owing must be a number',
          'number.min': 'Previous amount owing must be a positive number'
        })
    })
  }),

  // Branch ID parameter validation
  branchId: Joi.object({
    params: Joi.object({
      branchId: Joi.string().hex().length(24).required()
        .messages({
          'string.hex': 'Branch ID must be a valid MongoDB ObjectId',
          'string.length': 'Branch ID must be 24 characters long',
          'any.required': 'Branch ID is required'
        })
    })
  }),

  // Query parameter validation for pagination and filtering
  query: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional().default(1)
        .messages({
          'number.base': 'Page must be a number',
          'number.integer': 'Page must be an integer',
          'number.min': 'Page must be at least 1'
        }),
        
      limit: Joi.number().integer().min(1).max(100).optional().default(30)
        .messages({
          'number.base': 'Limit must be a number',
          'number.integer': 'Limit must be an integer',
          'number.min': 'Limit must be at least 1',
          'number.max': 'Limit cannot exceed 100'
        }),
        
      startDate: Joi.date().iso().optional()
        .messages({
          'date.base': 'Start date must be a valid date',
          'date.format': 'Start date must be in ISO format'
        }),
        
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
        .messages({
          'date.base': 'End date must be a valid date',
          'date.format': 'End date must be in ISO format',
          'date.min': 'End date must be after start date'
        }),

      date: Joi.date().iso().optional()
        .messages({
          'date.base': 'Date must be a valid date',
          'date.format': 'Date must be in ISO format'
        }),

      branchId: Joi.string().hex().length(24).optional()
        .messages({
          'string.hex': 'Branch ID must be a valid MongoDB ObjectId',
          'string.length': 'Branch ID must be 24 characters long'
        })
    })
  })
};