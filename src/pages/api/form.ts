import {GoogleSpreadsheet} from 'google-spreadsheet';
import type {NextApiRequest, NextApiResponse} from 'next';

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

    // const auth = new google.auth.GoogleAuth({
    //   scopes: 'https://www.googleapis.com/auth/spreadsheets',
    //   // keyFile: 'C:/Users/jp_ba/Downloads/hackathon-moinho-3d68a768aca4.json'
    //   credentials: JSON.parse(process.env.GOOGLE_SHEET_API_CONFIG || '{}')
    // });
    // console.log('key', process.env.GOOGLE_SHEET_API_CONFIG);
    // const auth = new google.auth.JWT(
    //   JSON.parse(process.env.GOOGLE_SHEET_API_CONFIG || '{}')['client_email'],
    //   undefined,
    //   JSON.parse(process.env.GOOGLE_SHEET_API_CONFIG || '{}')['private_key'],
    //   'https://www.googleapis.com/auth/spreadsheets'
    // );
    // // const client = await auth.getClient();
    // const googleSheet = google.sheets({version: 'v4', auth});

    // // const ress = await googleSheet.spreadsheets.values.get({
    // //   spreadsheetId,
    // //   range: 'Sheet1!A:B'
    // // });
    // // return res.status(200).json({data: ress.data});

    // await googleSheet.spreadsheets.values.append({
    //   spreadsheetId,
    //   valueInputOption: 'USER_ENTERED',
    //   requestBody: {
    //     values: [[name, parsedEmail, phone, new Date().toString()]]
    //   }
    // });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID || '';

    const doc = new GoogleSpreadsheet(spreadsheetId);
    await doc.useServiceAccountAuth(
      JSON.parse(process.env.GOOGLE_SHEET_API_CONFIG || '{}')
    );
    console.log('doc', JSON.stringify(doc));

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    await sheet.setHeaderRow(['Nome', 'Email', 'Telefone', 'Data']);

    await sheet.addRow({
      Nome: name,
      Email: parsedEmail,
      Telefone: phone,
      Data: new Date().toString()
    });

    return res.status(200).json(true);
  } catch (e) {
    return res.status(500).json({error: e});
  }
}
