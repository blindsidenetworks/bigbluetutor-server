#Use -d as a command-line argument to drop the tables instead of just clearing their contents

import rethinkdb as r
import dotenv
import os
import sys

dotenv.load_dotenv("./.env")

confirm = input("Are you sure you want to clear the database (y/N)? ").lower()
if(not(confirm == "yes" or confirm == "y")):
    print("Database not cleared")
    sys.exit()

r.connect(os.environ.get("DB_HOST"), int(os.environ.get("DB_PORT"))).repl()
list = r.db("deepstream").table_list().run()
print("Table list:")
print(list)
print()

if(len(sys.argv) > 1 and sys.argv[1] == "-d"):
    for table in list:
        print(r.db("deepstream").table_drop(table).run())
else:
    for table in list:
        print(r.db("deepstream").table(table).delete().run())
