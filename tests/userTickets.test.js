const request = require('supertest');
const { createApp } = require('../app');
const { dataSource } = require('../src/models/dataSource');

describe('user get ticket', () => {
  let app;

  beforeAll(async () => {
    app = createApp();
    await dataSource.initialize();
    await dataSource.query(`DELETE FROM event_reactions`);
    await dataSource.query(`INSERT INTO users (id, email, nickname, phone_number, provider, uid)
    VALUES (1, 'user@example.com', 'testUser', '010-1234-5678', 'kakao', '1');`);
    await dataSource.query(`INSERT INTO stages (name) VALUES ('testname')`);
    await dataSource.query(
      `INSERT INTO seat_grades (grade, price) VALUES (1, 1)`,
    );
    await dataSource.query(
      `INSERT INTO categories (category_name) VALUES ('testcategoryname')`,
    );
    await dataSource.query(`INSERT INTO performers (name) VALUES ('testname')`);
    await dataSource.query(`DELETE FROM events`);
    await dataSource.query(`INSERT INTO events (id, title, playtime, description, status, start_date, end_date, sales_start_date, sales_end_date,
        stage_id, category_id, performer_id, promotion_id) VALUES (1, 'testtitle', '2hour', 'test', 'merchantable', NOW(), NOW(), NOW(), NOW(), 1, 1, 1, 1)`);
    await dataSource.query(
      `INSERT INTO times (id, event_time, event_day, event_id) VALUES (1, '03', '23-03-23', 1)`,
    );
    await dataSource.query(
      `INSERT INTO seats (row_name, col_name, stage_id, grade_id) VALUES ('test', 123, 1, 1)`,
    );
    await dataSource.query(`INSERT INTO orders (id, user_id, order_no, order_status)
    VALUES (1, 1, 123, 'pending');`);
    await dataSource.query(`INSERT INTO event_orders (id, time_id, seat_id, order_id, order_name, ticket_code)
    VALUES (2, 1, 1, 1, 'testordername', 'testticketcode')`);
  });

  afterAll(async () => {
    await dataSource.query(`SET foreign_key_checks = 0;`);
    await dataSource.query(`DELETE FROM event_reactions`);
    await dataSource.query(`TRUNCATE users`);
    await dataSource.query(`TRUNCATE stages`);
    await dataSource.query(`TRUNCATE seat_grades`);
    await dataSource.query(`TRUNCATE categories`);
    await dataSource.query(`TRUNCATE performers`);
    await dataSource.query(`TRUNCATE events`);
    await dataSource.query(`TRUNCATE times`);
    await dataSource.query(`TRUNCATE seats`);
    await dataSource.query(`TRUNCATE orders`);
    await dataSource.query(`TRUNCATE event_orders`);
    await dataSource.destroy();
  });

  test('GET_TICKETS: valid order', async () => {
    const res = await request(app).get(`/mypage/get-tickets/1`).send();
    expect(res.status).toBe(200);

    expect(res.body.message).toEqual('GET_TICKETS');
  });

  test('INVALID_ORDER_ID: invalid order', async () => {
    const userId = 999;

    const res = await request(app).get(`/mypage/get-tickets/${userId}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toEqual('INVALID_ORDER_ID');
  });
});
