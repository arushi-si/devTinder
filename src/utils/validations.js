const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req;
  if (!firstName || !lastName)
    throw new Error("firstName / lastName not present");
  else if (!validator.isEmail(emailId)) throw new Error("Invalid email id!");
  //   else if (!validator.isStrongPassword(password))
  //     throw new Error("Password is not strong!");
};

module.exports = { validateSignUpData };
