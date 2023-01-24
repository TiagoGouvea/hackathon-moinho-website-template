import type {NextApiRequest, NextApiResponse} from 'next';
import {google} from 'googleapis';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {name, email, phone} = _req.body;
    const parsedEmail = email.trim().toLowerCase();
    // Verify if email is valid
    if (!parsedEmail || !parsedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/g))
      return res.status(400).json({error: {message: 'Email inválido'}});

    // Verify if phone is valid
    if (
      !phone ||
      !phone.match(
        /^\s*(\d{2}|\d{0})[-. ]?(\d{5}|\d{4})[-. ]?(\d{4})[-. ]?\s*$/g
      )
    )
      return res
        .status(400)
        .json({error: {message: 'Telefone em formato inválido'}});

    // Verify if name is valid
    if (!name) return res.status(400).json({error: {message: 'Nome inválido'}});

    const config = JSON.parse(process.env.GOOGLE_SHEET_API_CONFIG || '{}');

    const auth = new google.auth.JWT(
      config['client_email'],
      undefined,
      config['private_key'],
      'https://www.googleapis.com/auth/spreadsheets'
    );

    const googleSheet = google.sheets({version: 'v4', auth});
    const spreadsheetId = process.env.GOOGLE_SHEET_ID || '';

    await googleSheet.spreadsheets.values.append({
      auth,
      spreadsheetId,
      valueInputOption: 'USER_ENTERED',
      range: 'Sheet1!A:B',
      requestBody: {
        values: [[name, parsedEmail, phone, new Date().toString()]]
      }
    });

    await googleSheet.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            autoResizeDimensions: {
              dimensions: {
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 5
              }
            }
          }
        ]
      }
    });

    return res.status(200).json(true);
  } catch (e) {
    return res.status(500).json({error: e});
  }
}
