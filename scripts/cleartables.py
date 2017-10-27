import rethinkdb as r
import dotenv
import os
import sys

dotenv.load_dotenv("./.env")

#If True, the Tables will be dropped, deleting the tables and their contents.
#If False, only the contents of the tables will be deleted. The tables themselves will remain.

r.connect(os.environ.get("DB_HOST"), int(os.environ.get("DB_PORT"))).repl()
list = r.db("deepstream").table_list().run()
print("Table list:")
print(list)
print()

if(len(sys.argv) > 1 and sys.argv[1] == "drop"):
    for table in list:
        print(r.db("deepstream").table_drop(table).run())
else:
    for table in list:
        print(r.db("deepstream").table(table).delete().run())
