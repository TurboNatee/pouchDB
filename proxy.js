const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

const API_KEY = 'N0PlutmWRcftkotVjJr3dqsjvHpPqWnRUHXodxLtnx43';
const CLOUDANT_URL = 'https://e721dc0f-3952-4dfe-8357-4b3bacbb670f-bluemix.cloudantnosqldb.appdomain.cloud';
const DB_NAME = 'advanceddb_project';

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://192.168.1.20:8080');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

let iamToken = null;
let tokenExpiry = 0;

async function getIamToken() {
  if (iamToken && Date.now() < tokenExpiry) return iamToken;
  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${API_KEY}`
  });
  const data = await res.json();
  iamToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return iamToken;
}

app.use(`/${DB_NAME}`, async (req, res) => {
  try {
    const token = await getIamToken();
    const url = `${CLOUDANT_URL}${req.originalUrl}`;
    const options = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    };
    const cloudRes = await fetch(url, options);
    const json = await cloudRes.json();
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('IAM proxy running on http://localhost:3000'));
