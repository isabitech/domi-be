import Joi from 'joi';

export const authSchemas = {
  register: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      role: Joi.string().valid('HO','BR','employee').optional(),
      branch: Joi.string().hex().length(24).optional()
    })
  }),
  login: Joi.object({
    body: Joi.object({
      email: Joi.string().email().optional(),
      username: Joi.string().alphanum().min(3).max(50).optional(),
      password: Joi.string().required()
    }).or('email', 'username')
  }),
  forgot: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required()
    })
  }),
  reset: Joi.object({
    params: Joi.object({
      resettoken: Joi.string().required()
    }),
    body: Joi.object({
      password: Joi.string().min(8).required()
    })
  })
};
