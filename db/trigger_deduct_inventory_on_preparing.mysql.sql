-- Trigger: Deduct truck inventory when a checkout order transitions to 'preparing'.
-- Before the UPDATE that sets order_status = 'preparing', the application must run:
--   SET @current_employee_email = '<employee_email>';
-- This is required because inventory_adjustments.adjusted_by has a NOT NULL FK to employees(email).

DELIMITER $$

CREATE TRIGGER deduct_inventory_on_preparing
AFTER UPDATE ON checkout
FOR EACH ROW
BEGIN
  DECLARE v_done          TINYINT(1)    DEFAULT 0;
  DECLARE v_oi_quantity   INT;
  DECLARE v_ingredient_id INT;
  DECLARE v_qty_needed    DECIMAL(10,2);
  DECLARE v_total_deduct  DECIMAL(10,2);

  -- Flatten order_items × recipe_ingredient into one cursor (no nested DECLAREs in MySQL)
  DECLARE cur CURSOR FOR
    SELECT oi.quantity,
           ri.ingredient_id,
           ri.quantity_needed
    FROM   order_items       oi
    JOIN   recipe_ingredient ri ON ri.menu_item_id = oi.menu_item_id
    WHERE  oi.order_id = NEW.checkout_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  IF NEW.order_status = 'preparing' AND OLD.order_status <> 'preparing' THEN

    OPEN cur;
    deduct_loop: LOOP
      FETCH cur INTO v_oi_quantity, v_ingredient_id, v_qty_needed;
      IF v_done THEN
        LEAVE deduct_loop;
      END IF;

      SET v_total_deduct = v_qty_needed * v_oi_quantity;

      -- Deduct from truck_inventory (will not go below 0 due to application guard;
      -- add a CHECK constraint or GREATEST(..., 0) here if stricter enforcement is needed)
      UPDATE truck_inventory
      SET    quantity_on_hand = quantity_on_hand - v_total_deduct
      WHERE  license_plate = NEW.license_plate
        AND  ingredient_id = v_ingredient_id;

      -- Log the deduction; @current_employee_email must be SET before the checkout UPDATE
      INSERT INTO inventory_adjustments
        (license_plate, ingredient_id, adjustment_type,    quantity_change,  reason,                                                         adjusted_by,               reference_id)
      VALUES
        (NEW.license_plate, v_ingredient_id, 'order-deduction', -v_total_deduct, CONCAT('Order #', NEW.order_number, ': status → preparing'), @current_employee_email, NEW.checkout_id);

    END LOOP deduct_loop;
    CLOSE cur;

  END IF;
END$$

DELIMITER ;
