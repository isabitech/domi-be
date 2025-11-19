const basePayload = (successFlag, { message, statusCode, data, errors, meta }) => ({
  success: successFlag,
  statusCode,
  message,
  timestamp: new Date().toISOString(),
  data: data || undefined,
  errors: errors || undefined,
  meta: meta || undefined
});

export const success = (res, data = {}, message = 'OK', statusCode = 200, meta) => {
  res.status(statusCode).json(basePayload(true, { message, statusCode, data, meta }));
};

export const failure = (res, message = 'Error', statusCode = 500, errors, meta) => {
  res.status(statusCode).json(basePayload(false, { message, statusCode, errors, meta }));
};