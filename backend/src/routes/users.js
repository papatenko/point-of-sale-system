import { verifyToken, signEmployeeToken } from "../auth/jwt.js";

function getAuthEmail(req) {
  const header = req?.headers?.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const payload = verifyToken(token);
  return payload?.email ?? null;
}

/** Current user profile (no password). Requires Bearer JWT from login. */
export async function getMyProfile(req, db) {
  const email = getAuthEmail(req);
  if (!email) {
    return { error: "Unauthorized" };
  }

  const [[row]] = await db.query(
    `
    SELECT
      u.email,
      u.first_name,
      u.last_name,
      u.phone_number,
      u.gender,
      u.ethnicity,
      g.gender AS gender_name,
      r.race AS race_name
    FROM users u
    LEFT JOIN gender_lookup g ON u.gender = g.gender_id
    LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
    WHERE u.email = ?
    `,
    [email],
  );

  if (!row) {
    return { error: "User not found" };
  }

  return row;
}

/**
 * Update own profile. Email in body is optional new email; identity is always
 * taken from the JWT (users cannot edit someone else's row).
 */
export async function updateMyProfile(req, body, db) {
  const email = getAuthEmail(req);
  if (!email) {
    return { error: "Unauthorized" };
  }

  const {
    first_name,
    last_name,
    phone_number,
    gender,
    ethnicity,
    new_email,
  } = body || {};

  if (!first_name || !last_name) {
    return { error: "first_name and last_name are required" };
  }

  const [[existing]] = await db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
  );
  if (!existing) {
    return { error: "User not found" };
  }

  const g = gender != null && gender !== "" ? parseInt(String(gender), 10) : null;
  const e = ethnicity != null && ethnicity !== "" ? parseInt(String(ethnicity), 10) : null;

  await db.query(
    `UPDATE users SET
       first_name = ?,
       last_name = ?,
       phone_number = ?,
       gender = ?,
       ethnicity = ?
     WHERE email = ?`,
    [
      first_name,
      last_name,
      phone_number || null,
      Number.isNaN(g) ? null : g,
      Number.isNaN(e) ? null : e,
      email,
    ],
  );

  let token = null;
  if (new_email && String(new_email).trim() && String(new_email).trim() !== email) {
    const next = String(new_email).trim();
    const [[taken]] = await db.query("SELECT email FROM users WHERE email = ?", [next]);
    if (taken) {
      return { error: "That email is already in use" };
    }
    await db.query("UPDATE users SET email = ? WHERE email = ?", [next, email]);
    token = signEmployeeToken(next);
    return {
      success: true,
      message: "Profile updated",
      email: next,
      token,
    };
  }

  return { success: true, message: "Profile updated", email };
}

export async function getUsers(db) {
  const [rows] = await db.query(`
    SELECT 
      u.email,
      u.first_name,
      u.last_name,
      u.password,
      u.phone_number,
      u.user_type,
      g.gender AS gender_name,
      r.race AS race_name
    FROM users u
    LEFT JOIN gender_lookup g ON u.gender = g.gender_id
    LEFT JOIN race_lookup r ON u.ethnicity = r.race_id
    ORDER BY u.last_name, u.first_name
  `);
  return rows;
}

export async function updateUser(body, db) {
  const {
    email,
    first_name,
    last_name,
    password,
    phone_number,
    gender,
    ethnicity,
  } = body;

  if (!email) {
    return { error: "email is required" };
  }

  const [[existing]] = await db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
  );

  if (!existing) {
    return { error: "User not found" };
  }

  await db.query(
    `UPDATE users SET
     first_name = COALESCE(?, first_name),
     last_name = COALESCE(?, last_name),
     password = COALESCE(?, password),
     phone_number = ?,
     gender = ?,
     ethnicity = ?
     WHERE email = ?`,
    [
      first_name,
      last_name,
      password,
      phone_number || null,
      gender ? parseInt(gender) : null,
      ethnicity ? parseInt(ethnicity) : null,
      email,
    ],
  );

  return {
    success: true,
    message: "User updated successfully",
  };
}

export async function deleteUser(body, db) {
  const { email } = body;

  if (!email) {
    return { error: "email is required" };
  }

  const [[existing]] = await db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
  );

  if (!existing) {
    return { error: "User not found" };
  }

  await db.query("DELETE FROM users WHERE email = ?", [email]);

  return {
    success: true,
    message: "User deleted successfully",
  };
}

export async function getGenderOptions(db) {
  const [rows] = await db.query(`
    SELECT gender_id, gender FROM gender_lookup ORDER BY gender
  `);
  return rows;
}

export async function getEthnicityOptions(db) {
  const [rows] = await db.query(`
    SELECT race_id, race FROM race_lookup ORDER BY race
  `);
  return rows;
}
