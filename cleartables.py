import rethinkdb as r
r.connect("localhost", 28015).repl()
list = r.db("deepstream").table_list().run()
print(list)

for table in list:
  print(r.db("deepstream").table(table).delete().run())
  print(r.db("deepstream").table_drop(table).run())

