import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const menuImages = [
    [
      "Lamb Kofta Plate",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8dS-UhKh-EsmTcbs5gh-C7tFuRCFKtlpt-g&s",
    ],
    [
      "Nuggets",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuWNgqQ-RHepl101DM1Qblt4PPDzw4rFpmbw&s",
    ],
    [
      "French Fries",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRemFgwbD_8LFsZLqxKhyaW0odUJkkgj4UBRw&s",
    ],
    [
      "Saffron Rice",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5Ly6Xolf5ite3ixTDfKYgIl6dijYA4X0ptw&s",
    ],
    [
      "Mango Lassi",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHtmNgNXu01_ixJ4Lx2d0hxQJDnf4X6Q0pCg&s",
    ],
    [
      "Soft drink",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSS_hY6mc4BD5wjyp33SjZU2qSIlBmjPTk5GA&s",
    ],
    [
      "Water",
      "https://www.gundersenhealth.org/sites/default/files/styles/card_medium_4_3_600_450/public/be-well-6-easy-tips-to-drink-more-water-daily.png.webp?h=ae1281eb&itok=TzF1pY-P",
    ],
    [
      "Hummus & Pita",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPkTljKeD4wkn9raWENWAeWNPK71bTU0rSwA&s",
    ],
    [
      "Baklava",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQsDKytpDeuHHHIb-jflUdFVQl1A3quZhFvw&s",
    ],
  ];

  for (const [itemName, imageUrl] of menuImages) {
    await connection.execute(
      "UPDATE menu_items SET image_url = ? WHERE item_name = ?",
      [imageUrl, itemName],
    );
    console.log(`🔁 Updated ${itemName}`);
  }

  console.log("🎉 All images updated successfully!");
  await connection.end();
}

main().catch((err) => console.error(err));
