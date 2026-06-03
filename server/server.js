require('dotenv').config();
const db = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

(async () => {
    await db.init();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})();
