import Joi from 'joi';

export const UserSchema = {
  firstName: Joi.string().min(2).max(128).required().label('First name'),
  lastName: Joi.string().min(1).max(128).required().label('Last name'),
  email: Joi.string().email().required().label('Email'),
};
