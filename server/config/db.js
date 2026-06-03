const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'database', 'expense_tracker.db');

let sqlDb = null;

function saveDB() {
    const data = sqlDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Compatibility wrapper that mirrors the better-sqlite3 API
// so controllers don't need any changes
const db = {
    prepare(sql) {
        return {
            get(...params) {
                const stmt = sqlDb.prepare(sql);
                if (params.length > 0) stmt.bind(params);
                if (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    stmt.free();
                    const obj = {};
                    cols.forEach((c, i) => { obj[c] = vals[i]; });
                    return obj;
                }
                stmt.free();
                return undefined;
            },
            all(...params) {
                const results = [];
                const stmt = sqlDb.prepare(sql);
                if (params.length > 0) stmt.bind(params);
                const cols = stmt.getColumnNames();
                while (stmt.step()) {
                    const vals = stmt.get();
                    const obj = {};
                    cols.forEach((c, i) => { obj[c] = vals[i]; });
                    results.push(obj);
                }
                stmt.free();
                return results;
            },
            run(...params) {
                sqlDb.run(sql, params);
                const changes = sqlDb.getRowsModified();
                const idResult = sqlDb.exec('SELECT last_insert_rowid() as id');
                const lastInsertRowid = idResult.length > 0 ? idResult[0].values[0][0] : 0;
                saveDB();
                return { changes, lastInsertRowid };
            }
        };
    },
    exec(sql) {
        sqlDb.exec(sql);
        saveDB();
    },
    pragma(str) {
        sqlDb.exec('PRAGMA ' + str);
    }
};

db.init = async function () {
    const SQL = await initSqlJs();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(DB_PATH)) {
        sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
        sqlDb = new SQL.Database();
    }

    sqlDb.exec('PRAGMA foreign_keys = ON');

    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    sqlDb.exec(schema);
    saveDB();
};

module.exports = db;
