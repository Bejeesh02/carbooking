const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const keys = require('./credentials.json'); // Google service account JSON

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = '1DXbSTSMw26T87AnHF_OnzB201FMCIuyqX6JexpmzlZM'; // Your spreadsheet ID

const SHEET_NAMES = {
  login: 'login',
  bookings: 'bookings',
  feedback: 'Feedback', // <-- NEW Sheet Name
};

// Utility to get Google Sheet ID by name
async function getSheetIdByName(sheetName) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets.find(
    (s) => s.properties.title.toLowerCase() === sheetName.toLowerCase()
  );

  if (!sheet) throw new Error(`❌ Sheet "${sheetName}" not found`);
  return sheet.properties.sheetId;
}

// ✅ LOGIN - Add data to login sheet
app.post('/api/login', async (req, res) => {
  const { username, phoneNumber } = req.body;

  if (!username || !phoneNumber) {
    return res.status(400).json({ message: 'Username and phone number are required.' });
  }

  const timestamp = new Date().toLocaleString();

  try {
    const sheetId = await getSheetIdByName(SHEET_NAMES.login);
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Insert new row at top
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
              endIndex: 2,
            },
            inheritFromBefore: false,
          },
        }],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAMES.login}!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[username, phoneNumber, timestamp]],
      },
    });

    res.status(200).json({ message: '✅ Login Successful! hearty welcome to AJ CARZ' });
  } catch (err) {
    console.error('❌ Error writing login data:', err);
    res.status(500).json({ message: '❌ Login Failed' });
  }
});

// ✅ BOOKING - Add data to bookings sheet
app.post('/api/users', async (req, res) => {
  const {
    car, name, email, phoneno,
    address, travel, days, proof, bookingType
  } = req.body;

  if (!name || !phoneno) {
    return res.status(400).json({ message: 'Name and phone number are required.' });
  }

  const timestamp = new Date().toLocaleString();

  try {
    const sheetId = await getSheetIdByName(SHEET_NAMES.bookings);
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
              endIndex: 2,
            },
            inheritFromBefore: false,
          },
        }],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAMES.bookings}!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, car, name, email, phoneno, address, travel, days, proof, bookingType]],
      },
    });

    res.status(200).json({ message: '✅ Booking Successful! we will contact you shortly.' });
  } catch (err) {
    console.error('❌ Error writing booking data:', err);
    res.status(500).json({ message: '❌ Failed to write booking data to sheet' });
  }
});

// ✅ FEEDBACK - Add data to Feedback sheet
app.post('/api/feedback', async (req, res) => {
  const { name, phone, feedbackText } = req.body;

  if (!feedbackText) {
    return res.status(400).json({ message: 'Feedback is required.' });
  }

  const timestamp = new Date().toLocaleString();

  try {
    const sheetId = await getSheetIdByName(SHEET_NAMES.feedback);
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,
              endIndex: 2,
            },
            inheritFromBefore: false,
          },
        }],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAMES.feedback}!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, name || 'Anonymous', phone || 'N/A', feedbackText]],
      },
    });

    res.status(200).json({ message: '✅ Feedback submitted successfully!' });
  } catch (err) {
    console.error('❌ Error writing feedback data:', err);
    res.status(500).json({ message: '❌ Failed to submit feedback' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
