import rethinkdb as r
import dotenv
import os

dotenv.load_dotenv("./.env")

r.connect(os.environ.get("DB_HOST"), int(os.environ.get("DB_PORT"))).repl()
list = r.db("deepstream").table_list().run()
print("Table list:")
print(list)
print()

for table in list:
    print("Table name: " + table)
    print(r.db("deepstream").table(table).run())
    print()
