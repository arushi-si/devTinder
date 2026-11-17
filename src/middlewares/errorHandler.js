class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
};

// Express 5 forwards errors thrown in async handlers here automatically.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError)
    return res.status(err.status).json({ error: err.message });

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ error: message });
  }

  if (err.name === "CastError")
    return res.status(400).json({ error: `Invalid value for ${err.path}` });

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const message =
      field === "emailId" ? "Email is already registered" : "Duplicate record";
    return res.status(409).json({ error: message });
  }

  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON body" });

  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};

module.exports = { HttpError, notFound, errorHandler };
