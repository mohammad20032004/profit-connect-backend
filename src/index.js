const app = require('./app');
const config = require('./config/default');

const port = process.env.PORT || config.port || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});
