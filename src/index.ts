import app from "./app";
import { connectDB } from "./db";

const PORT = process.env.PORT || 9000;

connectDB()
  .then(() => {
    console.log("Connected to the database");
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongo db connection fail");
  });
