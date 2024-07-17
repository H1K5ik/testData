"use strict";
require('dotenv').config();
const https = require('https');
const fs = require("fs");
const pg = require("pg");

const config = {
    connectionString:
        process.env.connectionString,
    ssl: {
        rejectUnauthorized: true,
        ca: fs
            .readFileSync(process.env.root)
            .toString(),
    },
};

const conn = new pg.Client(config);

conn.connect((err) => {
    if (err) throw err;
    console.log("Connected to database");
    createDatabase()
        .then(() => fetchAndInsertData(), err => console.log(err))
        .then(() => checkInsertedData(), err => console.log(err))
        .finally(() => conn.end());
});
function createDatabase() {
    const query = `
        DROP TABLE IF EXISTS H1K5ik;
        CREATE TABLE H1K5ik (id serial PRIMARY KEY, name VARCHAR(255), data JSONB);
    `;
    return conn.query(query);
}

function insertData(jsonData) {
  const dataArr = jsonData.results;
  const promises = dataArr.map(obj => {
      const query = `INSERT INTO H1K5ik (name, data) VALUES ($1, $2)`;
      const values = [obj.name, JSON.stringify(obj)];
      return conn.query(query, values)
          .then(() => console.log(`Данные для ${obj.name} успешно добавлены в БД.`));
  });
  return Promise.all(promises);
}

function fetchAndInsertData() {
    const url = 'https://rickandmortyapi.com/api/character'; 
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                const jsonData = JSON.parse(data);
                insertData(jsonData)
                    .then(resolve, reject);  
            });
        }).on('error', reject);
    });
}

function checkInsertedData() {
  return new Promise((resolve, reject) => {
      conn.query("SELECT * FROM H1K5ik", (err, res) => {
          if (err) reject(err);
          console.log('Полученные данные:');
          res.rows.forEach(row => {
              console.log(row);
          });
          resolve();
      });
  });
}
// delete testData && H1K5 from db