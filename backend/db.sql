-- טבלת פרויקטים (תב"ר / קולות קוראים)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('תבר', 'קול קורא')),
    department_id INTEGER,
    start_date DATE,
    end_date DATE,
    budget_amount NUMERIC,
    status TEXT DEFAULT 'טיוטה',
    created_at TIMESTAMP DEFAULT NOW()
);

-- דיווחים
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    report_date DATE NOT NULL,
    status TEXT DEFAULT 'טיוטה',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- מסמכים
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- אבני דרך
CREATE TABLE IF NOT EXISTS milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    title TEXT NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'לא התחיל',
    description TEXT
);

-- תגובות/הערות
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id),
    user_id INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- התראות
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    message TEXT,
    alert_date DATE,
    alert_type TEXT
);

-- הרשאות
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    year INTEGER,
    ministry TEXT,
    amount NUMERIC,
    valid_until DATE
);

-- גורמי מימון
CREATE TABLE IF NOT EXISTS funding_sources (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    source_name TEXT,
    amount NUMERIC
);
