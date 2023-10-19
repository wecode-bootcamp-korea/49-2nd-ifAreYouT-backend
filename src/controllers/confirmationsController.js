const { confirmationsService } = require('../services');
const { throwError } = require('../utils');
const { v4: uuidv4 } = require('uuid');

const userByLikeController = async (req, res) => {
  const userId = req.userData
  try {
    const likesInfo = await confirmationsService.getLikedEvents(userId);

    if (!likesInfo) {
      throwError(400, 'NOT_FOUND_LIKES');
    }

    res.status(200).json({
      message: 'LIKED_EVENTS_FOUND',
      data: likesInfo
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};

module.exports = {
  userByLikeController,
};
