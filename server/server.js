require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing. Add it to server/.env.');
    }

    await connectDB();
    app.listen(port, () => {
      console.log(`CampusConnect API listening on port ${port}.`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

startServer();
