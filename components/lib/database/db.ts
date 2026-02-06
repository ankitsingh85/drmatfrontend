import mysql2 from "mysql2/promise";

export default async function execute(props: any): Promise<any[]> {
  // TODO figure out the type
  let dbconnection: any;

  try {
    dbconnection = await mysql2.createConnection({
      host: process.env.MYSQL_HOSTNAME,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    const [results] = await dbconnection.execute(props.query, props.values);

    // await dbconnection.end();
    return results;
  } catch (error) {
    console.log(error);
    // dbconnection.end();
  } finally {
    try {
      await dbconnection.end();
    } catch (e) {}
  }
  return new Promise((resolve, reject) => {
    const success = true;

    if (success) {
      resolve(["Error Occured"]);
    } else {
      reject(["Error Occured"]);
    }
  });
}
