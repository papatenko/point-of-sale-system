-- ============================================================
-- Seed: Default food truck + menu items for online ordering
-- Run this after db.sql has been applied
-- ============================================================

-- Default food truck used for all online orders
INSERT IGNORE INTO food_trucks (license_plate, truck_name, current_location, phone_number, accepts_online_orders)
VALUES ('ONLINE-1', 'Mini World Shawarma', 'Online', '555-0100', TRUE);

-- Menu items
-- Categories (already seeded in db.sql): 1=Appetizers, 2=Entrees, 3=Sides, 4=Desserts, 5=Drinks
INSERT INTO menu_items (item_name, category, description, price, is_available) VALUES
('Chicken Shawarma Wrap',    2, 'Tender marinated chicken shawarma with fresh veggies, pickles, and garlic sauce in a toasted flatbread',  10.99, TRUE),
('Beef Shawarma Wrap',       2, 'Seasoned beef shawarma with fresh veggies, pickles, and tahini sauce in a toasted flatbread',             11.99, TRUE),
('Chicken Shawarma Rice Bowl', 2, 'Grilled chicken shawarma over basmati rice with chickpeas, corn, tomatoes, onion, olives, and garlic sauce', 12.99, TRUE),
('Beef Shawarma Rice Bowl',  2, 'Juicy beef shawarma over basmati rice with chickpeas, corn, tomatoes, onion, olives, and tahini sauce',   13.99, TRUE),
('Fries',                    3, 'Crispy golden seasoned fries',                                                                             3.99, TRUE),
('Beverage',                 5, 'Choice of soft drink, water, or juice',                                                                    2.49, TRUE);
