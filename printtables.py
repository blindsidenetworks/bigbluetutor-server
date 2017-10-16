import rethinkdb as r

r.connect("localhost", 28015).repl()
list = r.db("deepstream").table_list().run()
print("Table list:")
print(list)
print()

for table in list:
    print("Table name: " + table)
    print(r.db("deepstream").table(table).run())
    print()
