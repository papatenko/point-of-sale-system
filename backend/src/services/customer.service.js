import * as CustomerModel from "../models/customer.model.js";
import * as UserModel from "../models/users.model.js";

// export async function getAllCustomers(db) {
//   return await CustomerModel.findAll(db);
// }

// export async function createCustomer(db, data) {
//   const {
//     email,
//     first_name,
//     last_name,
//     password,
//     phone_number,
//     gender,
//     ethnicity,
//     default_address,
//   } = data;

//   //  Validación básica
//   if (!email || !first_name || !last_name || !password) {
//     return {
//       error: "email, first_name, last_name, and password are required",
//     };
//   }

//   //  Verificar si ya existe usuario
//   const existingUser = await UserModel.findByEmail(db, email);
//   if (existingUser) {
//     return { error: "User with this email already exists" };
//   }

//   // Crear en users primero
//    try {
//     const newUser = await UserModel.create(db, {
//       email,
//       first_name,
//       last_name,
//       password,
//       phone_number,
//       gender,
//       ethnicity,
//       user_type: "customer",
//     });
//     console.log("✅ User created:", newUser);
//   } catch (err) {
//     console.error("❌ Error creating user:", err);
//     return { error: "Failed to create user: " + err.message };
//   }
//   //crear en customers
//   const result = await CustomerModel.create(db, {
//     email,
//     default_address,
//   });

//   return {
//     success: true,
//     customer_id: result.insertId,
//     message: "Customer created successfully",
//   };
// }

// export async function deleteCustomer(db, data) {
//   const { email } = data;

//   if (!email) {
//     return { error: "email is required" };
//   }

//   const existing = await CustomerModel.findByEmail(db, email);
//   if (!existing) {
//     return { error: "Customer not found" };
//   }

//   // Solo borras user → cascade elimina customer
//   await CustomerModel.removeUser(db, email);

//   return {
//     success: true,
//     message: "Customer and associated user deleted successfully",
//   };
// }

// export async function getAllCustomers(db) {
//   try {
//     console.log("getAllCustomers called");
//     const customers = await CustomerModel.findAll(db);
//     console.log("Customers from model:", customers);
//     return customers;
//   } catch (error) {
//     console.error("Error in getAllCustomers:", error);
//     return [];
//   }
// }

export async function getAllCustomers(db) {
  try {
    const customers = await CustomerModel.findAll(db);
    return customers;
  } catch (error) {
    console.error("Error in getAllCustomers:", error);
    return [];
  }
}

export async function createCustomer(db, data) {
  const {
    email,
    first_name,
    last_name,
    password,
    phone_number,
    gender,
    ethnicity,
    default_address,
  } = data;

  console.log("Creating customer with data:", { email, first_name, last_name });

  // Validación básica
  if (!email || !first_name || !last_name || !password) {
    return {
      error: "email, first_name, last_name, and password are required",
    };
  }

  try {
    // Verificar si ya existe usuario
    const existingUser = await UserModel.findByEmail(db, email);
    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // Crear en users primero
    await UserModel.create(db, {
      email,
      first_name,
      last_name,
      password,
      phone_number,
      gender: gender ? parseInt(gender) : null,
      ethnicity: ethnicity ? parseInt(ethnicity) : null,
      user_type: "customer",
    });

    // Crear en customers
    const result = await CustomerModel.create(db, {
      email,
      default_address,
    });

    // Obtener el customer recién creado para confirmar
    const newCustomer = await CustomerModel.findByEmail(db, email);

    return {
      success: true,
      customer: newCustomer,
      message: "Customer created successfully",
    };
  } catch (error) {
    console.error("Error in createCustomer:", error);
    return {
      error: "Failed to create customer: " + error.message,
    };
  }
}

export async function deleteCustomer(db, data) {
  const { email } = data;

  if (!email) {
    return { error: "email is required" };
  }

  try {
    const existing = await CustomerModel.findByEmail(db, email);
    if (!existing) {
      return { error: "Customer not found" };
    }

    // Borrar user (cascade eliminará customer automáticamente)
    await CustomerModel.removeUser(db, email);

    return {
      success: true,
      message: "Customer and associated user deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteCustomer:", error);
    return {
      error: "Failed to delete customer: " + error.message,
    };
  }
}