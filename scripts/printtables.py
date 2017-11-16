#Prints the contents of all the tables in a RethinkDB database
#You can also pass the names of specific tables as command-line arguments to print only those tables
#Users' messages are excluded from printing

import rethinkdb as r
import dotenv
import os
import json
import sys

dotenv.load_dotenv("./.env")

r.connect(os.environ.get("DB_HOST"), int(os.environ.get("DB_PORT"))).repl()
tableList = []
if(len(sys.argv) > 1):
    tableList = sys.argv[1:len(sys.argv)]
else:
    tableList = r.db("deepstream").table_list().run()

print("Table list:")
print(tableList)
print()


for table in tableList:
    print("Table name: " + table)
    table = list(r.db("deepstream").table(table).run())
    #.without("messages").run())
    print(json.dumps(table, indent=1, sort_keys=True))
    print()
