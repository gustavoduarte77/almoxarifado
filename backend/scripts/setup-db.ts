import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  try {
    console.log("🔗 Conectando ao MySQL...");
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Usuário: ${process.env.DB_USER}`);

    // Ler o arquivo schema.sql
    const schemaPath = path.join(__dirname, "../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Dividir o schema em statements (separados por ";")
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`\n📝 Executando ${statements.length} statements SQL...\n`);

    for (const statement of statements) {
      try {
        await connection.query(statement);
        console.log("✅", statement.substring(0, 50) + "...");
      } catch (error: any) {
        console.error(
          "❌ Erro ao executar statement:",
          statement.substring(0, 50) + "..."
        );
        console.error("Erro:", error.message);
      }
    }

    console.log("\n✨ Banco de dados configurado com sucesso!");
  } catch (error: any) {
    console.error("❌ Erro ao conectar ao MySQL:");
    console.error("Mensagem:", error.message);
    console.error("\n💡 Verifique:");
    console.error("  1. Se o MySQL está rodando");
    console.error("  2. Se as credenciais no .env estão corretas");
    console.error("  3. Se o usuário tem permissão para criar bancos de dados");
  } finally {
    await connection.end();
  }
}

setupDatabase();
