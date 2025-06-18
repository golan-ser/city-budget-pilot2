-- 🔧 סקריפט מאסטר לתיקון מסד הנתונים
-- נוצר על ידי בדיקת תקינות מסד נתונים מקצועית
-- תאריך: $(date)

BEGIN;

-- ========================================
-- שלב 1: ניקוי טבלאות לא בשימוש
-- ========================================

DO $$
BEGIN
    -- הסרת טבלאות לא בשימוש בסדר הנכון (תחילה child tables)
    DROP TABLE IF EXISTS requests CASCADE;
    RAISE NOTICE 'Dropped table: requests';
    
    DROP TABLE IF EXISTS orders CASCADE;
    RAISE NOTICE 'Dropped table: orders';
    
    DROP TABLE IF EXISTS invoices CASCADE;
    RAISE NOTICE 'Dropped table: invoices';
    
    DROP TABLE IF EXISTS suppliers CASCADE;
    RAISE NOTICE 'Dropped table: suppliers';
    
    RAISE NOTICE '✅ Unused tables removed successfully';
END
$$;

-- ========================================
-- שלב 2: הוספת קשרים חסרים
-- ========================================

DO $$
BEGIN
    -- הוספת עמודת tabar_id לטבלת budget_items
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'budget_items' AND column_name = 'tabar_id'
    ) THEN
        ALTER TABLE budget_items ADD COLUMN tabar_id INTEGER;
        RAISE NOTICE 'Added column tabar_id to budget_items';
    END IF;
    
    -- הוספת קשר foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_budget_items_tabar_id'
    ) THEN
        ALTER TABLE budget_items 
        ADD CONSTRAINT fk_budget_items_tabar_id 
        FOREIGN KEY (tabar_id) REFERENCES tabarim(id) 
        ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint fk_budget_items_tabar_id';
    END IF;
    
    -- הוספת אינדקס לביצועים טובים יותר
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_budget_items_tabar_id'
    ) THEN
        CREATE INDEX idx_budget_items_tabar_id ON budget_items(tabar_id);
        RAISE NOTICE 'Added index idx_budget_items_tabar_id';
    END IF;
    
    RAISE NOTICE '✅ Missing relationships added successfully';
END
$$;

-- ========================================
-- שלב 3: בדיקת תקינות נתונים
-- ========================================

DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- בדיקת כפילויות בטבלת departments
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT name, COUNT(*) 
        FROM departments 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'Found % duplicate department names', duplicate_count;
    ELSE
        RAISE NOTICE '✅ No duplicate departments found';
    END IF;
    
    -- בדיקת כפילויות בטבלת tabarim
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT year, tabar_number, COUNT(*) 
        FROM tabarim 
        GROUP BY year, tabar_number 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'Found % duplicate tabar numbers', duplicate_count;
    ELSE
        RAISE NOTICE '✅ No duplicate tabar numbers found';
    END IF;
END
$$;

-- ========================================
-- שלב 4: סטטיסטיקות מסד נתונים
-- ========================================

DO $$
DECLARE
    table_count INTEGER;
    relationship_count INTEGER;
BEGIN
    -- ספירת טבלאות
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- ספירת קשרים
    SELECT COUNT(*) INTO relationship_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
    
    RAISE NOTICE '📊 Database Statistics:';
    RAISE NOTICE '   Tables: %', table_count;
    RAISE NOTICE '   Foreign Keys: %', relationship_count;
END
$$;

-- הודעת סיום
SELECT '🎉 Database fixes completed successfully!' as status;

COMMIT; 