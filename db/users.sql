CREATE TABLE gender_lookup (
    gender_id   SMALLINT     NOT NULL PRIMARY KEY AUTO_INCREMENT,
    gender_name VARCHAR(100)  NOT NULL
);

CREATE TABLE ethnicity_lookup (
    race_id     SMALLINT     NOT NULL PRIMARY KEY AUTO_INCREMENT,
    race_name   VARCHAR(100) NOT NULL
);

CREATE TABLE users (
    email        VARCHAR(100) PRIMARY KEY,
    first_name   VARCHAR(50)  NOT NULL,
    last_name    VARCHAR(50)  NOT NULL,
    password     VARCHAR(50)  NOT NULL,
    phone_number VARCHAR(15),
    user_type    ENUM('customer', 'employee'),
    gender       SMALLINT,
    ethnicity    SMALLINT,
    CONSTRAINT fk_users_gender
        FOREIGN KEY (gender)    REFERENCES gender_lookup(gender_id),
    CONSTRAINT fk_users_ethnicity
        FOREIGN KEY (ethnicity) REFERENCES ethnicity_lookup(race_id)
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
        FOREIGN KEY (email)          REFERENCES users(email)
            ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_employees_truck
        FOREIGN KEY (license_plate)  REFERENCES food_trucks(license_plate)
            ON UPDATE CASCADE
);

CREATE TABLE managers (
    email  VARCHAR(100)  NOT NULL,
    budget DECIMAL(10,2),
    CONSTRAINT pk_managers
        PRIMARY KEY (email),
    CONSTRAINT fk_managers_email
        FOREIGN KEY (email) REFERENCES employees(email)
            ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT INTO gender_lookup (gender_name) VALUES ('Male');
INSERT INTO gender_lookup (gender_name) VALUES ('Female');
INSERT INTO ethnicity_lookup (race_name) VALUES ('White');
INSERT INTO ethnicity_lookup (race_name) VALUES ('Black');