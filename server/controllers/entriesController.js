const entriesService = require('../services/entriesService');
const { success, created } = require('../utils/apiResponse');

const getEntries = async (req, res, next) => {
  try {
    const result = await entriesService.getEntries(req.user._id, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 30
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getEntryByDate = async (req, res, next) => {
  try {
    const entry = await entriesService.getEntryByDate(req.user._id, req.params.date);
    return success(res, { entry });
  } catch (err) {
    next(err);
  }
};

const saveEntry = async (req, res, next) => {
  try {
    const entry = await entriesService.saveEntry(req.user._id, req.body);
    return created(res, { entry });
  } catch (err) {
    next(err);
  }
};

const deleteEntry = async (req, res, next) => {
  try {
    const result = await entriesService.deleteEntry(req.user._id, req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getEntries, getEntryByDate, saveEntry, deleteEntry };