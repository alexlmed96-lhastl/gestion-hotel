require("dotenv").config(); // Esta tiene que ser la línea 1
const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});