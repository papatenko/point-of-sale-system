CREATE TABLE food_trucks (
    license_plate          VARCHAR(20)  PRIMARY KEY,
    truck_name             VARCHAR(100) NOT NULL,
    current_location       VARCHAR(255),
    phone_number           VARCHAR(15),
    accepts_online_orders  BOOLEAN      DEFAULT TRUE,
    operating_hours_start  VARCHAR(100),
    operating_hours_end    VARCHAR(100)
);