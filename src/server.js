const config = require('./config');
const { createApp } = require('./app');
const container = require('./container');

createApp(container).listen(config.port, () => {
  console.log(`Smart CRM L2 đang chạy tại http://localhost:${config.port}`);
});
