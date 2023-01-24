import type {NextApiRequest, NextApiResponse} from 'next';
import {GoogleSpreadsheet} from 'google-spreadsheet';

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

    const sheetId = process.env.GOOGLE_SHEET_ID || '';
    let doc;

    try {
      doc = new GoogleSpreadsheet(sheetId);
      await doc.useServiceAccountAuth(
        JSON.parse(process.env.GOOGLE_SHEET_API_CONFIG || '{}')
      );
      console.log('doc', JSON.stringify(doc));
    } catch (error) {
      return res
        .status(500)
        .json({message: 'First', doc: JSON.stringify(doc), error});
    }

    try {
      await doc.loadInfo();
    } catch (error) {
      return res.status(500).json({message: 'Second', error});
    }
    let sheet;
    try {
      sheet = doc.sheetsByIndex[0];
      await sheet.setHeaderRow(['Nome', 'Email', 'Telefone', 'Data']);
    } catch (error) {
      return res.status(500).json({message: 'Third', error});
    }

    try {
      await sheet.addRow({
        Nome: name,
        Email: parsedEmail,
        Telefone: phone,
        Data: new Date().toString()
      });
    } catch (error) {
      return res.status(500).json({message: 'Fourth', error});
    }

    return res.status(200).json(true);
  } catch (e) {
    return res.status(500).json({error: e});
  }
}
