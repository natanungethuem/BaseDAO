const { Client } = require('pg');
const named = require('node-postgres-named');

const pool = {
    connectionString: process.env.DATABASE_URL
};

export default class BaseDAO {
    constructor() {
        this.clean();
    }

    clean() {
        this.notEmptyProp = false;
    }

    beforeResolve(fn, d) {
        this.clean();
        return fn(d);
    }

    beforeReject(fn, d) {
        // eslint-disable-next-line no-console
        console.error(d);
        this.clean();
        return fn(d);
    }

    exec(sql, params) {
        const self = this;
        return new Promise((resolve, reject) => {
            const client = new Client(pool);
            named.patch(client);
            client.connect();
            client.query(sql, params, (err, res) => {
                client.end();

                if (err) return self.beforeReject(reject, err);

                if (self.notEmptyProp) {
                    return res.rowCount === 1 ? self.beforeResolve(resolve, res.rows[0])
                        : self.beforeReject(reject, res);
                }

                return self.beforeResolve(resolve, res);
            });
        });
    }

    notEmpty() {
        this.notEmptyProp = true;
        return this;
    }
}

export class DAOUtils {
    static deleteAllBut(obj, list) {
        Object.keys(obj).forEach((key) => {
            // eslint-disable-next-line no-param-reassign
            if (!list || !list.includes(key)) delete obj[key];
        });

        return obj;
    }
}
