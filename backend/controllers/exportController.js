const exportService = require('../services/exportService');

const exportMyData = async (req, res, next) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const file = await exportService.export(req.user._id, format);

    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`
    );
    // Avoid caching personal data
    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).send(file.body);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportMyData };