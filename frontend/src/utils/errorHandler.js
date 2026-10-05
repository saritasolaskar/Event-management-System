export const getApiErrorMessage = (
  error,
  fallbackMessage = "Something went wrong. Please try again."
) => {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  const responseData = error.response?.data;

  if (responseData?.message) {
    return responseData.message;
  }

  if (Array.isArray(responseData?.errors)) {
    const messages = responseData.errors
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return item?.msg || item?.message;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export const getApiValidationErrors = (error) => {
  const errors = error?.response?.data?.errors;

  if (!Array.isArray(errors)) {
    return [];
  }

  return errors;
};

export const isUnauthorizedError = (error) => {
  return error?.response?.status === 401;
};

export const isForbiddenError = (error) => {
  return error?.response?.status === 403;
};

export const isValidationError = (error) => {
  return error?.response?.status === 422;
};