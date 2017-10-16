import rethinkdb as r

#If True, the Tables will be dropped, deleting the tables and their contents.
#If False, only the contents of the tables will be deleted. The tables themselves will remain.
dropTables = False

r.connect("localhost", 28015).repl()
list = r.db("deepstream").table_list().run()
print("Table list:")
print(list)
print()

if(dropTables):
    for table in list:
        print(r.db("deepstream").table_drop(table).run())
else:
    for table in list:
        print(r.db("deepstream").table(table).delete().run())
