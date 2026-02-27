-- LOOKUP TABLES

CREATE TABLE gender_lookup (
    gender_id   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    gender      VARCHAR(100) NOT NULL
);
INSERT INTO gender_lookup (gender) VALUES ('Male'), ('Female'), ('Non-binary'), ('Prefer not to say');

CREATE TABLE race_lookup (
    race_id     INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    race        VARCHAR(100) NOT NULL
);
INSERT INTO race_lookup (race) VALUES ('Arab'), ('Asian'), ('Black or African American'), ('Hispanic or Latino'), ('Native American'), ('Pacific Islander'), ('White'), ('Prefer not to say');

CREATE TABLE menu_category_lookup (
    category_id   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);
INSERT INTO menu_category_lookup (category_name) VALUES ('Appetizers'), ('Entrees'), ('Sides'), ('Desserts'), ('Drinks');

-- FOOD TRUCKS

CREATE TABLE food_trucks (
    license_plate         VARCHAR(20)  PRIMARY KEY,
    truck_name            VARCHAR(100) NOT NULL,
    current_location      VARCHAR(255),
    phone_number          VARCHAR(15),
    accepts_online_orders BOOLEAN      DEFAULT TRUE,
    operating_hours_start VARCHAR(100),
    operating_hours_end   VARCHAR(100)
);

-- USERS / AUTH

CREATE TABLE users (
    email        VARCHAR(100) PRIMARY KEY,
    first_name   VARCHAR(50)  NOT NULL,
    last_name    VARCHAR(50)  NOT NULL,
    password     VARCHAR(50)  NOT NULL,
    phone_number VARCHAR(15),
    user_type    ENUM('customer', 'employee'),
    gender       INT,
    ethnicity    INT,
    CONSTRAINT fk_users_gender
        FOREIGN KEY (gender)    REFERENCES gender_lookup(gender_id),
    CONSTRAINT fk_users_ethnicity
        FOREIGN KEY (ethnicity) REFERENCES race_lookup(race_id)
);

CREATE TABLE customers (
    email           VARCHAR(100) NOT NULL,
    default_address TEXT,
    CONSTRAINT pk_customers
        PRIMARY KEY (email),
    CONSTRAINT fk_customers_email
        FOREIGN KEY (email) REFERENCES users(email)
            ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE employees (
    email         VARCHAR(100) NOT NULL,
    license_plate VARCHAR(20)  NOT NULL,
    role          ENUM('admin', 'manager', 'cashier', 'cook'),
    hire_date     DATE         NOT NULL,
    hourly_rate   DECIMAL(5,2),
    is_active     BOOLEAN      DEFAULT TRUE,
    CONSTRAINT pk_employees
        PRIMARY KEY (email),
    CONSTRAINT fk_employees_email
        FOREIGN KEY (email)         REFERENCES users(email)
            ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_employees_truck
        FOREIGN KEY (license_plate) REFERENCES food_trucks(license_plate)
            ON UPDATE CASCADE
);

CREATE TABLE managers (
    email  VARCHAR(100) NOT NULL,
    budget DECIMAL(10,2),
    CONSTRAINT pk_managers
        PRIMARY KEY (email),
    CONSTRAINT fk_managers_email
        FOREIGN KEY (email) REFERENCES employees(email)
            ON UPDATE CASCADE ON DELETE CASCADE
);

-- SUPPLIERS & INGREDIENTS

CREATE TABLE suppliers (
    supplier_id      INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    supplier_name    VARCHAR(100) NOT NULL,
    contact_person   VARCHAR(100),
    email            VARCHAR(100),
    phone_number     VARCHAR(15),
    address          TEXT,
    is_reliable_supplier BOOLEAN  DEFAULT TRUE
);

CREATE TABLE ingredients (
    ingredient_id        INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ingredient_name      VARCHAR(100) NOT NULL,
    category             VARCHAR(50),
    unit_of_measure      ENUM('g','kg','ml','l','tsp','tbsp','cup','oz','lb','pcs'),
    current_unit_cost    DECIMAL(8,2) NOT NULL,
    storage_time         SMALLINT,
    preferred_supplier_id INT,
    CONSTRAINT fk_ingredients_supplier
        FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(supplier_id)
            ON DELETE SET NULL
            ON UPDATE SET NULL
);

-- INVENTORY

CREATE TABLE truck_inventory (
    inventory_id      INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    license_plate     VARCHAR(20)   NOT NULL,
    ingredient_id     INT           NOT NULL,
    quantity_on_hand  DECIMAL(10,2) NOT NULL DEFAULT 0,
    reorder_threshold DECIMAL(10,2) NOT NULL,
    expiration_date   DATETIME,
    last_restocked    TIMESTAMP,
    CONSTRAINT fk_tinv_truck
        FOREIGN KEY (license_plate)  REFERENCES food_trucks(license_plate),
    CONSTRAINT fk_tinv_ingredient
        FOREIGN KEY (ingredient_id)  REFERENCES ingredients(ingredient_id)
);

-- MENU

CREATE TABLE menu_items (
    menu_item_id INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item_name    VARCHAR(100) NOT NULL,
    category     INT,
    description  TEXT,
    price        DECIMAL(6,2) NOT NULL,
    is_available BOOLEAN      DEFAULT TRUE,
    image_url    VARCHAR(255),
    CONSTRAINT fk_menu_category
        FOREIGN KEY (category) REFERENCES menu_category_lookup(category_id)
);

-- @block
CREATE TABLE recipe_ingredient (
    recipe_id       INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    menu_item_id    INT           NOT NULL,
    ingredient_id   INT           NOT NULL,
    quantity_needed DECIMAL(10,2) NOT NULL,
    instructions    TEXT,
    CONSTRAINT fk_recipe_menu
        FOREIGN KEY (menu_item_id)  REFERENCES menu_items(menu_item_id),
    CONSTRAINT fk_recipe_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
);

-- ORDERS / CHECKOUT

CREATE TABLE checkout (
    checkout_id    INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_number   VARCHAR(20)   NOT NULL,
    license_plate  VARCHAR(20)   NOT NULL,
    customer_email VARCHAR(100),
    order_type     ENUM('walk-in', 'online-pickup') NOT NULL,
    order_status   ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL,
    scheduled_time DATETIME,
    total_price    DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'credit', 'debit') NOT NULL,
    payment_status ENUM('pending', 'completed', 'cancelled', 'refunded') NOT NULL,
    CONSTRAINT fk_checkout_truck
        FOREIGN KEY (license_plate)  REFERENCES food_trucks(license_plate),
    CONSTRAINT fk_checkout_customer
        FOREIGN KEY (customer_email) REFERENCES users(email)
);

CREATE TABLE order_items (
    order_item_id   INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id        INT           NOT NULL,
    menu_item_id    INT           NOT NULL,
    quantity        INT           NOT NULL,
    line_total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_orderitems_checkout
        FOREIGN KEY (order_id)      REFERENCES checkout(checkout_id),
    CONSTRAINT fk_orderitems_menu
        FOREIGN KEY (menu_item_id)  REFERENCES menu_items(menu_item_id)
);

-- SUPPLY ORDERS

CREATE TABLE supply_orders (
    po_id                  INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    supplier_id            INT           NOT NULL,
    license_plate          VARCHAR(20)   NOT NULL,
    created_by             VARCHAR(100)  NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date   DATE,
    status                 ENUM('pending', 'ordered', 'received', 'cancelled'),
    total_cost             DECIMAL(10,2),
    CONSTRAINT fk_supplyorder_supplier
        FOREIGN KEY (supplier_id)   REFERENCES suppliers(supplier_id),
    CONSTRAINT fk_supplyorder_truck
        FOREIGN KEY (license_plate) REFERENCES food_trucks(license_plate),
    CONSTRAINT fk_supplyorder_employee
        FOREIGN KEY (created_by)    REFERENCES employees(email)
);

CREATE TABLE supply_order_items (
    po_item_id        INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    po_id             INT           NOT NULL,
    ingredient_id     INT           NOT NULL,
    quantity_ordered  DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2) DEFAULT 0,
    unit_cost         DECIMAL(8,2)  NOT NULL,
    line_total        DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_poitems_po
        FOREIGN KEY (po_id)          REFERENCES supply_orders(po_id),
    CONSTRAINT fk_poitems_ingredient
        FOREIGN KEY (ingredient_id)  REFERENCES ingredients(ingredient_id)
);

-- ALERTS & ADJUSTMENTS

CREATE TABLE reorder_alerts (
    alert_id          INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    license_plate     VARCHAR(20)   NOT NULL,
    ingredient_id     INT           NOT NULL,
    current_quantity  DECIMAL(10,2) NOT NULL,
    reorder_threshold DECIMAL(10,2) NOT NULL,
    alert_created     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    alert_status      ENUM('active', 'ordered', 'resolved'),
    resolved_date     TIMESTAMP,
    resolved_by       VARCHAR(100),
    CONSTRAINT fk_alert_truck
        FOREIGN KEY (license_plate) REFERENCES food_trucks(license_plate),
    CONSTRAINT fk_alert_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id),
    CONSTRAINT fk_alert_resolver
        FOREIGN KEY (resolved_by)   REFERENCES employees(email)
);

CREATE TABLE inventory_adjustments (
    adjustment_id   INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    license_plate   VARCHAR(20)   NOT NULL,
    ingredient_id   INT           NOT NULL,
    adjustment_type ENUM('restock', 'waste', 'correction', 'order-deduction'),
    quantity_change DECIMAL(10,2) NOT NULL,
    reason          TEXT,
    adjusted_by     VARCHAR(100)  NOT NULL,
    adjustment_date TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    reference_id    INT,
    CONSTRAINT fk_adjinv_truck
        FOREIGN KEY (license_plate) REFERENCES food_trucks(license_plate),
    CONSTRAINT fk_adjinv_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id),
    CONSTRAINT fk_adjinv_employee
        FOREIGN KEY (adjusted_by)   REFERENCES employees(email)
);