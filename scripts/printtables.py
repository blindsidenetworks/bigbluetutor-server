import rethinkdb as r
import dotenv
import os
import json

dotenv.load_dotenv("./.env")

r.connect(os.environ.get("DB_HOST"), int(os.environ.get("DB_PORT"))).repl()
tableList = r.db("deepstream").table_list().run()
print("Table list:")
print(tableList)
print()

for table in tableList:
    print("Table name: " + table)
    table = list(r.db("deepstream").table(table).run())
    print(json.dumps(table, indent=1, sort_keys=True))
    print()
