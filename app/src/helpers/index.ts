const validateIfGreaterThanZero = (rule: any, value: any, callback: any) => {
  value > 0 ? callback() : callback(false);
};

export { validateIfGreaterThanZero };
