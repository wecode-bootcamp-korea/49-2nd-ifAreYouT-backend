const { ticketService } = require('../services');
const { throwError } = require('../utils');
const { v4: uuidv4 } = require('uuid');

const getTicketInfoByUserId = async (req, res, next) => {
  const { userId } = req.query;
  try {
    const ticketInfo = await ticketService.getTicketInfo(userId);

    if (!ticketInfo || ticketInfo.length === 0) {
      throwError(400, 'NOT_FOUND_TICKETS');
    }

    res.status(200).json({
      message: 'GET_TICKETS',
      data : ticketInfo,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};  

module.exports = {
  getTicketInfoByUserId
};
