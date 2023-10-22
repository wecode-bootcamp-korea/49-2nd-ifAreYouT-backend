const { dataSource } = require('./dataSource');
const _ = require('lodash');
const { useTransaction } = require('../utils');
const uuid4 = require('uuid4');

const isEventExistDao = async (eventId) => {
  const [eventExist] = await dataSource.query(
    `
    SELECT id FROM events WHERE id = ?
    `,
    [eventId],
  );
  return eventExist;
};

const getOrderIdByOrderNumberQuery = `SELECT id FROM orders WHERE order_no = ?`;

const getSeatsDataDao = async (eventId) => {
  const getSeatsQueryRunner = async (queryRunner) => {
    const seats = await queryRunner.query(
      `
      SELECT
      s.id,
      CONCAT(s.row_name, '-', s.col_name) AS name,
      s.row_name AS 'row',
      s.col_name AS 'col',
      sg.grade AS grade,
      es.status AS status
      FROM seats s
      LEFT JOIN seat_grades sg ON s.grade_id = sg.id
      LEFT JOIN event_seats es ON s.id = es.seat_id
      LEFT JOIN stages ON s.stage_id = stages.id
      LEFT JOIN events ON stages.id = events.stage_id
      WHERE 
        events.id = ?
      `,
      [eventId],
    );
    return { seats };
  };
  const getDetailsQueryRunner = async (queryRunner) => {
    const detail = await queryRunner.query(
      `
      SELECT
        seat_grades.grade,        
        seat_grades.price
      FROM 
        seat_grades   
      LEFT JOIN stages ON seat_grades.stage_id = stages.id
      LEFT JOIN events ON stages.id = events.stage_id
      WHERE 
        events.id = ?        
      `,
      [eventId],
    );
    return { detail };
  };
  const result = await useTransaction(dataSource, [
    getSeatsQueryRunner,
    getDetailsQueryRunner,
  ]);
  return result;
};

const isSeatReservableDao = async (data) => {
  const { seats } = data;
  const result = await dataSource.query(
    `
    SELECT status FROM event_seats WHERE seat_id IN (?)
  `,
    [seats.map((data) => data.seatId)],
  );
  return _.every(result, (value) => value.status === 'available');
};

const updateEventSeatDao = async (data, orderNumber) => {
  const { userId, seats, timeId } = data;
  const updateEventSeatsQueryRunner = async (queryRunner) => {
    const seatIds = seats.map((data) => data.seatId);
    await queryRunner.query(
      `UPDATE event_seats
      SET status = 'disabled'
      WHERE seat_id IN (?)
    `,
      [seatIds],
    );
    return { message: 'seat updated' };
  };
  const addOrderQueryRunner = async (queryRunner) => {
    await queryRunner.query(
      `INSERT INTO orders (user_id, order_no, order_status) VALUES (?, ?, ?)`,
      [userId, orderNumber, 'pending'],
    );
    return { orderNumber };
  };
  const addEventOrderByOrderNumberQueryRunner = async (queryRunner) => {
    const [orderId] = await queryRunner.query(getOrderIdByOrderNumberQuery, [
      orderNumber,
    ]);
    const values = seats
      .map((data) => {
        return `(${orderNumber}, '${uuid4()}', ${timeId}, ${data.seatId}, ${
          orderId.id
        })`;
      })
      .join(', ');
    await queryRunner.query(
      `INSERT INTO event_orders (order_number, ticket_code, time_id, seat_id, order_id) VALUES ${values}`,
    );
  };
  useTransaction(dataSource, [
    updateEventSeatsQueryRunner,
    addOrderQueryRunner,
    addEventOrderByOrderNumberQueryRunner,
  ]);
};

module.exports = {
  getSeatsDataDao,
  isEventExistDao,
  updateEventSeatDao,
  isSeatReservableDao,
};
