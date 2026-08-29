import pool from "../src/config/db";

async function testConnection() {
  try {
    console.log("🔗 Testando conexão com o banco de dados...\n");

    const connection = await pool.getConnection();
    console.log("✅ Conexão estabelecida com sucesso!");

    // Testar uma query simples
    const [results] = await connection.query(
      "SELECT COUNT(*) as count FROM alunos"
    );
    console.log("📊 Resultado da query:", results);

    connection.release();
    console.log("\n✨ Banco de dados está funcionando!");
  } catch (error: any) {
    console.error("❌ Erro ao conectar ao banco de dados:");
    console.error("Mensagem:", error.message);
    console.error("\n💡 Verifique:");
    console.error("  1. Se o MySQL está rodando");
    console.error("  2. Se as credenciais no .env estão corretas");
    console.error("  3. Se o banco de dados foi criado (execute: npm run setup-db)");
  }

  process.exit(0);
}

testConnection();
