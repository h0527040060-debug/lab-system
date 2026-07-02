/**
 * @typedef {Object} Customer
 * @property {string} id - CUST-XXXX
 * @property {string} name
 * @property {string} phone
 * @property {string} [phone2]
 * @property {string} [email]
 * @property {string} [address]
 * @property {string} [notes]
 * @property {string} created_at - ISO date
 */

/**
 * @typedef {Object} Device
 * @property {string} id - DEV-XXXX (קבוע לכל החיים)
 * @property {string} customer_id
 * @property {string} brand
 * @property {string} model
 * @property {string} [serial_number]
 * @property {string} [manufacture_year]
 * @property {string} [notes]
 * @property {string} created_at
 */

/**
 * @typedef {Object} RepairPart
 * @property {number} part_id
 * @property {string} part_name
 * @property {number} quantity
 * @property {number} unit_cost - עלות FIFO
 * @property {number} selling_price - מחיר מכירה
 * @property {string} [batch_id]
 */

/**
 * @typedef {Object} RepairWorkItem
 * @property {string} work_code - W-XXX
 * @property {string} work_name
 * @property {number} hours
 * @property {number} hourly_rate
 * @property {number} total_price
 */

/**
 * @typedef {Object} Repair
 * @property {string} id - QR_YYYYMMDD_XXX
 * @property {string} device_id
 * @property {string|null} customer_id - null עבור מוצרי יד שנייה פנימיים
 * @property {'customer'|'internal_used'} repair_type - סוג התיקון
 * @property {string} status - מתוך REPAIR_STATUSES
 * @property {string} warranty_type - מתוך WARRANTY_TYPES
 * @property {string} intake_date - ISO date
 * @property {string} [diagnosis_date]
 * @property {string} [completion_date]
 * @property {string} [technician_id]
 * @property {string} [fault_description] - תיאור תקלה מהלקוח
 * @property {string} [diagnosis_notes] - אבחון טכנאי
 * @property {string} [work_done_notes] - תיעוד עבודה
 * @property {RepairPart[]} parts
 * @property {RepairWorkItem[]} work_items
 * @property {number} labor_cost
 * @property {number} parts_cost
 * @property {number} total_price
 * @property {boolean} is_paid
 * @property {string} [payment_date]
 * @property {string} [payment_method] - מזומן / העברה / צ'ק
 * @property {number} timer_seconds - סטופר מצטבר
 * @property {string} [timer_started_at] - ISO date, null אם מושהה
 * @property {string} [warranty_appeal_notes]
 * @property {string} [warranty_decision] - approved / rejected
 */

/**
 * @typedef {Object} Part
 * @property {number} id
 * @property {string} name
 * @property {string} [manufacturer]
 * @property {string} [manufacturer_sku]
 * @property {string} internal_barcode - BR-CAT-XXX
 * @property {string} category
 * @property {string} [shelf]
 * @property {string} [bin]
 * @property {string} [zone]
 * @property {PartSupplier[]} suppliers
 * @property {number} min_stock
 * @property {number} selling_markup_percent
 * @property {string[]} images
 */

/**
 * @typedef {Object} PartSupplier
 * @property {number} supplier_id
 * @property {string} supplier_name
 * @property {string} [supplier_sku]
 * @property {number} price
 * @property {number} lead_time_days
 * @property {boolean} is_default
 */

/**
 * @typedef {Object} StockBatch
 * @property {string} id - BATCH-XXXX
 * @property {number} part_id
 * @property {string} received_date - ISO date
 * @property {number} quantity
 * @property {number} quantity_remaining
 * @property {string} supplier_name
 * @property {number} unit_cost
 * @property {string|null} purchase_order_id
 */

/**
 * @typedef {Object} Supplier
 * @property {number} id
 * @property {string} name
 * @property {string} [phone]
 * @property {string} [contact_person]
 * @property {string} [email]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} PurchaseOrder
 * @property {string} id - PO-XXX
 * @property {number} supplier_id
 * @property {string} supplier_name
 * @property {string} order_date - ISO date
 * @property {string} status - draft / sent / received / cancelled
 * @property {POItem[]} items
 * @property {number} total_cost
 * @property {string} [notes]
 * @property {string} [received_date]
 */

/**
 * @typedef {Object} POItem
 * @property {number} part_id
 * @property {string} part_name
 * @property {number} quantity
 * @property {number} unit_price
 */

/**
 * @typedef {Object} GeneralExpense
 * @property {string} id
 * @property {string} date - ISO date
 * @property {string} category - מתוך EXPENSE_CATEGORIES
 * @property {string} description
 * @property {number} amount
 * @property {string} [supplier_name]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} WorkCatalogItem
 * @property {string} id - W-XXX
 * @property {string} work_name
 * @property {string} brand
 * @property {string} model
 * @property {number} price
 * @property {number} estimated_hours_default
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Service
 * @property {number} id
 * @property {string} name
 * @property {number} base_price
 * @property {string} [description]
 */

/**
 * @typedef {Object} Technician
 * @property {number} id
 * @property {string} name
 * @property {number} hourly_cost
 * @property {string} [phone]
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} WarrantyAppeal
 * @property {string} id
 * @property {string} repair_id
 * @property {string} created_at
 * @property {string} [notes]
 * @property {string} status - pending / approved / rejected
 * @property {string} [resolved_at]
 */

/**
 * @typedef {Object} Settings
 * @property {string} business_name
 * @property {string} business_address
 * @property {string} business_phone
 * @property {number} vat_percent_display
 * @property {number} alert_stuck_repair_days
 */

/**
 * @typedef {Object} CurrentUser
 * @property {string} role - office | lab
 * @property {string} name
 * @property {number|null} technician_id
 */
