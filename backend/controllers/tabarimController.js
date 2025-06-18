import pool from '../db.js';

// שליפת כל התב"רים (כולל סינון)
export const getAllTabarim = async (req, res) => {
  try {
    const { q, ministry, year, status } = req.query;
    let sql = 'SELECT * FROM tabarim WHERE 1=1';
    const params = [];
    if (q) {
      sql += ' AND (CAST(tabar_number AS TEXT) ILIKE $' + (params.length + 1) +
        ' OR name ILIKE $' + (params.length + 1) +
        ' OR permission_number ILIKE $' + (params.length + 1) +
        ' OR ministry ILIKE $' + (params.length + 1) + ')';
      params.push(`%${q}%`);
    }
    if (ministry) {
      sql += ' AND ministry = $' + (params.length + 1);
      params.push(ministry);
    }
    if (year) {
      sql += ' AND year = $' + (params.length + 1);
      params.push(year);
    }
    if (status) {
      sql += ' AND status = $' + (params.length + 1);
      params.push(status);
    }
    sql += ' ORDER BY id DESC';

    const tabarimRes = await pool.query(sql, params);
    res.json(tabarimRes.rows);
  } catch (err) {
    console.error('Error fetching tabarim:', err);
    res.status(500).json({ error: 'Failed to fetch tabarim' });
  }
};

// שליפת תב"ר בודד כולל הכל
export const getTabarDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tabarRes = await pool.query('SELECT * FROM tabarim WHERE id = $1', [id]);
    if (tabarRes.rows.length === 0)
      return res.status(404).json({ error: 'Not found' });

    const itemsRes = await pool.query('SELECT * FROM tabar_items WHERE tabar_id = $1', [id]);
    const transRes = await pool.query('SELECT * FROM tabar_transactions WHERE tabar_id = $1 ORDER BY transaction_date DESC', [id]);
    const permsRes = await pool.query('SELECT * FROM tabar_permissions WHERE tabar_id = $1', [id]);
    const fundersRes = await pool.query('SELECT * FROM tabar_funding WHERE tabar_id = $1', [id]);
    const docsRes = await pool.query('SELECT * FROM tabar_documents WHERE tabar_id = $1', [id]);

    res.json({
      tabar: tabarRes.rows[0],
      items: itemsRes.rows,
      transactions: transRes.rows,
      permissions: permsRes.rows,
      funders: fundersRes.rows,
      documents: docsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching tabar details:', err);
    res.status(500).json({ error: 'Failed to fetch tabar details' });
  }
};

// יצירת תב"ר חדש עם סעיפי הכנסה והוצאה אוטומטיים
export const createTabar = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      tabar_number, name, year, ministry,
      total_authorized, permission_number, status,
      open_date, close_date,
      department, additional_funders, municipal_participation
    } = req.body;

    const totalAuthorizedValue = total_authorized ? Number(total_authorized) : 0;
    const municipalParticipationValue = municipal_participation ? Number(municipal_participation) : 0;

    // יצירת התב"ר
    const tabarResult = await client.query(
      `INSERT INTO tabarim (tabar_number, name, year, ministry, total_authorized, permission_number, status, open_date, close_date, department, additional_funders, municipal_participation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        tabar_number, name, year, ministry, totalAuthorizedValue,
        permission_number, status, open_date, close_date,
        department, additional_funders, municipalParticipationValue
      ]
    );

    const newTabar = tabarResult.rows[0];
    const tabarId = newTabar.id;

    // יצירת סעיפי הכנסה והוצאה אוטומטיים
    if (totalAuthorizedValue > 0) {
      // סעיף הכנסה - התקציב המאושר
      await client.query(
        `INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tabarId,
          'הכנסה',
          `${tabar_number}-INC-001`,
          `הכנסה - ${name}`,
          totalAuthorizedValue,
          'סעיף הכנסה אוטומטי'
        ]
      );

      // סעיף הוצאה - התקציב המאושר
      await client.query(
        `INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tabarId,
          'הוצאה',
          `${tabar_number}-EXP-001`,
          `הוצאה - ${name}`,
          totalAuthorizedValue,
          'סעיף הוצאה אוטומטי'
        ]
      );
    }

    // אם יש השתתפות עירונית, יוצרים סעיף נפרד
    if (municipalParticipationValue > 0) {
      await client.query(
        `INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tabarId,
          'הכנסה',
          `${tabar_number}-MUN-001`,
          `השתתפות עירונית - ${name}`,
          municipalParticipationValue,
          'השתתפות עירונית'
        ]
      );
    }

    await client.query('COMMIT');
    
    // החזרת התב"ר החדש עם הפריטים
    const itemsRes = await pool.query('SELECT * FROM tabar_items WHERE tabar_id = $1', [tabarId]);
    
    res.status(201).json({
      tabar: newTabar,
      items: itemsRes.rows
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating tabar:', err);
    res.status(500).json({ error: 'Failed to create tabar' });
  } finally {
    client.release();
  }
};

// הוספת פריט תקציב חדש
export const addTabarItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_type, budget_item_code, budget_item_name, amount, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO tabar_items (tabar_id, item_type, budget_item_code, budget_item_name, amount, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, item_type, budget_item_code, budget_item_name, amount, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding tabar item:', err);
    res.status(500).json({ error: 'Failed to add tabar item' });
  }
};

// עדכון פריט תקציב
export const updateTabarItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { item_type, budget_item_code, budget_item_name, amount, notes } = req.body;

    const result = await pool.query(
      `UPDATE tabar_items SET
        item_type = $1, budget_item_code = $2, budget_item_name = $3, amount = $4, notes = $5
       WHERE id = $6 RETURNING *`,
      [item_type, budget_item_code, budget_item_name, amount, notes, itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating tabar item:', err);
    res.status(500).json({ error: 'Failed to update tabar item' });
  }
};

// מחיקת פריט תקציב
export const deleteTabarItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // מחיקת תנועות קשורות לפריט
    await pool.query('DELETE FROM tabar_transactions WHERE item_id = $1', [itemId]);
    
    // מחיקת הפריט
    const result = await pool.query('DELETE FROM tabar_items WHERE id = $1 RETURNING *', [itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting tabar item:', err);
    res.status(500).json({ error: 'Failed to delete tabar item' });
  }
};

// הוספת תנועה כספית
export const addTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      item_id, transaction_type, transaction_date, order_number, 
      amount, direction, status, description 
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tabar_transactions 
       (tabar_id, item_id, transaction_type, transaction_date, order_number, amount, direction, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, item_id, transaction_type, transaction_date, order_number, amount, direction, status, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
};

// עדכון תנועה כספית
export const updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { 
      transaction_type, transaction_date, order_number, 
      amount, direction, status, description 
    } = req.body;

    const result = await pool.query(
      `UPDATE tabar_transactions SET
        transaction_type = $1, transaction_date = $2, order_number = $3,
        amount = $4, direction = $5, status = $6, description = $7
       WHERE id = $8 RETURNING *`,
      [transaction_type, transaction_date, order_number, amount, direction, status, description, transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

// מחיקת תנועה כספית
export const deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const result = await pool.query('DELETE FROM tabar_transactions WHERE id = $1 RETURNING *', [transactionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// עדכון תב"ר
export const updateTabar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tabar_number, name, year, ministry,
      total_authorized, permission_number, status,
      open_date, close_date,
      department, additional_funders, municipal_participation
    } = req.body;

    const totalAuthorizedValue = total_authorized ? Number(total_authorized) : null;
    const municipalParticipationValue = municipal_participation ? Number(municipal_participation) : null;

    const result = await pool.query(
      `UPDATE tabarim SET
        tabar_number = $1, name = $2, year = $3, ministry = $4,
        total_authorized = $5, permission_number = $6, status = $7,
        open_date = $8, close_date = $9,
        department = $10, additional_funders = $11, municipal_participation = $12
       WHERE id = $13 RETURNING *`,
      [
        tabar_number, name, year, ministry, totalAuthorizedValue,
        permission_number, status, open_date, close_date,
        department, additional_funders, municipalParticipationValue, id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating tabar:', err);
    res.status(500).json({ error: 'Failed to update tabar' });
  }
};

// ✅ פונקציה שהייתה חסרה – הוספת מקור מימון
export const addFundingSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { funder_name, amount, percent, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO tabar_funding (tabar_id, funder_name, amount, percent, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, funder_name, amount, percent, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding funding source:', err);
    res.status(500).json({ error: 'Failed to add funding source' });
  }
};

// הוספת הרשאה
export const addPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_number, ministry, amount, start_date, end_date, document_url } = req.body;

    const result = await pool.query(
      `INSERT INTO tabar_permissions (tabar_id, permission_number, ministry, amount, start_date, end_date, document_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, permission_number, ministry, amount, start_date, end_date, document_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding permission:', err);
    res.status(500).json({ error: 'Failed to add permission' });
  }
};

// הוספת מסמכים
export const addDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const permissionFile = req.files?.permission_file?.[0];
    const approvalFile = req.files?.approval_file?.[0];
    const extraFile1 = req.files?.extra_file_1?.[0];
    const extraFile2 = req.files?.extra_file_2?.[0];
    const extraFile3 = req.files?.extra_file_3?.[0];

    const filesToInsert = [
      { file: permissionFile, desc: 'Permission File' },
      { file: approvalFile, desc: 'Approval File' },
      { file: extraFile1, desc: 'Extra File 1' },
      { file: extraFile2, desc: 'Extra File 2' },
      { file: extraFile3, desc: 'Extra File 3' },
    ].filter(f => f.file);

    const insertedDocs = [];

    for (const { file, desc } of filesToInsert) {
      const fileUrl = `/uploads/${file.filename}`;
      const result = await pool.query(
        `INSERT INTO tabar_documents (tabar_id, description, file_url)
         VALUES ($1, $2, $3) RETURNING *`,
        [id, desc, fileUrl]
      );
      insertedDocs.push(result.rows[0]);
    }

    res.status(201).json({ message: 'Documents uploaded', documents: insertedDocs });
  } catch (err) {
    console.error('Error adding document:', err);
    res.status(500).json({ error: 'Failed to add documents' });
  }
};
